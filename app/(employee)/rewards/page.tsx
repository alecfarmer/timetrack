"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  Trophy, Flame, Target, Star, Award, Clock, Sparkles, Zap,
  TrendingUp, Filter, Lock, Gift, Heart, ShoppingCart,
  Crown, Users, Coins, Shield, ChevronRight,
} from "lucide-react"
import { cn, tzHeaders } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { RewardsTabs } from "@/components/rewards/rewards-tabs"
import { ProfileHero } from "@/components/rewards/profile-hero"
import { ChallengeCard } from "@/components/rewards/challenge-card"
import { LeaderboardTable } from "@/components/rewards/leaderboard-table"
import { ShopItemCard } from "@/components/rewards/shop-item-card"
import { KudosSendModal } from "@/components/rewards/kudos-send-modal"

// ─── Types ──────────────────────────────────────────────────

interface BadgeData {
  badge: {
    id: string; slug: string; name: string; description: string; icon: string
    category: string; rarity: string; isHidden: boolean; setId: string | null
    xpReward: number; coinReward: number
  }
  earned: boolean
  earnedAt: string | null
  progress: number
  target: number
}

interface ActiveChallengeData {
  id: string
  definition: { name: string; description: string; icon: string; type: string } | null
  progress: number; target: number; status: string
  expiresAt: string; xpReward: number; coinReward: number
}

interface ProfileData {
  profile: {
    totalXp: number; level: number; currentStreak: number; longestStreak: number
    streakShields: number; coins: number; xpMultiplier: number
    showcaseBadges: string[]; leaderboardOptIn: boolean; titleId: string | null
    activeTitle?: { name: string } | null
  }
  levelProgress: {
    level: number; title: string; xpInLevel: number; xpForLevel: number
    progress: number; nextLevel: { level: number; title: string } | null
  }
  earnedBadges: Array<{ id: string; badge: { name: string; icon: string; slug: string }; earnedAt: string }>
  activeChallenges: ActiveChallengeData[]
  titles: Array<{ id: string; name: string; unlocked?: boolean; isActive?: boolean }>
  unclaimedCount: number
}

// ─── Constants ──────────────────────────────────────────────

const categoryNames: Record<string, string> = {
  streak: "Streaks", milestone: "Milestones", special: "Special",
  time: "Time-Based", consistency: "Consistency", social: "Social",
  seasonal: "Seasonal", hidden: "Hidden", collection: "Collection",
}

// ─── Page ───────────────────────────────────────────────────

export default function RewardsPage() {
  const [activeTab, setActiveTab] = useState("overview")
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [badges, setBadges] = useState<{ badges: BadgeData[]; sets: Record<string, { badges: string[]; earned: string[]; complete: boolean }> } | null>(null)
  const [loading, setLoading] = useState(true)

  // Challenge state
  const [challenges, setChallenges] = useState<{ active: ActiveChallengeData[]; history: ActiveChallengeData[] } | null>(null)
  const [claiming, setClaiming] = useState<string | null>(null)

  // Leaderboard state
  const [leaderboard, setLeaderboard] = useState<{ rankings: Array<{ userId: string; displayName: string; value: number; rank: number }>; period: string; category: string } | null>(null)
  const [lbPeriod, setLbPeriod] = useState("weekly")
  const [lbCategory, setLbCategory] = useState("xp")
  const [lbLoading, setLbLoading] = useState(false)

  // Kudos state
  const [kudosBudget, setKudosBudget] = useState(5)
  const [showKudosModal, setShowKudosModal] = useState(false)
  const [kudosReceived, setKudosReceived] = useState<Array<{ id: string; category: string; message: string | null; createdAt: string; isAnonymous: boolean }>>([])
  const [teammates, setTeammates] = useState<Array<{ id: string; name: string }>>([])

  // Shop state
  const [shopItems, setShopItems] = useState<Array<{ id: string; name: string; description: string | null; icon: string; costCoins: number; category: string; stock: number | null; maxPerUser: number | null; userRedemptions: number; canPurchase: boolean }>>([])
  const [redeeming, setRedeeming] = useState<string | null>(null)

  // Badge filters
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [selectedBadge, setSelectedBadge] = useState<BadgeData | null>(null)

  // ─── Data Loading ───────────────────────────────────

  useEffect(() => {
    const headers = tzHeaders()
    Promise.all([
      fetch("/api/rewards/profile", { headers }).then((r) => r.ok ? r.json() : null),
      fetch("/api/rewards/badges", { headers }).then((r) => r.ok ? r.json() : null),
    ])
      .then(([profileData, badgesData]) => {
        if (profileData?.profile) setProfile(profileData)
        if (badgesData) setBadges(badgesData)
        setLoading(false)
      })
      .catch((err) => {
        console.error("Failed to load rewards:", err)
        setLoading(false)
      })
  }, [])

  // Load tab-specific data on tab change
  useEffect(() => {
    const headers = tzHeaders()

    if (activeTab === "overview" && !challenges) {
      fetch("/api/rewards/challenges", { headers })
        .then((r) => r.json())
        .then(setChallenges)
        .catch(console.error)
    }

    if (activeTab === "team") {
      loadLeaderboard()
      if (kudosReceived.length === 0) {
        Promise.all([
          fetch("/api/rewards/kudos/budget", { headers }).then((r) => r.json()),
          fetch("/api/rewards/kudos?tab=received", { headers }).then((r) => r.json()),
        ])
          .then(([budget, received]) => {
            setKudosBudget(budget.remaining)
            setKudosReceived(received.kudos || [])
          })
          .catch(console.error)
      }
    }

    if (activeTab === "shop" && shopItems.length === 0) {
      fetch("/api/rewards/shop", { headers })
        .then((r) => r.json())
        .then((data) => setShopItems(data.items || []))
        .catch(console.error)
    }
  }, [activeTab])

  const loadLeaderboard = useCallback(() => {
    setLbLoading(true)
    fetch(`/api/rewards/leaderboard?period=${lbPeriod}&category=${lbCategory}`, { headers: tzHeaders() })
      .then((r) => r.json())
      .then((data) => {
        setLeaderboard(data)
        setLbLoading(false)
      })
      .catch(() => setLbLoading(false))
  }, [lbPeriod, lbCategory])

  useEffect(() => {
    if (activeTab === "team") loadLeaderboard()
  }, [lbPeriod, lbCategory, activeTab, loadLeaderboard])

  // ─── Handlers ───────────────────────────────────────

  const handleClaim = async (challengeId: string) => {
    setClaiming(challengeId)
    try {
      const res = await fetch("/api/rewards/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...tzHeaders() },
        body: JSON.stringify({ challengeId }),
      })
      if (res.ok) {
        // Refresh challenges and profile
        const [newChallenges, newProfile] = await Promise.all([
          fetch("/api/rewards/challenges", { headers: tzHeaders() }).then((r) => r.json()),
          fetch("/api/rewards/profile", { headers: tzHeaders() }).then((r) => r.json()),
        ])
        setChallenges(newChallenges)
        setProfile(newProfile)
      }
    } finally {
      setClaiming(null)
    }
  }

  const handleSendKudos = async (data: { toUserId: string; category: string; message?: string; isAnonymous: boolean }) => {
    const res = await fetch("/api/rewards/kudos", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...tzHeaders() },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error("Failed to send kudos")
    const result = await res.json()
    setKudosBudget(result.remaining)
  }

  const handleRedeem = async (itemId: string) => {
    setRedeeming(itemId)
    try {
      const res = await fetch("/api/rewards/shop/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...tzHeaders() },
        body: JSON.stringify({ shopItemId: itemId }),
      })
      if (res.ok) {
        // Refresh shop and profile
        const [newShop, newProfile] = await Promise.all([
          fetch("/api/rewards/shop", { headers: tzHeaders() }).then((r) => r.json()),
          fetch("/api/rewards/profile", { headers: tzHeaders() }).then((r) => r.json()),
        ])
        setShopItems(newShop.items || [])
        setProfile(newProfile)
      }
    } finally {
      setRedeeming(null)
    }
  }

  // ─── Computed ───────────────────────────────────────

  const filteredBadges = useMemo(() => {
    if (!badges) return []
    return badges.badges.filter((b) => {
      if (b.badge.isHidden && !b.earned) return false
      if (categoryFilter !== "all" && b.badge.category !== categoryFilter) return false
      return true
    })
  }, [badges, categoryFilter])

  const earnedBadges = useMemo(() => filteredBadges.filter((b) => b.earned), [filteredBadges])
  const lockedBadges = useMemo(() => filteredBadges.filter((b) => !b.earned), [filteredBadges])

  // ─── Tabs ───────────────────────────────────────────

  const tabs = [
    { id: "overview", label: "Overview", icon: <Star className="h-4 w-4" /> },
    { id: "badges", label: "Badges", icon: <Award className="h-4 w-4" /> },
    { id: "team", label: "Team", icon: <Users className="h-4 w-4" /> },
    { id: "shop", label: "Shop", icon: <ShoppingCart className="h-4 w-4" />, badge: profile?.unclaimedCount },
  ]

  // ─── Loading ────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
          <p className="text-muted-foreground font-medium">Loading rewards...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center py-32 bg-background">
        <p className="text-muted-foreground">Failed to load rewards</p>
      </div>
    )
  }

  const p = profile.profile
  const lp = profile.levelProgress

  return (
    <div className="flex flex-col bg-background">
      <header className="hidden lg:block sticky top-0 z-40 bg-card border-b">
        <div className="flex items-center justify-between px-8 h-16 max-w-6xl mx-auto">
          <h1 className="text-xl font-semibold">Rewards & Achievements</h1>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 pb-24 lg:pb-8">
        <div className="max-w-6xl mx-auto px-4 py-6 lg:px-8">
          {/* Tabs */}
          <div className="mb-6 border-b pb-3">
            <RewardsTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
          </div>

          {/* ═══ OVERVIEW TAB ═══ */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <ProfileHero
                level={lp.level}
                title={lp.title}
                totalXp={p.totalXp}
                xpInLevel={lp.xpInLevel}
                xpForLevel={lp.xpForLevel}
                progress={lp.progress}
                nextLevelTitle={lp.nextLevel?.title || null}
                nextLevel={lp.nextLevel?.level || null}
                currentStreak={p.currentStreak}
                streakShields={p.streakShields}
                xpMultiplier={p.xpMultiplier}
                coins={p.coins}
                activeTitle={p.activeTitle?.name}
              />

              {/* Recent Badges */}
              {profile.earnedBadges.length > 0 && (
                <Card className="border-0 shadow-xl">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Award className="h-5 w-5 text-amber-500" />
                      <h3 className="font-semibold">Recent Badges</h3>
                      <Badge variant="secondary">{profile.earnedBadges.length} earned</Badge>
                    </div>
                    <div className="flex gap-3 overflow-x-auto pb-2">
                      {profile.earnedBadges.slice(0, 8).map((eb) => (
                        <div key={eb.id} className="flex flex-col items-center gap-1 min-w-[64px]">
                          <span className="text-2xl">{eb.badge.icon}</span>
                          <span className="text-[10px] font-medium text-center leading-tight">{eb.badge.name}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Active Challenges Preview */}
              {profile.activeChallenges.length > 0 && (
                <Card className="border-0 shadow-xl">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-green-500" />
                        <h3 className="font-semibold">Active Challenges</h3>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {profile.activeChallenges.slice(0, 3).map((c) => (
                        <ChallengeCard
                          key={c.id}
                          name={c.definition?.name || "Challenge"}
                          description={c.definition?.description || ""}
                          icon={c.definition?.icon || "🎯"}
                          type={c.definition?.type || "daily"}
                          progress={c.progress}
                          target={c.target}
                          xpReward={c.xpReward}
                          coinReward={c.coinReward}
                          expiresAt={c.expiresAt}
                          status={c.status}
                          onClaim={c.status === "completed" ? () => handleClaim(c.id) : undefined}
                          claiming={claiming === c.id}
                        />
                      ))}
                    </div>

                    {/* Challenge history */}
                    {challenges?.history && challenges.history.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Completed</h4>
                        <div className="space-y-2">
                          {challenges.history.map((c) => (
                            <div key={c.id} className="flex items-center gap-2 p-2 rounded-lg bg-green-500/10 text-green-600">
                              <span>{c.definition?.icon || "✓"}</span>
                              <span className="text-xs font-medium flex-1">{c.definition?.name}</span>
                              <Badge variant="secondary" className="text-[10px] bg-green-500/20 text-green-600">+{c.xpReward} XP</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* ═══ BADGES TAB ═══ */}
          {activeTab === "badges" && (
            <Card className="border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-amber-500" />
                    <h2 className="text-lg font-semibold">Badge Collection</h2>
                    <Badge variant="secondary">{badges?.badges.filter((b) => b.earned).length || 0}/{badges?.badges.filter((b) => !b.badge.isHidden || b.earned).length || 0}</Badge>
                  </div>
                </div>

                {/* Category filters */}
                <div className="flex flex-wrap gap-1.5 mb-4 pb-4 border-b">
                  <Button variant={categoryFilter === "all" ? "default" : "outline"} size="sm" className="h-7 text-xs" onClick={() => setCategoryFilter("all")}>All</Button>
                  {Object.keys(categoryNames).map((cat) => (
                    <Button key={cat} variant={categoryFilter === cat ? "default" : "outline"} size="sm" className="h-7 text-xs capitalize" onClick={() => setCategoryFilter(cat)}>
                      {categoryNames[cat]}
                    </Button>
                  ))}
                </div>

                {/* Badge Detail */}
                <AnimatePresence>
                  {selectedBadge && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={cn(
                        "mb-4 p-6 rounded-2xl border text-center relative",
                        selectedBadge.earned
                          ? "bg-card border-border"
                          : "bg-muted/30 border-dashed border-muted-foreground/30"
                      )}
                    >
                      <button onClick={() => setSelectedBadge(null)} className="absolute top-3 left-3 text-xs text-muted-foreground hover:text-foreground">← Back</button>
                      <span className={cn("text-6xl block mb-3", !selectedBadge.earned && "grayscale opacity-50")}>
                        {selectedBadge.badge.icon}
                      </span>
                      <h3 className="text-xl font-bold mb-2">{selectedBadge.badge.name}</h3>
                      <div className="flex items-center justify-center gap-2 mb-3">
                        <Badge variant="outline" className="text-xs capitalize">{selectedBadge.badge.rarity}</Badge>
                        <Badge variant="secondary" className="text-xs bg-amber-500/10 text-amber-500">+{selectedBadge.badge.xpReward} XP</Badge>
                        {selectedBadge.badge.coinReward > 0 && (
                          <Badge variant="secondary" className="text-xs bg-yellow-500/10 text-yellow-600">+{selectedBadge.badge.coinReward} coins</Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground mb-4">{selectedBadge.badge.description}</p>
                      <div className="max-w-xs mx-auto">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium tabular-nums">{selectedBadge.progress} / {selectedBadge.target}</span>
                        </div>
                        <Progress value={selectedBadge.target > 0 ? Math.min(100, (selectedBadge.progress / selectedBadge.target) * 100) : 0} className="h-3" />
                      </div>
                      {selectedBadge.earned && selectedBadge.earnedAt ? (
                        <p className="text-xs text-muted-foreground mt-4">Earned {formatDistanceToNow(new Date(selectedBadge.earnedAt), { addSuffix: true })}</p>
                      ) : (
                        <p className="text-xs text-muted-foreground mt-4 flex items-center justify-center gap-1"><Lock className="h-3 w-3" /> Keep going!</p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Badge Grids */}
                {!selectedBadge && (
                  <>
                    {earnedBadges.length > 0 && (
                      <div className="mb-6">
                        <p className="text-sm font-medium text-muted-foreground mb-3">Earned ({earnedBadges.length})</p>
                        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
                          {earnedBadges.map((b) => (
                            <button
                              key={b.badge.id}
                              onClick={() => setSelectedBadge(b)}
                              className="flex flex-col items-center gap-1.5 p-3 rounded-xl text-center border bg-card hover:bg-accent transition-colors"
                            >
                              <span className="text-2xl">{b.badge.icon}</span>
                              <span className="text-[10px] font-medium leading-tight line-clamp-2">{b.badge.name}</span>
                              <Badge variant="outline" className="text-[8px] px-1 py-0 capitalize">{b.badge.rarity}</Badge>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {lockedBadges.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-3"><Lock className="h-3.5 w-3.5 inline mr-1" />Locked ({lockedBadges.length})</p>
                        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
                          {lockedBadges.map((b) => (
                            <button
                              key={b.badge.id}
                              onClick={() => setSelectedBadge(b)}
                              className="flex flex-col items-center gap-1.5 p-3 rounded-xl text-center bg-muted/30 border border-dashed border-muted-foreground/20 opacity-60 hover:opacity-80 transition-opacity"
                            >
                              {b.badge.isHidden ? (
                                <span className="text-2xl">???</span>
                              ) : (
                                <span className="text-2xl grayscale">{b.badge.icon}</span>
                              )}
                              <span className="text-[10px] font-medium leading-tight line-clamp-2 text-muted-foreground">{b.badge.isHidden ? "???" : b.badge.name}</span>
                              <Progress value={b.target > 0 ? (b.progress / b.target) * 100 : 0} className="h-1 w-full mt-1" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Collection Sets */}
                    {badges?.sets && Object.keys(badges.sets).length > 0 && (
                      <div className="mt-6 pt-6 border-t">
                        <h3 className="font-semibold mb-3 flex items-center gap-2"><Gift className="h-4 w-4 text-purple-500" /> Collection Sets</h3>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          {Object.entries(badges.sets).map(([setId, set]) => (
                            <Card key={setId} className={cn("border", set.complete && "border-purple-500/50 bg-purple-500/5")}>
                              <CardContent className="p-4">
                                <h4 className="font-medium capitalize mb-2">{setId.replace("_", " ")}</h4>
                                <div className="flex items-center gap-2 mb-2">
                                  <Progress value={(set.earned.length / set.badges.length) * 100} className="h-2 flex-1" />
                                  <span className="text-xs tabular-nums">{set.earned.length}/{set.badges.length}</span>
                                </div>
                                {set.complete && <Badge variant="secondary" className="text-xs bg-purple-500/10 text-purple-500">Set Complete!</Badge>}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* ═══ TEAM TAB ═══ */}
          {activeTab === "team" && (
            <div className="space-y-6">
              {/* Leaderboard */}
              <Card className="border-0 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Crown className="h-5 w-5 text-amber-500" />
                    <h2 className="text-lg font-semibold">Leaderboard</h2>
                  </div>

                  {/* Period / Category toggles */}
                  <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b">
                    <div className="flex gap-1">
                      {["weekly", "monthly"].map((per) => (
                        <Button key={per} variant={lbPeriod === per ? "default" : "outline"} size="sm" className="h-7 text-xs capitalize" onClick={() => setLbPeriod(per)}>
                          {per}
                        </Button>
                      ))}
                    </div>
                    <div className="flex gap-1">
                      {["xp", "streak", "kudos"].map((c) => (
                        <Button key={c} variant={lbCategory === c ? "default" : "outline"} size="sm" className="h-7 text-xs capitalize" onClick={() => setLbCategory(c)}>
                          {c}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <LeaderboardTable
                    rankings={leaderboard?.rankings || []}
                    currentUserId={profile?.profile ? "" : ""}
                    category={lbCategory}
                    loading={lbLoading}
                  />
                </CardContent>
              </Card>

              {/* Kudos */}
              <Card className="border-0 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Heart className="h-5 w-5 text-pink-500" />
                      <h2 className="text-lg font-semibold">Kudos</h2>
                    </div>
                    <Button onClick={() => setShowKudosModal(true)} className="bg-pink-600 hover:bg-pink-700">
                      <Heart className="h-4 w-4 mr-1.5" />
                      Send Kudos ({kudosBudget} left)
                    </Button>
                  </div>

                  {kudosReceived.length > 0 ? (
                    <div className="space-y-3">
                      {kudosReceived.map((k) => (
                        <div key={k.id} className="p-3 rounded-xl bg-pink-500/5 border border-pink-500/20">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary" className="text-xs capitalize bg-pink-500/10 text-pink-600">
                              {k.category.replace(/_/g, " ")}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">
                              {formatDistanceToNow(new Date(k.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                          {k.message && <p className="text-sm text-muted-foreground">{k.message}</p>}
                          {k.isAnonymous && <p className="text-[10px] text-muted-foreground italic">From anonymous</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Heart className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
                      <p className="text-muted-foreground">No kudos received yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <KudosSendModal
                isOpen={showKudosModal}
                onClose={() => setShowKudosModal(false)}
                onSend={handleSendKudos}
                teammates={teammates}
                remaining={kudosBudget}
              />
            </div>
          )}

          {/* ═══ SHOP TAB ═══ */}
          {activeTab === "shop" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-amber-500" />
                  <h2 className="text-lg font-semibold">Rewards Shop</h2>
                </div>
                <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">
                  <Coins className="h-3.5 w-3.5 mr-1" />
                  {p.coins} coins
                </Badge>
              </div>

              {shopItems.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {shopItems.map((item) => (
                    <ShopItemCard
                      key={item.id}
                      {...item}
                      onRedeem={handleRedeem}
                      redeeming={redeeming === item.id}
                    />
                  ))}
                </div>
              ) : (
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-8 text-center">
                    <ShoppingCart className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
                    <p className="text-muted-foreground">No items in the shop yet. Ask your admin to add some!</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
