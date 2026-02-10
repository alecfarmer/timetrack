"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { requestNotificationPermission, getReminderSettings, saveReminderSettings, canNotify } from "@/lib/notifications"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { NotificationCenter } from "@/components/notification-center"
import { TimezoneSelector } from "@/components/timezone-prompt"
import { useAuth } from "@/contexts/auth-context"
import { WfhSection } from "@/components/settings/wfh-section"
import { DangerZone } from "@/components/settings/danger-zone"
import { getUserTimezone, detectUserTimezone } from "@/lib/dates"
import {
  Settings,
  MapPin,
  Bell,
  Shield,
  Clock,
  ChevronRight,
  LogOut,
  Palette,
  User,
  Users,
  Building2,
  Globe,
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.05 } },
}

const staggerItem = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

export default function SettingsPage() {
  const router = useRouter()
  const { user, org, isAdmin, signOut } = useAuth()
  const [notifications, setNotifications] = useState(true)
  const [timezone, setTimezone] = useState(getUserTimezone())
  const [autoClockOut, setAutoClockOut] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("onsite-auto-clockout") === "true"
    }
    return false
  })
  const [policy, setPolicy] = useState<{ requiredDaysPerWeek: number; minimumMinutesPerDay: number } | null>(null)

  const fetchPolicy = useCallback(async () => {
    try {
      const res = await fetch("/api/org/policy")
      if (res.ok) {
        setPolicy(await res.json())
      }
    } catch {
      // ignore - will show defaults
    }
  }, [])

  useEffect(() => {
    setNotifications(canNotify() && getReminderSettings().clockInReminder)
    fetchPolicy()
  }, [fetchPolicy])

  const handleSignOut = async () => {
    await signOut()
    router.push("/login")
  }

  const handleTimezoneChange = (newTimezone: string) => {
    setTimezone(newTimezone)
    localStorage.setItem("timezone_override", newTimezone)
  }

  return (
    <motion.div
      className="flex flex-col min-h-screen bg-background"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Premium Dark Hero Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-500/20 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-zinc-500/10 via-transparent to-transparent" />
        <div className="absolute inset-0 backdrop-blur-3xl" />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
            backgroundSize: '32px 32px'
          }}
        />

        <header className="relative z-10 safe-area-pt">
          <div className="flex items-center justify-between px-4 h-14 max-w-3xl mx-auto lg:px-8">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/10">
                <Settings className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-lg font-semibold text-white">Settings</h1>
            </div>
            <div className="flex items-center gap-2">
              <NotificationCenter />
            </div>
          </div>
        </header>

        {/* User Info Card */}
        <div className="relative z-10 px-4 pt-4 pb-6 max-w-3xl mx-auto lg:px-8">
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <User className="h-7 w-7 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-white">{user?.email}</p>
                <p className="text-sm text-white/60">Personal Account</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <motion.main
        className="flex-1 pb-24 lg:pb-8 -mt-4"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        <div className="max-w-3xl mx-auto px-4 lg:px-8 space-y-4">
          {/* Organization */}
          {org && (
            <motion.div variants={staggerItem}>
              <Card className="border-0 shadow-lg rounded-2xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    Organization
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="bg-muted/50 rounded-xl p-4">
                    <p className="font-semibold">{org.orgName}</p>
                    <p className="text-sm text-muted-foreground capitalize">{org.role.toLowerCase()}</p>
                  </div>
                  {isAdmin && (
                    <Link href="/admin">
                      <Button variant="ghost" className="w-full justify-between rounded-xl h-12">
                        <span className="flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          Manage Team
                        </span>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* WFH Location */}
          <motion.div variants={staggerItem}>
            <WfhSection />
          </motion.div>

          {/* Timezone */}
          <motion.div variants={staggerItem}>
            <Card className="border-0 shadow-lg rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  Timezone
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5 flex-1 mr-4">
                    <Label>Your Timezone</Label>
                    <p className="text-sm text-muted-foreground">
                      All times displayed will use this timezone
                    </p>
                  </div>
                  <TimezoneSelector
                    value={timezone}
                    onChange={handleTimezoneChange}
                    className="w-[200px]"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Browser detected: {detectUserTimezone()}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Appearance */}
          <motion.div variants={staggerItem}>
            <Card className="border-0 shadow-lg rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <Palette className="h-5 w-5 text-primary" />
                  Appearance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Theme</Label>
                    <p className="text-sm text-muted-foreground">Choose your preferred theme</p>
                  </div>
                  <ThemeToggle variant="full" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Locations */}
          <motion.div variants={staggerItem}>
            <Card className="border-0 shadow-lg rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Locations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Link href="/app/settings/locations">
                  <Button variant="ghost" className="w-full justify-between rounded-xl h-12">
                    <span>Manage Locations</span>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>

          {/* Policy */}
          <motion.div variants={staggerItem}>
            <Card className="border-0 shadow-lg rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Work Policy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/50 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Required Days</p>
                    <p className="font-medium">{policy?.requiredDaysPerWeek ?? 3} days / week</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Compliance</p>
                    <p className="font-medium">On-site only (WFH excluded)</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {isAdmin
                    ? "You can edit the work policy from the Team dashboard."
                    : "Work policy is managed by your organization administrator."}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Preferences */}
          <motion.div variants={staggerItem}>
            <Card className="border-0 shadow-lg rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="notifications">Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Clock-in reminders, forgot-to-clock-out alerts, weekly compliance
                    </p>
                  </div>
                  <Switch
                    id="notifications"
                    checked={notifications}
                    onCheckedChange={async (checked) => {
                      if (checked) {
                        const granted = await requestNotificationPermission()
                        setNotifications(granted)
                        if (!granted) alert("Notifications are blocked. Please enable them in your browser settings.")
                      } else {
                        setNotifications(false)
                      }
                      saveReminderSettings({
                        ...getReminderSettings(),
                        clockInReminder: checked,
                        forgotClockOutReminder: checked,
                        weeklyComplianceReminder: checked,
                      })
                    }}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="autoClockOut">Auto Clock-Out</Label>
                    <p className="text-sm text-muted-foreground">Clock out when leaving geofence</p>
                  </div>
                  <Switch
                    id="autoClockOut"
                    checked={autoClockOut}
                    onCheckedChange={(checked) => {
                      setAutoClockOut(checked)
                      localStorage.setItem("onsite-auto-clockout", String(checked))
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Security */}
          <motion.div variants={staggerItem}>
            <Card className="border-0 shadow-lg rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl h-12 gap-2"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-5 w-5" />
                  Sign Out
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Danger Zone */}
          <motion.div variants={staggerItem}>
            <DangerZone />
          </motion.div>

          {/* App Info */}
          <motion.div variants={staggerItem}>
            <div className="text-center text-sm text-muted-foreground py-4">
              <p className="font-medium">OnSite v2.0.0</p>
              <p>Personal Time & Attendance Tracker</p>
            </div>
          </motion.div>
        </div>
      </motion.main>
    </motion.div>
  )
}
