"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PageHeader } from "@/components/page-header"
import { staggerContainer, staggerChild } from "@/lib/animations"
import { tzHeaders, cn } from "@/lib/utils"
import {
  Target,
  Plus,
  Zap,
  Coins,
  Users,
  X,
} from "lucide-react"

interface ChallengeDefinition {
  id: string
  name: string
  description: string
  icon: string
  type: string
  criteria: { type: string; target: number }
  xpReward: number
  coinReward: number
  minLevel: number
  isTeamChallenge: boolean
  isActive: boolean
  completionCount: number
}

export default function AdminChallengesPage() {
  const [challenges, setChallenges] = useState<ChallengeDefinition[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [showTeamCreate, setShowTeamCreate] = useState(false)
  const [filter, setFilter] = useState("all")

  // Create form state
  const [formName, setFormName] = useState("")
  const [formDescription, setFormDescription] = useState("")
  const [formIcon, setFormIcon] = useState("🎯")
  const [formType, setFormType] = useState("daily")
  const [formTarget, setFormTarget] = useState("")
  const [formXpReward, setFormXpReward] = useState("")
  const [formCoinReward, setFormCoinReward] = useState("0")
  const [formMinLevel, setFormMinLevel] = useState("1")
  const [saving, setSaving] = useState(false)

  // Team challenge form
  const [teamName, setTeamName] = useState("")
  const [teamDescription, setTeamDescription] = useState("")
  const [teamTarget, setTeamTarget] = useState("")
  const [teamXpReward, setTeamXpReward] = useState("100")
  const [teamDuration, setTeamDuration] = useState("7")

  const fetchData = async () => {
    try {
      const res = await fetch("/api/admin/rewards/challenges", { headers: tzHeaders() })
      if (res.ok) {
        const data = await res.json()
        setChallenges(data.challenges || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleCreateChallenge = async () => {
    if (!formName || !formTarget || !formXpReward) return
    setSaving(true)
    try {
      const res = await fetch("/api/admin/rewards/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...tzHeaders() },
        body: JSON.stringify({
          name: formName,
          description: formDescription,
          icon: formIcon,
          type: formType,
          criteria: { type: "custom", target: parseInt(formTarget) },
          xpReward: parseInt(formXpReward),
          coinReward: parseInt(formCoinReward),
          minLevel: parseInt(formMinLevel),
        }),
      })
      if (res.ok) {
        setShowCreate(false)
        setFormName("")
        setFormDescription("")
        setFormTarget("")
        setFormXpReward("")
        fetchData()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleCreateTeamChallenge = async () => {
    if (!teamName || !teamTarget || !teamXpReward) return
    setSaving(true)
    try {
      const res = await fetch("/api/admin/rewards/team-challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...tzHeaders() },
        body: JSON.stringify({
          name: teamName,
          description: teamDescription,
          target: parseInt(teamTarget),
          xpReward: parseInt(teamXpReward),
          durationDays: parseInt(teamDuration),
        }),
      })
      if (res.ok) {
        setShowTeamCreate(false)
        setTeamName("")
        setTeamDescription("")
        setTeamTarget("")
        fetchData()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const filtered = filter === "all"
    ? challenges
    : challenges.filter((c) => c.type === filter)

  const typeColors: Record<string, string> = {
    daily: "bg-blue-500/10 text-blue-500",
    weekly: "bg-green-500/10 text-green-500",
    monthly: "bg-purple-500/10 text-purple-500",
    team: "bg-amber-500/10 text-amber-500",
    personal: "bg-pink-500/10 text-pink-500",
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <PageHeader title="Challenge Pool" subtitle="Manage challenge definitions" />
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-muted/50 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Challenge Pool"
        subtitle="Manage challenge definitions and team challenges"
      />

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Challenge
        </Button>
        <Button variant="outline" onClick={() => setShowTeamCreate(true)} className="gap-2">
          <Users className="h-4 w-4" />
          Team Challenge
        </Button>
      </div>

      {/* Create Challenge Form */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="border-primary/30">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base">New Challenge Definition</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setShowCreate(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Clock in 3 days" />
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={formType} onValueChange={setFormType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="personal">Personal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input value={formDescription} onChange={(e) => setFormDescription(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Target</Label>
                    <Input type="number" value={formTarget} onChange={(e) => setFormTarget(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>XP Reward</Label>
                    <Input type="number" value={formXpReward} onChange={(e) => setFormXpReward(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Coin Reward</Label>
                    <Input type="number" value={formCoinReward} onChange={(e) => setFormCoinReward(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Min Level</Label>
                    <Input type="number" value={formMinLevel} onChange={(e) => setFormMinLevel(e.target.value)} />
                  </div>
                </div>
                <Button onClick={handleCreateChallenge} disabled={saving}>
                  {saving ? "Creating..." : "Create Challenge"}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Team Challenge Form */}
      <AnimatePresence>
        {showTeamCreate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="border-amber-500/30">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4 text-amber-500" />
                  New Team Challenge
                </CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setShowTeamCreate(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="Team 100 Clock-ins" />
                  </div>
                  <div className="space-y-2">
                    <Label>Duration (days)</Label>
                    <Input type="number" value={teamDuration} onChange={(e) => setTeamDuration(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input value={teamDescription} onChange={(e) => setTeamDescription(e.target.value)} placeholder="Team clocks in 100 times this week" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Team Target</Label>
                    <Input type="number" value={teamTarget} onChange={(e) => setTeamTarget(e.target.value)} placeholder="100" />
                  </div>
                  <div className="space-y-2">
                    <Label>XP Reward (per member)</Label>
                    <Input type="number" value={teamXpReward} onChange={(e) => setTeamXpReward(e.target.value)} />
                  </div>
                </div>
                <Button onClick={handleCreateTeamChallenge} disabled={saving}>
                  {saving ? "Creating..." : "Launch Team Challenge"}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Type Filter */}
      <div className="flex gap-2 flex-wrap">
        {["all", "daily", "weekly", "monthly", "team", "personal"].map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-full border transition-colors",
              filter === type ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"
            )}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
            {type !== "all" && ` (${challenges.filter((c) => c.type === type).length})`}
          </button>
        ))}
      </div>

      {/* Challenge List */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid gap-3 md:grid-cols-2"
      >
        {filtered.map((c) => (
          <motion.div key={c.id} variants={staggerChild}>
            <Card className={cn(!c.isActive && "opacity-50")}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{c.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-medium">{c.name}</h3>
                      <Badge variant="outline" className={cn("text-[9px]", typeColors[c.type])}>
                        {c.type}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground mb-2">{c.description}</p>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                      <span>Target: {c.criteria.target}</span>
                      <span>Min Level: {c.minLevel}</span>
                      <span>{c.completionCount} completed</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary" className="text-[10px] bg-amber-500/10 text-amber-500">
                      <Zap className="h-2.5 w-2.5 mr-0.5" />
                      +{c.xpReward}
                    </Badge>
                    {c.coinReward > 0 && (
                      <Badge variant="secondary" className="text-[10px] bg-yellow-500/10 text-yellow-600 mt-1">
                        <Coins className="h-2.5 w-2.5 mr-0.5" />
                        +{c.coinReward}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <Target className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-muted-foreground">No challenges found</p>
        </div>
      )}
    </div>
  )
}
