"use client"

import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ThemeToggle } from "@/components/theme-toggle"
import { BottomNav } from "@/components/bottom-nav"
import {
  Trophy,
  Flame,
  Target,
  Star,
  Award,
  Clock,
  Calendar,
  ChevronRight,
  Sparkles,
  Zap,
  TrendingUp,
  Filter,
  Gift,
  Lock,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { format, formatDistanceToNow } from "date-fns"

interface BadgeData {
  id: string
  name: string
  description: string
  icon: string
  category: "streak" | "milestone" | "special" | "time" | "consistency"
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary"
  xp: number
  earnedAt: string | null
  progress?: number
  target?: number
}

interface Challenge {
  id: string
  name: string
  description: string
  icon: string
  type: "daily" | "weekly" | "monthly"
  target: number
  progress: number
  xpReward: number
  expiresAt: string
  completed: boolean
}

interface Level {
  level: number
  name: string
  minXp: number
  maxXp: number
}

interface Stats {
  earlyBirdCount: number
  nightOwlCount: number
  onTimeCount: number
  breaksTaken: number
  weekendDays: number
  fullDays: number
  overtimeDays: number
  avgClockIn: number | null
}

interface RewardsData {
  currentStreak: number
  longestStreak: number
  totalOnsiteDays: number
  totalHours: number
  thisMonthDays: number
  perfectWeeks: number
  badges: BadgeData[]
  xp: number
  level: Level
  nextLevel: Level
  xpProgress: number
  xpToNext: number
  challenges: Challenge[]
  stats: Stats
}

const LEVELS: Level[] = [
  { level: 1, name: "Newcomer", minXp: 0, maxXp: 100 },
  { level: 2, name: "Regular", minXp: 100, maxXp: 250 },
  { level: 3, name: "Committed", minXp: 250, maxXp: 500 },
  { level: 4, name: "Dedicated", minXp: 500, maxXp: 1000 },
  { level: 5, name: "Reliable", minXp: 1000, maxXp: 2000 },
  { level: 6, name: "Standout", minXp: 2000, maxXp: 3500 },
  { level: 7, name: "Star", minXp: 3500, maxXp: 5500 },
  { level: 8, name: "Champion", minXp: 5500, maxXp: 8000 },
  { level: 9, name: "Elite", minXp: 8000, maxXp: 12000 },
  { level: 10, name: "Legend", minXp: 12000, maxXp: 999999 },
]

const rarityColors: Record<string, string> = {
  common: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  uncommon: "bg-green-500/20 text-green-400 border-green-500/30",
  rare: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  epic: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  legendary: "bg-amber-500/20 text-amber-400 border-amber-500/30",
}

const rarityGlow: Record<string, string> = {
  common: "",
  uncommon: "shadow-green-500/20 shadow-lg",
  rare: "shadow-blue-500/30 shadow-lg",
  epic: "shadow-purple-500/40 shadow-xl",
  legendary: "shadow-amber-500/50 shadow-xl animate-pulse",
}

const rarityBorder: Record<string, string> = {
  common: "border-slate-500/30",
  uncommon: "border-green-500/50",
  rare: "border-blue-500/50",
  epic: "border-purple-500/50",
  legendary: "border-amber-500/50",
}

const categoryIcons: Record<string, string> = {
  streak: "🔥",
  milestone: "🏆",
  special: "⭐",
  time: "⏰",
  consistency: "📊",
}

const categoryNames: Record<string, string> = {
  streak: "Streaks",
  milestone: "Milestones",
  special: "Special",
  time: "Time-Based",
  consistency: "Consistency",
}

export default function RewardsPage() {
  const [data, setData] = useState<RewardsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedBadge, setSelectedBadge] = useState<BadgeData | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [rarityFilter, setRarityFilter] = useState<string>("all")
  const [showEarnedOnly, setShowEarnedOnly] = useState(false)

  useEffect(() => {
    fetch("/api/streaks")
      .then((res) => res.json())
      .then((data) => {
        setData(data)
        setLoading(false)
      })
      .catch((err) => {
        console.error(err)
        setLoading(false)
      })
  }, [])

  const filteredBadges = useMemo(() => {
    if (!data) return []
    return data.badges.filter((badge) => {
      if (categoryFilter !== "all" && badge.category !== categoryFilter) return false
      if (rarityFilter !== "all" && badge.rarity !== rarityFilter) return false
      if (showEarnedOnly && !badge.earnedAt) return false
      return true
    })
  }, [data, categoryFilter, rarityFilter, showEarnedOnly])

  const earnedBadges = useMemo(() => filteredBadges.filter((b) => b.earnedAt), [filteredBadges])
  const lockedBadges = useMemo(() => filteredBadges.filter((b) => !b.earnedAt), [filteredBadges])

  const badgesByCategory = useMemo(() => {
    if (!data) return {}
    const result: Record<string, BadgeData[]> = {}
    for (const badge of data.badges) {
      if (!result[badge.category]) result[badge.category] = []
      result[badge.category].push(badge)
    }
    return result
  }, [data])

  const xpProgressPercent = data && data.xpToNext > 0
    ? Math.min(100, (data.xpProgress / data.xpToNext) * 100)
    : 100

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 animate-ping absolute inset-0" />
            <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center">
              <Trophy className="h-8 w-8 text-amber-500" />
            </div>
          </div>
          <p className="text-muted-foreground font-medium">Loading rewards...</p>
        </motion.div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p className="text-muted-foreground">Failed to load rewards</p>
      </div>
    )
  }

  const activeChallenges = data.challenges.filter((c) => !c.completed)
  const completedChallenges = data.challenges.filter((c) => c.completed)

  return (
    <motion.div
      className="flex flex-col min-h-screen bg-background"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b lg:ml-64">
        <div className="flex items-center justify-between px-4 h-16 max-w-6xl mx-auto lg:px-8">
          <div className="flex items-center gap-3 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Trophy className="h-5 w-5 text-amber-500" />
            </div>
            <h1 className="text-lg font-bold">Rewards</h1>
          </div>
          <h1 className="hidden lg:block text-xl font-semibold">Rewards & Achievements</h1>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 pb-24 lg:pb-8 lg:ml-64">
        <div className="max-w-6xl mx-auto px-4 py-6 lg:px-8">
          {/* Hero Level Card */}
          <Card className="border-0 shadow-xl mb-6 overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500" />
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                {/* Level Badge */}
                <div className="flex items-center gap-4">
                  <motion.div
                    className="relative"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.2 }}
                  >
                    <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 flex flex-col items-center justify-center text-white shadow-2xl shadow-orange-500/30">
                      <span className="text-4xl font-bold">{data.level.level}</span>
                      <span className="text-[10px] uppercase tracking-wider opacity-80">Level</span>
                    </div>
                    <motion.div
                      className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", delay: 0.4 }}
                    >
                      <Star className="h-4 w-4 text-primary-foreground fill-current" />
                    </motion.div>
                  </motion.div>

                  <div>
                    <h2 className="text-2xl font-bold">{data.level.name}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 border-amber-500/30">
                        <Zap className="h-3 w-3 mr-1" />
                        {data.xp.toLocaleString()} XP
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* XP Progress */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Progress to {data.nextLevel.name}</span>
                    <span className="text-sm font-medium tabular-nums">
                      {data.xpProgress.toLocaleString()} / {data.xpToNext.toLocaleString()} XP
                    </span>
                  </div>
                  <div className="relative">
                    <Progress value={xpProgressPercent} className="h-4" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-primary-foreground drop-shadow">
                        {Math.round(xpProgressPercent)}%
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    <Sparkles className="h-3 w-3 inline mr-1 text-amber-500" />
                    {(data.xpToNext - data.xpProgress).toLocaleString()} XP needed to reach Level {data.nextLevel.level}
                  </p>
                </div>
              </div>

              {/* Level Progression */}
              <div className="mt-6 pt-6 border-t">
                <p className="text-xs font-medium text-muted-foreground mb-3">LEVEL PROGRESSION</p>
                <div className="flex items-center gap-1">
                  {LEVELS.map((level, i) => (
                    <div key={level.level} className="flex-1 relative group">
                      <div
                        className={cn(
                          "h-2 rounded-full transition-all",
                          data.xp >= level.minXp
                            ? "bg-gradient-to-r from-amber-500 to-orange-500"
                            : "bg-muted"
                        )}
                      />
                      {data.level.level === level.level && (
                        <motion.div
                          className="absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-amber-500 border-2 border-background shadow-lg"
                          layoutId="level-indicator"
                        />
                      )}
                      <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-popover border rounded px-2 py-1 text-[10px] whitespace-nowrap shadow-lg transition-opacity z-10">
                        Lv.{level.level} {level.name}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
                  <span>1</span>
                  <span>10</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              { icon: Flame, value: data.currentStreak, label: "Day Streak", color: "text-orange-500", bg: "bg-orange-500/10" },
              { icon: Trophy, value: earnedBadges.length, label: "Badges Earned", color: "text-amber-500", bg: "bg-amber-500/10" },
              { icon: Target, value: completedChallenges.length, label: "Challenges Done", color: "text-green-500", bg: "bg-green-500/10" },
              { icon: Clock, value: `${data.totalHours}h`, label: "Total Hours", color: "text-blue-500", bg: "bg-blue-500/10" },
            ].map((stat) => (
              <Card key={stat.label} className="border-0 shadow-lg">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", stat.bg)}>
                    <stat.icon className={cn("h-5 w-5", stat.color)} />
                  </div>
                  <div>
                    <p className={cn("text-xl font-bold tabular-nums", stat.color)}>{stat.value}</p>
                    <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Badges Collection */}
            <div className="lg:col-span-2 space-y-4">
              <Card className="border-0 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-amber-500" />
                      <h2 className="text-lg font-semibold">Badge Collection</h2>
                      <Badge variant="secondary" className="ml-2">
                        {data.badges.filter(b => b.earnedAt).length}/{data.badges.length}
                      </Badge>
                    </div>
                  </div>

                  {/* Filters */}
                  <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b">
                    <div className="flex items-center gap-1 mr-2">
                      <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Filter:</span>
                    </div>

                    {/* Category filter */}
                    <div className="flex gap-1 flex-wrap">
                      <Button
                        variant={categoryFilter === "all" ? "default" : "outline"}
                        size="sm"
                        className="h-7 text-xs px-2"
                        onClick={() => setCategoryFilter("all")}
                      >
                        All
                      </Button>
                      {Object.keys(categoryNames).map((cat) => (
                        <Button
                          key={cat}
                          variant={categoryFilter === cat ? "default" : "outline"}
                          size="sm"
                          className="h-7 text-xs px-2"
                          onClick={() => setCategoryFilter(cat)}
                        >
                          {categoryIcons[cat]} {categoryNames[cat]}
                        </Button>
                      ))}
                    </div>

                    {/* Rarity filter */}
                    <div className="flex gap-1 flex-wrap mt-2 w-full">
                      {["all", "common", "uncommon", "rare", "epic", "legendary"].map((rarity) => (
                        <Button
                          key={rarity}
                          variant={rarityFilter === rarity ? "default" : "outline"}
                          size="sm"
                          className={cn(
                            "h-7 text-xs px-2 capitalize",
                            rarityFilter === rarity && rarity !== "all" && rarityColors[rarity]
                          )}
                          onClick={() => setRarityFilter(rarity)}
                        >
                          {rarity}
                        </Button>
                      ))}
                    </div>

                    {/* Show earned only */}
                    <Button
                      variant={showEarnedOnly ? "default" : "outline"}
                      size="sm"
                      className="h-7 text-xs px-2 mt-2"
                      onClick={() => setShowEarnedOnly(!showEarnedOnly)}
                    >
                      <Gift className="h-3 w-3 mr-1" />
                      Earned Only
                    </Button>
                  </div>

                  {/* Badge Detail Modal */}
                  <AnimatePresence>
                    {selectedBadge && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={cn(
                          "mb-4 p-6 rounded-2xl border-2 text-center relative",
                          selectedBadge.earnedAt
                            ? cn(rarityColors[selectedBadge.rarity], rarityBorder[selectedBadge.rarity])
                            : "bg-muted/30 border-dashed border-muted-foreground/30"
                        )}
                      >
                        <button
                          onClick={() => setSelectedBadge(null)}
                          className="absolute top-3 left-3 text-xs text-muted-foreground hover:text-foreground"
                        >
                          ← Back
                        </button>

                        <motion.span
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: "spring", delay: 0.1 }}
                          className={cn(
                            "text-6xl block mb-3",
                            !selectedBadge.earnedAt && "grayscale opacity-50"
                          )}
                        >
                          {selectedBadge.icon}
                        </motion.span>

                        <h3 className="text-xl font-bold mb-2">{selectedBadge.name}</h3>

                        <div className="flex items-center justify-center gap-2 mb-3">
                          <Badge variant="outline" className={cn("text-xs", rarityColors[selectedBadge.rarity])}>
                            {selectedBadge.rarity}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {categoryIcons[selectedBadge.category]} {categoryNames[selectedBadge.category]}
                          </Badge>
                          <Badge variant="secondary" className="text-xs bg-amber-500/10 text-amber-500">
                            +{selectedBadge.xp} XP
                          </Badge>
                        </div>

                        <p className="text-muted-foreground mb-4">{selectedBadge.description}</p>

                        {selectedBadge.progress !== undefined && selectedBadge.target !== undefined && (
                          <div className="max-w-xs mx-auto">
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span className="text-muted-foreground">Progress</span>
                              <span className="font-medium tabular-nums">
                                {selectedBadge.progress} / {selectedBadge.target}
                              </span>
                            </div>
                            <Progress
                              value={Math.min(100, (selectedBadge.progress / selectedBadge.target) * 100)}
                              className="h-3"
                            />
                          </div>
                        )}

                        {selectedBadge.earnedAt ? (
                          <p className="text-xs text-muted-foreground mt-4">
                            🎉 Earned {formatDistanceToNow(new Date(selectedBadge.earnedAt), { addSuffix: true })}
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground mt-4 flex items-center justify-center gap-1">
                            <Lock className="h-3 w-3" />
                            Keep going to unlock this badge!
                          </p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Earned Badges */}
                  {!selectedBadge && earnedBadges.length > 0 && (
                    <div className="mb-6">
                      <p className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                        <span className="text-green-500">✓</span>
                        Earned ({earnedBadges.length})
                      </p>
                      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
                        {earnedBadges.map((badge) => (
                          <motion.button
                            key={badge.id}
                            onClick={() => setSelectedBadge(badge)}
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            className={cn(
                              "flex flex-col items-center gap-1.5 p-3 rounded-xl text-center transition-all border",
                              rarityColors[badge.rarity],
                              rarityGlow[badge.rarity],
                              rarityBorder[badge.rarity]
                            )}
                          >
                            <span className="text-2xl">{badge.icon}</span>
                            <span className="text-[10px] font-medium leading-tight line-clamp-2">
                              {badge.name}
                            </span>
                            <Badge
                              variant="outline"
                              className={cn("text-[8px] px-1 py-0", rarityColors[badge.rarity])}
                            >
                              {badge.rarity}
                            </Badge>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Locked Badges */}
                  {!selectedBadge && lockedBadges.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                        <Lock className="h-3.5 w-3.5" />
                        Locked ({lockedBadges.length})
                      </p>
                      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
                        {lockedBadges.map((badge) => (
                          <motion.button
                            key={badge.id}
                            onClick={() => setSelectedBadge(badge)}
                            whileHover={{ scale: 1.03 }}
                            className="flex flex-col items-center gap-1.5 p-3 rounded-xl text-center bg-muted/30 border border-dashed border-muted-foreground/20 opacity-60 hover:opacity-80 transition-all"
                          >
                            <span className="text-2xl grayscale">{badge.icon}</span>
                            <span className="text-[10px] font-medium leading-tight line-clamp-2 text-muted-foreground">
                              {badge.name}
                            </span>
                            {badge.progress !== undefined && badge.target !== undefined && (
                              <div className="w-full mt-1">
                                <Progress
                                  value={(badge.progress / badge.target) * 100}
                                  className="h-1"
                                />
                              </div>
                            )}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  )}

                  {filteredBadges.length === 0 && (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                        <Award className="h-8 w-8 text-muted-foreground/40" />
                      </div>
                      <p className="text-muted-foreground">No badges match your filters</p>
                      <Button
                        variant="link"
                        onClick={() => {
                          setCategoryFilter("all")
                          setRarityFilter("all")
                          setShowEarnedOnly(false)
                        }}
                      >
                        Clear filters
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar - Challenges & Stats */}
            <div className="space-y-4">
              {/* Active Challenges */}
              <Card className="border-0 shadow-xl">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Target className="h-5 w-5 text-green-500" />
                    <h3 className="font-semibold">Active Challenges</h3>
                  </div>

                  {activeChallenges.length > 0 ? (
                    <div className="space-y-3">
                      {activeChallenges.map((challenge) => {
                        const progressPercent = (challenge.progress / challenge.target) * 100
                        const timeLeft = formatDistanceToNow(new Date(challenge.expiresAt), { addSuffix: false })

                        return (
                          <motion.div
                            key={challenge.id}
                            whileHover={{ scale: 1.01 }}
                            className="p-3 rounded-xl bg-muted/30 border"
                          >
                            <div className="flex items-start gap-3">
                              <span className="text-2xl">{challenge.icon}</span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="text-sm font-medium">{challenge.name}</p>
                                  <Badge variant="outline" className="text-[9px] px-1.5">
                                    {challenge.type}
                                  </Badge>
                                </div>
                                <p className="text-[11px] text-muted-foreground mb-2">
                                  {challenge.description}
                                </p>
                                <div className="flex items-center gap-2">
                                  <Progress value={progressPercent} className="h-2 flex-1" />
                                  <span className="text-[10px] text-muted-foreground tabular-nums">
                                    {challenge.progress}/{challenge.target}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between mt-2">
                                  <span className="text-[10px] text-muted-foreground">
                                    ⏱️ {timeLeft} left
                                  </span>
                                  <Badge variant="secondary" className="text-[10px] bg-amber-500/10 text-amber-500">
                                    +{challenge.xpReward} XP
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <Target className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                      <p className="text-sm text-muted-foreground">All challenges completed!</p>
                    </div>
                  )}

                  {/* Completed Challenges */}
                  {completedChallenges.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        Completed ({completedChallenges.length})
                      </p>
                      <div className="space-y-2">
                        {completedChallenges.map((challenge) => (
                          <div
                            key={challenge.id}
                            className="flex items-center gap-2 p-2 rounded-lg bg-green-500/10 text-green-500"
                          >
                            <span>{challenge.icon}</span>
                            <span className="text-xs font-medium flex-1">{challenge.name}</span>
                            <Badge variant="secondary" className="text-[10px] bg-green-500/20 text-green-500">
                              +{challenge.xpReward} XP
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Work Stats */}
              <Card className="border-0 shadow-xl">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="h-5 w-5 text-blue-500" />
                    <h3 className="font-semibold">Your Stats</h3>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">🔥 Longest Streak</span>
                      <span className="font-semibold">{data.longestStreak} days</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">📍 Total On-Site Days</span>
                      <span className="font-semibold">{data.totalOnsiteDays}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">✅ Perfect Weeks</span>
                      <span className="font-semibold">{data.perfectWeeks}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">📅 This Month</span>
                      <span className="font-semibold">{data.thisMonthDays} days</span>
                    </div>

                    <div className="h-px bg-border my-2" />

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">🐦 Early Bird Days</span>
                      <span className="font-semibold">{data.stats.earlyBirdCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">🦉 Night Owl Days</span>
                      <span className="font-semibold">{data.stats.nightOwlCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">📊 Full Days (8h+)</span>
                      <span className="font-semibold">{data.stats.fullDays}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">🦸 Overtime Days (10h+)</span>
                      <span className="font-semibold">{data.stats.overtimeDays}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">☕ Break Days</span>
                      <span className="font-semibold">{data.stats.breaksTaken}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">🗓️ Weekend Days</span>
                      <span className="font-semibold">{data.stats.weekendDays}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Badge Summary by Category */}
              <Card className="border-0 shadow-xl">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Award className="h-5 w-5 text-purple-500" />
                    <h3 className="font-semibold">By Category</h3>
                  </div>

                  <div className="space-y-3">
                    {Object.entries(badgesByCategory).map(([category, badges]) => {
                      const earned = badges.filter((b) => b.earnedAt).length
                      const total = badges.length
                      const percent = (earned / total) * 100

                      return (
                        <div key={category}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm">
                              {categoryIcons[category]} {categoryNames[category]}
                            </span>
                            <span className="text-xs text-muted-foreground tabular-nums">
                              {earned}/{total}
                            </span>
                          </div>
                          <Progress value={percent} className="h-2" />
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <BottomNav currentPath="/rewards" />
    </motion.div>
  )
}
