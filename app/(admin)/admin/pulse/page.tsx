"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/page-header"
import { RefreshButton } from "@/components/pull-to-refresh"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import {
  Plus,
  Loader2,
  BarChart3,
  MessageCircle,
  ToggleLeft,
  ToggleRight,
  X,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Survey {
  id: string
  question: string
  type: string
  isActive: boolean
  frequency: string
  createdAt: string
}

interface Response {
  id: string
  surveyId: string
  userId: string
  ratingValue: number | null
  textValue: string | null
  boolValue: boolean | null
  weekOf: string
  createdAt: string
}

export default function AdminPulsePage() {
  const { isAdmin, loading: authLoading } = useAuth()
  const router = useRouter()

  const [surveys, setSurveys] = useState<Survey[]>([])
  const [responses, setResponses] = useState<Response[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newQuestion, setNewQuestion] = useState("")
  const [newType, setNewType] = useState("rating")
  const [newFrequency, setNewFrequency] = useState("weekly")

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/pulse?responses=true")
      if (res.ok) {
        const data = await res.json()
        setSurveys(data.surveys || [])
        setResponses(data.responses || [])
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push("/")
      return
    }
    if (!authLoading && isAdmin) {
      fetchData()
    }
  }, [authLoading, isAdmin, router, fetchData])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchData()
    setRefreshing(false)
  }

  const handleCreate = async () => {
    if (!newQuestion.trim() || creating) return
    setCreating(true)
    try {
      const res = await fetch("/api/pulse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_survey",
          question: newQuestion,
          type: newType,
          frequency: newFrequency,
        }),
      })
      if (res.ok) {
        setShowCreate(false)
        setNewQuestion("")
        setNewType("rating")
        setNewFrequency("weekly")
        await fetchData()
      }
    } catch {
      // silent
    } finally {
      setCreating(false)
    }
  }

  const handleToggle = async (id: string, currentActive: boolean) => {
    try {
      await fetch("/api/pulse", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive: !currentActive }),
      })
      await fetchData()
    } catch {
      // silent
    }
  }

  // Compute stats per survey
  const getSurveyStats = (surveyId: string) => {
    const surveyResponses = responses.filter((r) => r.surveyId === surveyId)
    const ratingResponses = surveyResponses.filter((r) => r.ratingValue != null)

    if (ratingResponses.length === 0) return null

    const avg = ratingResponses.reduce((sum, r) => sum + (r.ratingValue || 0), 0) / ratingResponses.length

    // Get last 2 weeks for trend
    const weeks = [...new Set(ratingResponses.map((r) => r.weekOf))].sort().reverse()
    let trend: "up" | "down" | "flat" = "flat"
    if (weeks.length >= 2) {
      const thisWeek = ratingResponses.filter((r) => r.weekOf === weeks[0])
      const lastWeek = ratingResponses.filter((r) => r.weekOf === weeks[1])
      const thisAvg = thisWeek.reduce((s, r) => s + (r.ratingValue || 0), 0) / thisWeek.length
      const lastAvg = lastWeek.reduce((s, r) => s + (r.ratingValue || 0), 0) / lastWeek.length
      if (thisAvg > lastAvg + 0.2) trend = "up"
      else if (thisAvg < lastAvg - 0.2) trend = "down"
    }

    return {
      totalResponses: surveyResponses.length,
      avgRating: avg,
      trend,
      uniqueWeeks: weeks.length,
      respondents: new Set(surveyResponses.map((r) => r.userId)).size,
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-col bg-background">
      <PageHeader
        title="Pulse Surveys"
        subtitle="Monitor team sentiment"
        actions={
          <div className="flex items-center gap-2">
            <Button size="sm" className="gap-1.5" onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4" />
              New Survey
            </Button>
            <RefreshButton onRefresh={handleRefresh} refreshing={refreshing} />
          </div>
        }
      />

      <div className="max-w-4xl mx-auto w-full px-4 lg:px-8 pt-4 pb-24 lg:pb-8 space-y-4">
        {/* Create Form */}
        {showCreate && (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium">New Survey Question</CardTitle>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowCreate(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <input
                type="text"
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                placeholder="e.g., How satisfied are you with your work-life balance?"
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                autoFocus
              />
              <div className="flex gap-3">
                <div className="space-y-1 flex-1">
                  <label className="text-xs font-medium text-muted-foreground">Response Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full rounded-lg border bg-background px-3 py-1.5 text-sm"
                  >
                    <option value="rating">Rating (1-5)</option>
                    <option value="yes_no">Yes / No</option>
                    <option value="text">Free Text</option>
                  </select>
                </div>
                <div className="space-y-1 flex-1">
                  <label className="text-xs font-medium text-muted-foreground">Frequency</label>
                  <select
                    value={newFrequency}
                    onChange={(e) => setNewFrequency(e.target.value)}
                    className="w-full rounded-lg border bg-background px-3 py-1.5 text-sm"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Biweekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>
              <Button onClick={handleCreate} disabled={!newQuestion.trim() || creating} className="gap-1.5">
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Create
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Surveys */}
        {surveys.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <BarChart3 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-medium mb-1">No Pulse Surveys</p>
              <p className="text-sm text-muted-foreground mb-4">Create surveys to collect regular feedback from your team.</p>
              <Button className="gap-1.5" onClick={() => setShowCreate(true)}>
                <Plus className="h-4 w-4" />
                Create First Survey
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {surveys.map((survey) => {
              const stats = getSurveyStats(survey.id)
              return (
                <Card key={survey.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <MessageCircle className="h-4 w-4 text-primary shrink-0" />
                          <p className="font-medium text-sm truncate">{survey.question}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={survey.isActive ? "default" : "secondary"} className="text-[10px]">
                            {survey.isActive ? "Active" : "Paused"}
                          </Badge>
                          <Badge variant="outline" className="text-[10px] capitalize">
                            {survey.type === "rating" ? "1-5 Rating" : survey.type === "yes_no" ? "Yes/No" : "Text"}
                          </Badge>
                          <Badge variant="outline" className="text-[10px] capitalize">{survey.frequency}</Badge>
                        </div>

                        {/* Stats */}
                        {stats && (
                          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                            {survey.type === "rating" && (
                              <span className="flex items-center gap-1">
                                <span className={cn(
                                  "font-bold text-sm",
                                  stats.avgRating >= 4 ? "text-emerald-600" :
                                  stats.avgRating >= 3 ? "text-amber-600" :
                                  "text-rose-600"
                                )}>
                                  {stats.avgRating.toFixed(1)}
                                </span>
                                / 5 avg
                                {stats.trend === "up" && <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />}
                                {stats.trend === "down" && <TrendingDown className="h-3.5 w-3.5 text-rose-500" />}
                                {stats.trend === "flat" && <Minus className="h-3.5 w-3.5" />}
                              </span>
                            )}
                            <span>{stats.respondents} respondent{stats.respondents !== 1 ? "s" : ""}</span>
                            <span>{stats.totalResponses} response{stats.totalResponses !== 1 ? "s" : ""}</span>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => handleToggle(survey.id, survey.isActive)}
                        className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {survey.isActive ? (
                          <ToggleRight className="h-6 w-6 text-primary" />
                        ) : (
                          <ToggleLeft className="h-6 w-6" />
                        )}
                      </button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
