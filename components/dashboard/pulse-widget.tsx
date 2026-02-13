"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Heart, CheckCircle2, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface Survey {
  id: string
  question: string
  type: string
}

interface Response {
  surveyId: string
  ratingValue: number | null
}

const EMOJI_SCALE = ["😞", "😕", "😐", "🙂", "😊"]

export function PulseWidget() {
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [responses, setResponses] = useState<Response[]>([])
  const [submitting, setSubmitting] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  const fetchPulse = useCallback(async () => {
    try {
      const res = await fetch("/api/pulse")
      if (res.ok) {
        const data = await res.json()
        const activeSurveys = (data.surveys || []).filter((s: Survey) => s.type === "rating")
        setSurveys(activeSurveys.slice(0, 2)) // Show max 2 on dashboard
        setResponses(data.responses || [])
        // Mark already-responded surveys
        const answeredIds = new Set<string>((data.responses || []).map((r: Response) => r.surveyId))
        setSubmitted(answeredIds)
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPulse()
  }, [fetchPulse])

  const handleRate = async (surveyId: string, rating: number) => {
    setSubmitting(surveyId)
    try {
      const res = await fetch("/api/pulse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ surveyId, ratingValue: rating }),
      })
      if (res.ok) {
        setSubmitted((prev) => new Set(prev).add(surveyId))
      }
    } catch {
      // silent
    } finally {
      setSubmitting(null)
    }
  }

  // Don't show if no active surveys or all answered
  if (loading) return null
  const unanswered = surveys.filter((s) => !submitted.has(s.id))
  if (unanswered.length === 0 && surveys.length === 0) return null

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Heart className="h-4 w-4 text-rose-500" />
          Pulse Check
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {unanswered.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
            All caught up this week!
          </div>
        ) : (
          unanswered.map((survey) => (
            <div key={survey.id} className="space-y-2">
              <p className="text-sm">{survey.question}</p>
              {submitting === survey.id ? (
                <div className="flex justify-center py-2">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="flex items-center justify-between gap-1">
                  {EMOJI_SCALE.map((emoji, idx) => {
                    const rating = idx + 1
                    const existingResponse = responses.find((r) => r.surveyId === survey.id)
                    const isSelected = existingResponse?.ratingValue === rating
                    return (
                      <button
                        key={rating}
                        onClick={() => handleRate(survey.id, rating)}
                        className={cn(
                          "flex-1 py-2 rounded-lg text-xl transition-all",
                          "hover:bg-muted hover:scale-110",
                          isSelected && "bg-primary/10 ring-2 ring-primary"
                        )}
                      >
                        {emoji}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
