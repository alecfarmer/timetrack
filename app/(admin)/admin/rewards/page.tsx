"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PageHeader } from "@/components/page-header"
import { staggerContainer, staggerChild } from "@/lib/animations"
import { tzHeaders } from "@/lib/utils"
import {
  Trophy,
  Flame,
  Users,
  Coins,
  Zap,
  Heart,
  Target,
  ShoppingCart,
  TrendingUp,
  Award,
  Gift,
} from "lucide-react"
import Link from "next/link"

interface Metrics {
  overview: {
    totalMembers: number
    activeStreaks: number
    activeStreakPercent: number
    avgLevel: number
    totalXpGranted: number
  }
  weekly: {
    xpEntries: number
    badgesEarned: number
    challengesCompleted: number
    kudosSent: number
    redemptions: number
  }
  totals: {
    badgesEarned: number
    pendingRedemptions: number
  }
  topPerformers: Array<{
    userId: string
    totalXp: number
    level: number
    currentStreak: number
  }>
  levelDistribution: Record<number, number>
}

export default function AdminRewardsPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [grantUserId, setGrantUserId] = useState("")
  const [grantAmount, setGrantAmount] = useState("")
  const [grantReason, setGrantReason] = useState("")
  const [granting, setGranting] = useState(false)

  useEffect(() => {
    fetch("/api/admin/rewards/metrics", { headers: tzHeaders() })
      .then((r) => r.json())
      .then(setMetrics)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleGrantXp = async () => {
    if (!grantUserId || !grantAmount || !grantReason) return
    setGranting(true)
    try {
      const res = await fetch("/api/admin/rewards/grant-xp", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...tzHeaders() },
        body: JSON.stringify({
          userId: grantUserId,
          amount: parseInt(grantAmount),
          reason: grantReason,
        }),
      })
      if (res.ok) {
        setGrantUserId("")
        setGrantAmount("")
        setGrantReason("")
      }
    } catch (err) {
      console.error(err)
    } finally {
      setGranting(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <PageHeader title="Rewards" subtitle="Gamification engagement dashboard" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-muted/50 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const m = metrics

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Rewards"
        subtitle="Gamification engagement dashboard"
      />

      {/* Overview Stats */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
      >
        {[
          { label: "Active Streaks", value: `${m?.overview.activeStreakPercent || 0}%`, sub: `${m?.overview.activeStreaks || 0} of ${m?.overview.totalMembers || 0}`, icon: Flame, color: "text-orange-500" },
          { label: "Avg Level", value: m?.overview.avgLevel || 0, sub: "across all members", icon: TrendingUp, color: "text-amber-500" },
          { label: "Total XP Granted", value: (m?.overview.totalXpGranted || 0).toLocaleString(), sub: "all time", icon: Zap, color: "text-yellow-500" },
          { label: "Pending Redemptions", value: m?.totals.pendingRedemptions || 0, sub: "needs approval", icon: ShoppingCart, color: "text-blue-500" },
        ].map((stat) => (
          <motion.div key={stat.label} variants={staggerChild}>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold tabular-nums">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="text-[10px] text-muted-foreground">{stat.sub}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Weekly Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            This Week
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: "XP Events", value: m?.weekly.xpEntries || 0, icon: Zap },
              { label: "Badges Earned", value: m?.weekly.badgesEarned || 0, icon: Award },
              { label: "Challenges Done", value: m?.weekly.challengesCompleted || 0, icon: Target },
              { label: "Kudos Sent", value: m?.weekly.kudosSent || 0, icon: Heart },
              { label: "Redemptions", value: m?.weekly.redemptions || 0, icon: Gift },
            ].map((stat) => (
              <div key={stat.label} className="text-center p-3 rounded-xl bg-muted/30">
                <stat.icon className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                <p className="text-xl font-bold tabular-nums">{stat.value}</p>
                <p className="text-[10px] text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(m?.topPerformers || []).map((p, i) => (
                <div key={p.userId} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                  <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">User {i + 1}</p>
                    <p className="text-[10px] text-muted-foreground">
                      Level {p.level} &middot; {p.currentStreak}d streak
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-[10px]">
                    {p.totalXp.toLocaleString()} XP
                  </Badge>
                </div>
              ))}
              {(!m?.topPerformers || m.topPerformers.length === 0) && (
                <p className="text-center py-6 text-sm text-muted-foreground">No data yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Grant XP */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Grant XP / Coins</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="User ID"
                  value={grantUserId}
                  onChange={(e) => setGrantUserId(e.target.value)}
                  className="text-xs"
                />
                <Input
                  placeholder="Amount"
                  type="number"
                  value={grantAmount}
                  onChange={(e) => setGrantAmount(e.target.value)}
                  className="w-24 text-xs"
                />
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Reason"
                  value={grantReason}
                  onChange={(e) => setGrantReason(e.target.value)}
                  className="text-xs"
                />
                <Button size="sm" onClick={handleGrantXp} disabled={granting}>
                  {granting ? "..." : "Grant"}
                </Button>
              </div>
            </div>

            {/* Management Links */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t">
              <Link href="/admin/rewards/shop">
                <Button variant="outline" size="sm" className="w-full gap-2">
                  <ShoppingCart className="h-3.5 w-3.5" />
                  Manage Shop
                </Button>
              </Link>
              <Link href="/admin/rewards/challenges">
                <Button variant="outline" size="sm" className="w-full gap-2">
                  <Target className="h-3.5 w-3.5" />
                  Challenges
                </Button>
              </Link>
              <Link href="/admin/rewards/badges">
                <Button variant="outline" size="sm" className="w-full gap-2">
                  <Award className="h-3.5 w-3.5" />
                  Badges
                </Button>
              </Link>
              <Button variant="outline" size="sm" className="w-full gap-2" asChild>
                <Link href="/admin/rewards/shop">
                  <Coins className="h-3.5 w-3.5" />
                  Redemptions
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Level Distribution */}
      {m?.levelDistribution && Object.keys(m.levelDistribution).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Level Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-1 h-32">
              {Array.from({ length: 20 }, (_, i) => i + 1).map((level) => {
                const count = m.levelDistribution[level] || 0
                const maxCount = Math.max(...Object.values(m.levelDistribution), 1)
                const height = count > 0 ? Math.max(8, (count / maxCount) * 100) : 4
                return (
                  <div key={level} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t bg-primary/60 hover:bg-primary transition-colors"
                      style={{ height: `${height}%` }}
                      title={`Level ${level}: ${count} members`}
                    />
                    {level % 5 === 0 && (
                      <span className="text-[9px] text-muted-foreground">{level}</span>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
