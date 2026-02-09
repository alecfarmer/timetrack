# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build
npm run lint         # ESLint
npm run typecheck    # TypeScript type checking (tsc --noEmit)
```

## Tech Stack

- **Next.js 16** (App Router) with **React 19** and **TypeScript**
- **Supabase** (PostgreSQL + Auth + RLS) — `@supabase/ssr` for cookie-based sessions
- **Tailwind CSS v4** with Radix UI primitives, Framer Motion animations
- **Zod 4** for request validation (`lib/validations.ts`)
- **PWA** via `next-pwa` with IndexedDB offline queue (`lib/offline.ts`)

## Architecture

**OnSite** is a SaaS for time and attendance tracking with separate admin portal and employee app, multi-tenant organization support, geofencing, and offline-first sync.

### Route Structure

The app uses Next.js route groups to separate admin and employee experiences:

```
/                     -> Landing page (marketing)
/login, /signup       -> Auth pages
/app/                 -> Employee app (mobile-first, protected)
  /app/history        -> Time history calendar
  /app/leave          -> Leave/PTO requests
  /app/reports        -> Personal reports & stats
  /app/settings       -> User settings
/admin/               -> Admin portal (desktop-first, admin role required)
  /admin/             -> Dashboard with live activity & metrics
  /admin/team         -> Member management
  /admin/analytics    -> Team analytics
  /admin/timesheets   -> Timesheet approval
  /admin/wellbeing    -> Burnout monitoring
  /admin/shifts       -> Shift scheduling
  /admin/bulk-edit    -> Entry corrections
  /admin/audit        -> Audit log
  /admin/settings     -> Settings hub (features, policies, leave, payroll, alerts)
```

### Layouts & Navigation

- `app/(employee)/layout.tsx` — Employee layout with `EmployeeNav` (bottom nav on mobile, slim sidebar on desktop)
- `app/(admin)/layout.tsx` — Admin layout with `AdminSidebar` (full sidebar, desktop-only, hidden on mobile)
- Navigation components: `components/employee-nav.tsx`, `components/admin-sidebar.tsx`

### Auth Flow

Supabase Auth with email/password and OAuth. Middleware (`middleware.ts`) refreshes sessions on every request, redirects unauthenticated users to `/landing`, and protects `/admin/*` routes (requires ADMIN role). Public routes: `/login`, `/signup`, `/auth`, `/landing`.

### Supabase Client Pattern

Two clients exist:
- `lib/supabase/client.ts` — browser client (subject to RLS)
- `lib/supabase/server.ts` — server client with cookie handling for SSR

API routes use a **service-role client** (`lib/supabase.ts`) to bypass RLS. Auth is checked via `getAuthUser()` from `lib/auth.ts`.

### API Route Pattern

All routes in `app/api/` follow this structure:
1. Call `getAuthUser()` — returns `{ user, org, error }`, return early on error
2. Validate org membership (return 403 if missing)
3. Validate request body with Zod schemas from `lib/validations.ts`
4. Query Supabase with service-role client
5. Return JSON response

Rate limiting: 60 requests/minute per user (`lib/rate-limit.ts`).

### Key Domain Hooks

- `hooks/use-clock-state.ts` — main clock in/out logic, location selection, entry management, photo capture integration
- `hooks/use-geolocation.ts` — GPS tracking for geofencing
- `hooks/use-timer.ts` — live work duration display

### Timezone Handling

All timestamps stored in UTC. Browser timezone detected via `Intl.DateTimeFormat`, passed to API routes via `x-timezone` header. Date utilities in `lib/dates.ts` use `date-fns-tz` for formatting.

### Offline Support

IndexedDB queue (`lib/offline.ts`) stores pending entries when offline. Auto-syncs on reconnect with exponential backoff, max 5 retries, entries expire after 7 days.

### Multi-Tenant Model

Organizations own locations, members, policies, and entries. `Membership` table links users to orgs with ADMIN/MEMBER roles. Locations can be org-level (shared) or user-level (personal). Geofencing checks distance via Haversine formula (`lib/geo.ts`).

### Feature Flags

Org-level feature flags stored as JSONB on `Organization.features`. Managed via `/admin/features` and `/api/org/features`. Features include: photo verification, break tracking, timesheet approval, smart alerts, team analytics, entry corrections, audit log.

### Multi-Jurisdiction Policies

`PolicyConfig` supports jurisdiction-specific labor law compliance (overtime thresholds, meal/rest breaks, predictive scheduling). Resolution chain: jurisdiction-specific policy → org default → hardcoded defaults. Managed via `/admin/jurisdictions` and `/api/org/policy/jurisdictions`.

### Entry Corrections & Audit

`EntryCorrection` tracks edits with old/new values, reason, and approval status. Smart corrections auto-approve based on user history. All sensitive admin actions logged to `AuditLog` via `lib/audit.ts`.

### Timesheets & Payroll

`TimesheetSubmission` for weekly approval workflow. `PayrollMapping` configures export format (CSV, Gusto, ADP, Paychex, QuickBooks), pay codes, and rounding rules.

### Well-Being Monitoring

Burnout scoring computed from consecutive work days, overtime, break skips, and avg daily hours. Admin dashboard at `/admin/wellbeing`.

### Gamification System

Employee engagement via XP, badges, streaks, and challenges:
- **XP** — Earned from clock-ins, full days, streaks, and badge unlocks
- **Badges** — Early Bird (before 7am), Night Owl (after 8pm), Streak Master, Iron Will, etc.
- **Streaks** — Consecutive work days tracked with milestone rewards
- **Challenges** — Weekly/monthly goals (e.g., "5 full days this week")

API: `/api/streaks` returns current streak, XP, level, badges, and active challenges. All time-based calculations use the user's timezone (via `x-timezone` header) for accurate badge/streak awards.

### Admin Dashboard

Live activity feed and at-a-glance metrics:
- **Activity Feed** — Real-time clock in/out events (`/api/admin/activity`)
- **Metrics** — On-site count, today's clock-ins, pending approvals, compliance rate (`/api/admin/metrics`)
- **Settings Hub** — Consolidated org settings at `/admin/settings`

### UI Components

`components/ui/` contains Radix UI wrappers (shadcn/ui pattern). Domain components are in `components/` root. Global auth state via React Context (`contexts/auth-context.tsx`).

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
DEFAULT_TIMEZONE=America/New_York
```
