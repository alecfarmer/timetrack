# Plan: AI Integration for OnSite

## Context

OnSite has a fully built rewards/gamification system (XP, 105 badges, streaks, challenges, kudos, leaderboards, shop) and wellbeing monitoring (burnout scoring). The goal is to integrate AI across four directions: **Predictive Intelligence**, **AI-Personalized Gamification**, **Smart Anomaly Detection**, and **Conversational AI Assistant** — using OpenAI API with cost-effective model selection.

**Key design decisions:**
- OpenAI API: `gpt-4o-mini` for classification/scoring ($0.15/$0.60 per 1M tokens), `gpt-4o` only for complex chat reasoning ($2.50/$10 per 1M tokens)
- Estimated cost: ~$2-5/month for a 50-member org
- 4 feature flags for gradual rollout
- Non-blocking: AI processing never blocks entry creation
- Graceful degradation: if OpenAI is down, everything works normally without AI

---

## Phase 1: Foundation + Anomaly Detection

### 1A. Database Migration: `supabase/migrations/20260213_ai_foundation.sql`

**5 new tables:**

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `AiPrediction` | Cached predictions | `orgId`, `userId` (nullable), `type` (attendance/burnout/streak_risk/no_show/optimal_schedule), `prediction JSONB`, `confidence FLOAT`, `expiresAt`, `isActioned` |
| `AiAnomalyFlag` | Flagged anomalies | `orgId`, `userId`, `entryId`, `type` (unusual_hours/location_mismatch/pattern_break/rapid_entries/ghost_clock), `severity` (low/medium/high/critical), `description`, `metadata JSONB`, `status` (pending/reviewed/dismissed/confirmed), `reviewedBy`, `reviewedAt` |
| `AiConversation` | Chat history | `userId`, `orgId`, `messages JSONB[]`, `context JSONB`, `tokenCount INT`, `lastMessageAt` |
| `AiNudge` | Personalized nudges | `userId`, `orgId`, `type` (streak_risk/challenge_suggestion/badge_close/optimal_time/wellbeing), `message TEXT`, `metadata JSONB`, `deliveredAt`, `dismissedAt`, `actedOn BOOLEAN` |
| `AiUsageLog` | Cost tracking | `orgId`, `model TEXT`, `promptTokens INT`, `completionTokens INT`, `estimatedCost DECIMAL`, `feature TEXT`, `latencyMs INT` |

### 1B. Service Layer: `lib/ai/`

| File | Purpose |
|------|---------|
| `lib/ai/client.ts` | OpenAI client singleton, model selection helper (`getModel(task)`), response parsing, error handling with fallback |
| `lib/ai/cache.ts` | Simple in-memory + DB cache for predictions. Key: `{orgId}:{type}:{userId}:{date}`. TTL: predictions=6h, anomaly scores=1h |
| `lib/ai/rate-limiter.ts` | Per-org rate limiting (100 AI calls/hour default). Prevents runaway costs |
| `lib/ai/prompts.ts` | All prompt templates as tagged template functions. Centralized for easy iteration |
| `lib/ai/types.ts` | TypeScript types for all AI inputs/outputs |
| `lib/ai/usage.ts` | Log token usage to `AiUsageLog`, cost estimation |

### 1C. Anomaly Detection: `lib/ai/anomaly/`

| File | Purpose |
|------|---------|
| `lib/ai/anomaly/detector.ts` | `detectAnomalies(entry, userHistory)` — called after entry creation. Uses rule-based pre-filter + AI scoring |
| `lib/ai/anomaly/rules.ts` | Fast rule-based checks (no AI call needed): rapid successive entries (<2min apart), clock-in at 3am, >16h shift, weekend when never works weekends |
| `lib/ai/anomaly/scorer.ts` | AI-powered scoring for ambiguous cases. Sends 30-day pattern + current entry to `gpt-4o-mini`, gets anomaly probability + explanation |

**Detection types:**
- `unusual_hours` — Clock-in/out at times far outside user's normal pattern
- `pattern_break` — Sudden change in work patterns (always 9-5, suddenly 6am-2pm)
- `rapid_entries` — Multiple entries within seconds/minutes (possible app glitch or manipulation)
- `ghost_clock` — Clock-in without subsequent clock-out (or vice versa) that doesn't match normal patterns
- `overtime_spike` — Sudden jump in hours that deviates from historical norm

**Integration point:** `app/api/entries/route.ts` line ~376 (after rewards processing, non-blocking):
```typescript
// AI anomaly detection (non-blocking, fire-and-forget)
if (org && orgFeatures.aiAnomalyDetection) {
  detectAnomalies(user!.id, org.orgId, entry, getRequestTimezone(request))
    .catch(err => console.error("AI anomaly detection error:", err))
}
```

### 1D. Admin Anomaly Dashboard

- `app/api/admin/ai/anomalies/route.ts` — GET (list anomalies, filterable by severity/type/status), PATCH (review/dismiss/confirm)
- `app/(admin)/admin/ai/anomalies/page.tsx` — Anomaly review queue with severity badges, entry details, one-click review actions
- Add to `components/admin-sidebar.tsx` — "AI Insights" nav section

### 1E. Feature Flags

Add to `OrgFeatures` interface in `app/api/org/features/route.ts`:
```typescript
aiAnomalyDetection: boolean   // Phase 1
aiPredictions: boolean         // Phase 2
aiGamification: boolean        // Phase 3
aiAssistant: boolean           // Phase 4
```

### 1F. Environment Variable

Add `OPENAI_API_KEY` to `.env.local` and deployment config.

---

## Phase 2: Predictive Intelligence

### 2A. Prediction Engine: `lib/ai/predictions/`

| File | Purpose |
|------|---------|
| `lib/ai/predictions/attendance.ts` | `predictAttendance(orgId, date)` — Predicts who will be on-site tomorrow. Analyzes per-user patterns (day-of-week frequency, recent streak, leave requests). Model: `gpt-4o-mini` with structured output |
| `lib/ai/predictions/burnout.ts` | `predictBurnoutRisk(userId, orgId)` — Enhances existing rule-based burnout score (0-100) with AI pattern analysis. Detects gradual decline patterns human rules miss (e.g., slowly arriving later, shorter days, more break skips). Returns risk score + contributing factors + recommended actions |
| `lib/ai/predictions/streak.ts` | `predictStreakRisk(userId, orgId)` — Probability of streak break in next 1-3 days. Considers: day of week, historical miss patterns, current streak length, weather (via day-of-week proxy), upcoming holidays |
| `lib/ai/predictions/scheduling.ts` | `suggestOptimalSchedule(orgId)` — Analyzes attendance patterns to suggest optimal required days, identifies coverage gaps, recommends scheduling adjustments |

### 2B. Cron Job: `app/api/cron/ai-predictions/route.ts`

Runs nightly (via Vercel Cron or external scheduler):
1. For each org with `aiPredictions` enabled:
   - Generate tomorrow's attendance predictions
   - Score burnout risk for all active members
   - Score streak risk for members with active streaks
2. Cache results in `AiPrediction` table (TTL: 24h)
3. Log token usage to `AiUsageLog`

### 2C. API Routes

- `GET /api/admin/ai/predictions` — Tomorrow's attendance forecast, burnout risks, streak risks
- `GET /api/admin/ai/predictions/attendance` — Detailed attendance prediction with confidence per user
- `GET /api/admin/ai/predictions/burnout` — Enhanced burnout dashboard (AI score vs rule-based score comparison)

### 2D. Admin Dashboard Enhancement

- Add "AI Predictions" card to `app/(admin)/admin/page.tsx` — Tomorrow's predicted headcount, at-risk members
- Enhance `app/(admin)/admin/wellbeing/page.tsx` — Add AI burnout prediction alongside existing rule-based scores, show trend arrows and contributing factors

---

## Phase 3: AI-Personalized Gamification

### 3A. Adaptive Engine: `lib/ai/gamification/`

| File | Purpose |
|------|---------|
| `lib/ai/gamification/calibrator.ts` | `calibrateChallenges(userId, orgId)` — Analyzes user's completion rates, adjusts challenge difficulty. If user completes >80% easily → harder challenges. If <30% → easier. Returns difficulty multiplier (0.7-1.5) |
| `lib/ai/gamification/recommender.ts` | `recommendChallenges(userId, orgId, pool)` — Instead of random challenge selection, AI picks challenges the user is most likely to engage with (but not too easy). Considers: badge progress (what's close?), historical patterns, current streak, time of year |
| `lib/ai/gamification/nudges.ts` | `generateNudges(userId, orgId)` — Creates personalized motivational nudges. "You're 2 days from your Early Bird badge!", "Your streak is your longest ever — keep it going!", "Try clocking in before 9am to complete today's challenge" |
| `lib/ai/gamification/bonus.ts` | `calculateSmartBonus(userId, orgId, entryType)` — Replaces fixed 10% daily bonus chance with AI-determined probability. Users who are disengaging get higher bonus probability (re-engagement). Users on hot streaks get lower (they don't need it). Variable ratio stays but adapts per user |

### 3B. Integration Points

**Challenge generation** — Modify `lib/rewards/challenges.ts` `generateChallenges()`:
```typescript
// Before: selectWeightedRandom(pool, count)
// After:
if (orgFeatures.aiGamification) {
  const recommended = await recommendChallenges(userId, orgId, pool)
  // Use AI-recommended challenges instead of random
}
```

**Smart bonus** — Modify `lib/rewards/events.ts` `processRewardsEvent()` line ~51:
```typescript
// Before: Math.random() < 0.10
// After:
const bonusChance = orgFeatures.aiGamification
  ? await calculateSmartBonus(userId, orgId, entryType)
  : 0.10
const dailyBonus = entryType === "CLOCK_IN" && Math.random() < bonusChance
```

**Nudge delivery** — New `GET /api/rewards/nudges` endpoint, displayed in dashboard and rewards profile tab.

### 3C. Cron Job: `app/api/cron/ai-nudges/route.ts`

Runs daily at 7am (user's timezone):
1. For each user with active streak or recent activity:
   - Generate 1-2 personalized nudges
   - Store in `AiNudge` table
2. For users who haven't clocked in by afternoon:
   - Generate streak-risk nudge if applicable

### 3D. API Routes

- `GET /api/rewards/nudges` — Current nudges for the user
- `POST /api/rewards/nudges/:id/dismiss` — Mark nudge as dismissed
- `GET /api/admin/ai/gamification` — Engagement metrics, bonus distribution, challenge completion rates by AI vs random

---

## Phase 4: Conversational AI Assistant

### 4A. Chat Engine: `lib/ai/assistant/`

| File | Purpose |
|------|---------|
| `lib/ai/assistant/chat.ts` | `processMessage(userId, orgId, message)` — Main chat handler. Manages conversation context, tool calling, response generation. Model: `gpt-4o` (needs reasoning for natural conversation) |
| `lib/ai/assistant/tools.ts` | Tool definitions the AI can call: `getMyStats`, `getMyStreak`, `getMyBadges`, `getMySchedule`, `getTeamStatus` (admin), `getAttendancePrediction` (admin). Uses OpenAI function calling |
| `lib/ai/assistant/context.ts` | Builds system prompt with user context: role, current streak, level, recent activity, org policies. Keeps context window efficient |
| `lib/ai/assistant/safety.ts` | Input sanitization, PII filtering, response guardrails. Prevents prompt injection, ensures assistant stays on-topic (time tracking, rewards, scheduling) |

**Capabilities:**
- "How's my streak going?" → Shows streak status, risk assessment, shield count
- "What badges am I close to?" → Lists near-complete badges with specific actions needed
- "Who's in the office today?" → Current on-site members (uses existing `/api/admin/activity` data)
- "Predict tomorrow's attendance" (admin) → AI attendance forecast
- "Show me overtime trends this month" (admin) → Pulls and summarizes analytics
- "Why did my streak break?" → Analyzes streak history, explains what happened

### 4B. API Routes

- `POST /api/ai/chat` — Send message, get response (streaming via ReadableStream)
- `GET /api/ai/chat/history` — Conversation history (last 50 messages)
- `DELETE /api/ai/chat` — Clear conversation

### 4C. UI Components

- `components/ai/chat-widget.tsx` — Floating chat bubble (bottom-right), expandable chat panel with message history, typing indicator, tool-call result cards
- `components/ai/chat-message.tsx` — Individual message bubble (user/assistant), supports markdown, stat cards, badge previews
- Add chat widget to employee layout `app/(employee)/layout.tsx` and admin layout `app/(admin)/layout.tsx` (gated by feature flag)

---

## Phase 5: Polish & Optimization

### 5A. Weekly Insights Cron: `app/api/cron/ai-weekly-insights/route.ts`

Runs Sunday evening:
- Generates per-user "Week in Review" summary: hours worked, badges earned, streak status, comparison to previous week
- Generates org-wide insight for admins: attendance trends, top performers, engagement metrics
- Stores as `AiNudge` with type `weekly_insight`

### 5B. Cost Dashboard

- `app/(admin)/admin/ai/usage/page.tsx` — Token usage by feature, estimated monthly cost, model breakdown
- `GET /api/admin/ai/usage` — Usage stats from `AiUsageLog`

### 5C. Prompt Optimization

- A/B test prompt variations via metadata flags
- Track nudge `actedOn` rates to measure effectiveness
- Shorten prompts that work well, iterate on low-performing ones

---

## Files Summary

### New files (~30):
- 1 migration in `supabase/migrations/`
- 6 core modules in `lib/ai/` (client, cache, rate-limiter, prompts, types, usage)
- 3 anomaly modules in `lib/ai/anomaly/`
- 4 prediction modules in `lib/ai/predictions/`
- 4 gamification modules in `lib/ai/gamification/`
- 4 assistant modules in `lib/ai/assistant/`
- 4 API routes in `app/api/admin/ai/`
- 3 API routes in `app/api/ai/` and `app/api/rewards/nudges/`
- 3 cron routes in `app/api/cron/`
- 2 UI components in `components/ai/`
- 1 admin page in `app/(admin)/admin/ai/`

### Modified files (~8):
- `app/api/entries/route.ts` — Add AI anomaly detection hook (after line ~387)
- `app/api/org/features/route.ts` — Add 4 AI feature flags to `OrgFeatures`
- `lib/rewards/events.ts` — Smart bonus probability (line ~51)
- `lib/rewards/challenges.ts` — AI challenge recommendation (line ~137)
- `app/(employee)/layout.tsx` — Add chat widget
- `app/(admin)/layout.tsx` — Add chat widget
- `components/admin-sidebar.tsx` — Add "AI Insights" nav section
- `app/(admin)/admin/wellbeing/page.tsx` — Add AI burnout predictions

### Existing code to reuse:
- `lib/supabase.ts` — Service-role client for all AI DB operations
- `lib/auth.ts` — `getAuthUser()` for API route auth
- `lib/rate-limit.ts` — Pattern for per-org rate limiting (adapt for AI)
- `app/api/wellbeing/route.ts` — Burnout scoring logic (enhance, don't replace)
- `lib/rewards/events.ts` — `processRewardsEvent()` orchestration pattern
- `lib/rewards/challenges.ts` — `generateChallenges()` and `getChallengeTarget()`
- `contexts/realtime-context.tsx` — Add nudges to polling state

---

## Model Selection Matrix

| Feature | Model | Why | Est. tokens/call |
|---------|-------|-----|-------------------|
| Anomaly scoring | `gpt-4o-mini` | Classification task, structured output | ~500 in / ~100 out |
| Attendance prediction | `gpt-4o-mini` | Pattern matching, structured output | ~1000 in / ~200 out |
| Burnout risk | `gpt-4o-mini` | Scoring with factors, structured output | ~800 in / ~200 out |
| Streak risk | `gpt-4o-mini` | Simple probability estimation | ~400 in / ~100 out |
| Challenge calibration | `gpt-4o-mini` | Difficulty adjustment, simple reasoning | ~600 in / ~150 out |
| Nudge generation | `gpt-4o-mini` | Short text generation | ~400 in / ~100 out |
| Smart bonus | `gpt-4o-mini` | Simple probability output | ~300 in / ~50 out |
| Chat assistant | `gpt-4o` | Complex reasoning, natural conversation | ~2000 in / ~500 out |
| Weekly insights | `gpt-4o-mini` | Summarization | ~1500 in / ~300 out |

**Cost estimate (50-member org, moderate usage):**
- Anomaly: ~50 entries/day * 600 tokens = 30K tokens/day = $0.005/day
- Predictions: 50 users * 3 types * 1K tokens = 150K tokens/night = $0.025/night
- Gamification: 50 users * 2 nudges * 500 tokens = 50K tokens/day = $0.008/day
- Chat: ~20 messages/day * 2.5K tokens = 50K tokens/day = $0.50/day (gpt-4o)
- **Total: ~$2-5/month** (chat is the biggest cost driver)

---

## Verification

- `npm run typecheck` passes after each phase
- **Phase 1:** Create an entry → anomaly detector runs → anomaly appears in admin queue if flagged. OpenAI key missing → graceful fallback, entry still created normally
- **Phase 2:** Cron runs → predictions cached in DB → admin dashboard shows tomorrow's forecast and burnout risks with AI-enhanced scores
- **Phase 3:** User gets personalized nudges. Challenge selection uses AI recommendations. Daily bonus probability varies by engagement level
- **Phase 4:** Chat widget opens, user asks "how's my streak?" → assistant responds with streak data + badge proximity. Admin asks "who's likely to be in tomorrow?" → gets prediction
- **Phase 5:** Weekly insight nudge appears Sunday evening. Admin can view AI cost breakdown

## Implementation Order

Build phases sequentially (1→2→3→4→5). Within each phase: migration → service layer → API routes → UI. Phase 1 foundation (`lib/ai/client.ts`, cache, rate-limiter) is shared by all subsequent phases.
