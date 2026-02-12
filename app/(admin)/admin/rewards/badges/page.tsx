"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PageHeader } from "@/components/page-header"
import { staggerContainer, staggerChild } from "@/lib/animations"
import { tzHeaders, cn } from "@/lib/utils"
import {
  Award,
  Zap,
  Coins,
  Eye,
  EyeOff,
  Search,
} from "lucide-react"

interface BadgeDefinition {
  id: string
  slug: string
  name: string
  description: string
  icon: string
  category: string
  rarity: string
  xpReward: number
  coinReward: number
  isHidden: boolean
  isSeasonal: boolean
  isActive: boolean
  setId: string | null
  timesEarned: number
  earningRate: number
}

const rarityColors: Record<string, string> = {
  common: "bg-slate-500/10 text-slate-500 border-slate-500/30",
  uncommon: "bg-green-500/10 text-green-500 border-green-500/30",
  rare: "bg-blue-500/10 text-blue-500 border-blue-500/30",
  epic: "bg-purple-500/10 text-purple-500 border-purple-500/30",
  legendary: "bg-amber-500/10 text-amber-500 border-amber-500/30",
}

const categoryLabels: Record<string, string> = {
  streak: "Streak",
  milestone: "Milestone",
  time: "Time-Based",
  consistency: "Consistency",
  special: "Special",
  social: "Social",
  seasonal: "Seasonal",
  hidden: "Hidden",
  collection: "Collection",
}

export default function AdminBadgesPage() {
  const [badges, setBadges] = useState<BadgeDefinition[]>([])
  const [loading, setLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  const fetchData = async () => {
    try {
      const res = await fetch("/api/admin/rewards/badges", { headers: tzHeaders() })
      if (res.ok) {
        const data = await res.json()
        setBadges(data.badges || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const categories = ["all", ...new Set(badges.map((b) => b.category))]

  const filtered = badges.filter((b) => {
    if (categoryFilter !== "all" && b.category !== categoryFilter) return false
    if (searchQuery && !b.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  // Group by category for display
  const grouped = filtered.reduce<Record<string, BadgeDefinition[]>>((acc, badge) => {
    const cat = badge.category
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(badge)
    return acc
  }, {})

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <PageHeader title="Badge Definitions" subtitle="Manage achievement badges" />
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-muted/50 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Badge Definitions"
        subtitle={`${badges.length} badges configured`}
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search badges..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-full border transition-colors",
                categoryFilter === cat
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border hover:bg-muted"
              )}
            >
              {cat === "all" ? "All" : categoryLabels[cat] || cat}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Total", value: badges.length },
          { label: "Common", value: badges.filter((b) => b.rarity === "common").length },
          { label: "Rare", value: badges.filter((b) => b.rarity === "rare").length },
          { label: "Epic", value: badges.filter((b) => b.rarity === "epic").length },
          { label: "Legendary", value: badges.filter((b) => b.rarity === "legendary").length },
        ].map((stat) => (
          <div key={stat.label} className="p-3 rounded-xl bg-muted/30 text-center">
            <p className="text-xl font-bold">{stat.value}</p>
            <p className="text-[10px] text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Badge Grid by Category */}
      {Object.entries(grouped).map(([category, categoryBadges]) => (
        <div key={category}>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            {categoryLabels[category] || category} ({categoryBadges.length})
          </h3>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid gap-3 md:grid-cols-2 lg:grid-cols-3"
          >
            {categoryBadges.map((badge) => (
              <motion.div key={badge.id} variants={staggerChild}>
                <Card className={cn(!badge.isActive && "opacity-50")}>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{badge.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-sm font-medium truncate">{badge.name}</h4>
                          {badge.isHidden && <EyeOff className="h-3 w-3 text-muted-foreground" />}
                        </div>
                        <p className="text-[10px] text-muted-foreground line-clamp-1">{badge.description}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Badge variant="outline" className={cn("text-[8px] px-1", rarityColors[badge.rarity])}>
                            {badge.rarity}
                          </Badge>
                          <span className="text-[9px] text-muted-foreground">
                            {badge.timesEarned} earned ({badge.earningRate}%)
                          </span>
                        </div>
                      </div>
                      <div className="text-right flex flex-col gap-0.5">
                        <Badge variant="secondary" className="text-[9px] bg-amber-500/10 text-amber-500">
                          <Zap className="h-2 w-2 mr-0.5" />
                          {badge.xpReward}
                        </Badge>
                        {badge.coinReward > 0 && (
                          <Badge variant="secondary" className="text-[9px] bg-yellow-500/10 text-yellow-600">
                            <Coins className="h-2 w-2 mr-0.5" />
                            {badge.coinReward}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      ))}

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <Award className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-muted-foreground">No badges found</p>
        </div>
      )}
    </div>
  )
}
