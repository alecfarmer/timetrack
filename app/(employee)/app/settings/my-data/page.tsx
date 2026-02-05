"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import {
  FileText,
  Download,
  Eye,
  Shield,
  Database,
  Clock,
  Info,
  MapPin,
  User,
  AlertCircle,
} from "lucide-react"
import { format } from "date-fns"

interface DataEntry {
  id: string
  type: string
  timestamp: string
  location?: string | null
  gpsAccuracy?: number | null
}

interface DataCorrection {
  id: string
  field: string
  oldValue: string
  newValue: string
  reason: string
  correctedAt: string
  correctedBy: string
}

interface MyDataResponse {
  userId: string
  email: string
  orgName: string | null
  role: string | null
  memberSince: string | null
  summary: {
    totalHours90d: number
    totalDays90d: number
    avgHoursPerDay: number
    correctionsMade: number
  }
  dataCollected: string[]
  recentEntries: DataEntry[]
  recentCorrections: DataCorrection[]
}

const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
}

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.08 } },
}

const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-muted ${className ?? ""}`} />
}

export default function MyDataPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [data, setData] = useState<MyDataResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/me/data")
      if (!res.ok) throw new Error("Failed to load your data")
      setData(await res.json())
    } catch (err) {
      console.error("Error fetching my data:", err)
      setError(err instanceof Error ? err.message : "Failed to load data")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
      return
    }
    if (!authLoading && user) {
      fetchData()
    }
  }, [authLoading, user, router, fetchData])

  const handleDownload = () => {
    window.open("/api/me/data", "_blank")
  }

  if (authLoading || loading) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <header className="sticky top-0 z-50 glass border-b">
          <div className="flex items-center justify-between px-4 h-16 max-w-6xl mx-auto lg:px-8">
            <div className="flex items-center gap-3 lg:hidden">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Database className="h-5 w-5 text-primary" />
              </div>
              <h1 className="text-lg font-bold">My Data</h1>
            </div>
            <h1 className="hidden lg:block text-xl font-semibold">My Data</h1>
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 pb-24 lg:pb-8">
          <div className="max-w-3xl mx-auto px-4 py-6 lg:px-8 space-y-6">
            <Skeleton className="h-28 w-full rounded-xl" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Skeleton className="h-24 rounded-xl" />
              <Skeleton className="h-24 rounded-xl" />
              <Skeleton className="h-24 rounded-xl" />
              <Skeleton className="h-24 rounded-xl" />
            </div>
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        </main>
      </div>
    )
  }

  return (
    <motion.div
      className="flex flex-col min-h-screen bg-background"
      initial="initial"
      animate="animate"
      variants={pageVariants}
    >
      <header className="sticky top-0 z-50 glass border-b lg:ml-64">
        <div className="flex items-center justify-between px-4 h-16 max-w-6xl mx-auto lg:px-8">
          <div className="flex items-center gap-3 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Database className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-lg font-bold">My Data</h1>
          </div>
          <h1 className="hidden lg:block text-xl font-semibold">Data Transparency</h1>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="gap-2 rounded-xl"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Download JSON</span>
            </Button>
          </div>
        </div>
      </header>

      <motion.main
        className="flex-1 pb-24 lg:pb-8 lg:ml-64"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        <div className="max-w-3xl mx-auto px-4 py-6 lg:px-8 space-y-6">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
              <p className="text-sm text-destructive flex-1">{error}</p>
              <Button variant="ghost" size="sm" onClick={() => setError(null)}>
                Dismiss
              </Button>
            </div>
          )}

          {data && (
            <>
              {/* Profile Card */}
              <motion.div variants={staggerItem}>
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center">
                        <User className="h-7 w-7 text-white" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="font-semibold">{data.email}</p>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="secondary" className="text-xs font-mono">
                            {data.userId.slice(0, 8)}...
                          </Badge>
                          {data.orgName && (
                            <Badge variant="outline" className="text-xs">
                              {data.orgName}
                            </Badge>
                          )}
                          {data.role && (
                            <Badge
                              variant={data.role === "ADMIN" ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {data.role}
                            </Badge>
                          )}
                        </div>
                        {data.memberSince && (
                          <p className="text-xs text-muted-foreground">
                            Member since{" "}
                            {format(new Date(data.memberSince), "MMMM d, yyyy")}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Summary Stats */}
              <motion.div variants={staggerItem}>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <Card className="border-0 shadow-lg">
                    <CardContent className="p-4 text-center">
                      <Clock className="h-5 w-5 text-primary mx-auto mb-2" />
                      <p className="text-2xl font-bold tabular-nums">
                        {data.summary.totalHours90d.toFixed(1)}
                      </p>
                      <p className="text-xs text-muted-foreground">Total Hours (90d)</p>
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-lg">
                    <CardContent className="p-4 text-center">
                      <FileText className="h-5 w-5 text-blue-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold tabular-nums">
                        {data.summary.totalDays90d}
                      </p>
                      <p className="text-xs text-muted-foreground">Total Days</p>
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-lg">
                    <CardContent className="p-4 text-center">
                      <Eye className="h-5 w-5 text-emerald-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold tabular-nums">
                        {data.summary.avgHoursPerDay.toFixed(1)}
                      </p>
                      <p className="text-xs text-muted-foreground">Avg Hours/Day</p>
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-lg">
                    <CardContent className="p-4 text-center">
                      <Shield className="h-5 w-5 text-amber-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold tabular-nums">
                        {data.summary.correctionsMade}
                      </p>
                      <p className="text-xs text-muted-foreground">Corrections Made</p>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>

              {/* Data We Collect */}
              <motion.div variants={staggerItem}>
                <Card className="border-0 shadow-lg">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                      <Database className="h-5 w-5 text-primary" />
                      Data We Collect
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Here is a complete list of the data categories we store about your
                      account and activity.
                    </p>
                    <div className="space-y-2">
                      {data.dataCollected.map((item, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-3 p-3 bg-muted/50 rounded-xl"
                        >
                          <Info className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <p className="text-sm">{item}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Recent Entries */}
              <motion.div variants={staggerItem}>
                <Card className="border-0 shadow-lg">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      Recent Entries
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {data.recentEntries.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-6">
                        No recent entries found.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {data.recentEntries.map((entry) => (
                          <div
                            key={entry.id}
                            className="flex items-center justify-between p-3 bg-muted/50 rounded-xl"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Clock className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <p className="text-sm font-medium capitalize">
                                  {entry.type.replace(/_/g, " ").toLowerCase()}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {format(
                                    new Date(entry.timestamp),
                                    "MMM d, yyyy h:mm a"
                                  )}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              {entry.location && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <MapPin className="h-3 w-3" />
                                  <span>{entry.location}</span>
                                </div>
                              )}
                              {entry.gpsAccuracy != null && (
                                <p className="text-[10px] text-muted-foreground">
                                  GPS: {entry.gpsAccuracy.toFixed(0)}m accuracy
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Recent Corrections */}
              {data.recentCorrections.length > 0 && (
                <motion.div variants={staggerItem}>
                  <Card className="border-0 shadow-lg">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-medium flex items-center gap-2">
                        <Shield className="h-5 w-5 text-amber-500" />
                        Recent Corrections
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {data.recentCorrections.map((correction) => (
                          <div
                            key={correction.id}
                            className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium">{correction.field}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(
                                  new Date(correction.correctedAt),
                                  "MMM d, yyyy"
                                )}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <Badge
                                variant="secondary"
                                className="text-[10px] line-through"
                              >
                                {correction.oldValue}
                              </Badge>
                              <span className="text-muted-foreground">-&gt;</span>
                              <Badge variant="default" className="text-[10px]">
                                {correction.newValue}
                              </Badge>
                            </div>
                            {correction.reason && (
                              <p className="text-xs text-muted-foreground">
                                Reason: {correction.reason}
                              </p>
                            )}
                            <p className="text-[10px] text-muted-foreground">
                              By: {correction.correctedBy}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Download CTA */}
              <motion.div variants={staggerItem}>
                <Card className="border-0 shadow-xl bg-primary/5 ring-1 ring-primary/20">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="font-semibold">Export Your Data</p>
                        <p className="text-sm text-muted-foreground">
                          Download a complete JSON export of all your data.
                        </p>
                      </div>
                      <Button onClick={handleDownload} className="gap-2 rounded-xl">
                        <Download className="h-4 w-4" />
                        Download
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </>
          )}
        </div>
      </motion.main>

    </motion.div>
  )
}
