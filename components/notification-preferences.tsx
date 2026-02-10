"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Bell,
  BellRing,
  Clock,
  Coffee,
  AlertTriangle,
  Trophy,
  Users,
  Calendar,
  FileCheck,
  Flame,
  Sparkles,
  Settings,
  Save,
  Loader2,
  CheckCircle2,
} from "lucide-react"
import { cn } from "@/lib/utils"

export interface NotificationPreferences {
  // Global settings
  pushEnabled: boolean
  inAppEnabled: boolean
  emailEnabled: boolean
  quietHoursEnabled: boolean
  quietHoursStart: string // HH:mm
  quietHoursEnd: string // HH:mm

  // Clock reminders
  clockInReminder: boolean
  clockInTime: string // HH:mm
  forgotClockOutReminder: boolean
  forgotClockOutAfterHours: number

  // Compliance
  weeklyComplianceReminder: boolean
  complianceReminderDay: number // 0-6
  complianceWarning: boolean

  // Breaks
  breakReminder: boolean
  breakReminderAfterHours: number

  // Achievements
  badgeNotifications: boolean
  xpMilestones: boolean
  streakMilestones: boolean

  // Team (for admins)
  teamClockEvents: boolean
  overtimeAlerts: boolean
  timesheetSubmissions: boolean

  // Schedule
  scheduleChanges: boolean
  shiftReminders: boolean
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  pushEnabled: true,
  inAppEnabled: true,
  emailEnabled: false,
  quietHoursEnabled: false,
  quietHoursStart: "22:00",
  quietHoursEnd: "07:00",
  clockInReminder: true,
  clockInTime: "09:00",
  forgotClockOutReminder: true,
  forgotClockOutAfterHours: 10,
  weeklyComplianceReminder: true,
  complianceReminderDay: 4, // Thursday
  complianceWarning: true,
  breakReminder: true,
  breakReminderAfterHours: 4,
  badgeNotifications: true,
  xpMilestones: true,
  streakMilestones: true,
  teamClockEvents: false,
  overtimeAlerts: true,
  timesheetSubmissions: true,
  scheduleChanges: true,
  shiftReminders: true,
}

const STORAGE_KEY = "onsite-notification-preferences"

const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
]

export function getNotificationPreferences(): NotificationPreferences {
  if (typeof window === "undefined") return DEFAULT_PREFERENCES
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    try {
      return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) }
    } catch {
      return DEFAULT_PREFERENCES
    }
  }
  return DEFAULT_PREFERENCES
}

export function saveNotificationPreferences(prefs: NotificationPreferences): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
  }
}

interface NotificationPreferencesFormProps {
  isAdmin?: boolean
  onSave?: () => void
}

export function NotificationPreferencesForm({ isAdmin = false, onSave }: NotificationPreferencesFormProps) {
  const [prefs, setPrefs] = useState<NotificationPreferences>(DEFAULT_PREFERENCES)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>("default")

  useEffect(() => {
    setPrefs(getNotificationPreferences())
    if ("Notification" in window) {
      setPermissionStatus(Notification.permission)
    }
  }, [])

  const handleChange = <K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K]
  ) => {
    setPrefs((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  const handleSave = async () => {
    setSaving(true)
    saveNotificationPreferences(prefs)

    // Request push permission if enabled
    if (prefs.pushEnabled && "Notification" in window && Notification.permission === "default") {
      const permission = await Notification.requestPermission()
      setPermissionStatus(permission)
    }

    // Simulate server sync
    await new Promise((r) => setTimeout(r, 500))
    setSaving(false)
    setSaved(true)
    onSave?.()

    setTimeout(() => setSaved(false), 3000)
  }

  const requestPermission = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission()
      setPermissionStatus(permission)
    }
  }

  return (
    <div className="space-y-8">
      {/* Push permission banner */}
      {prefs.pushEnabled && permissionStatus !== "granted" && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20"
        >
          <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
            <BellRing className="h-5 w-5 text-amber-500" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm text-amber-600 dark:text-amber-400">
              Push notifications are {permissionStatus === "denied" ? "blocked" : "not enabled"}
            </p>
            <p className="text-xs text-amber-600/70 dark:text-amber-400/70">
              {permissionStatus === "denied"
                ? "Update your browser settings to allow notifications"
                : "Click the button to enable push notifications"}
            </p>
          </div>
          {permissionStatus === "default" && (
            <Button
              size="sm"
              onClick={requestPermission}
              className="rounded-lg bg-amber-500 hover:bg-amber-600 text-white"
            >
              Enable
            </Button>
          )}
        </motion.div>
      )}

      {/* Global Settings */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Delivery Methods
        </h3>
        <div className="space-y-3">
          <PreferenceToggle
            icon={BellRing}
            label="Push Notifications"
            description="Receive notifications on your device"
            checked={prefs.pushEnabled}
            onCheckedChange={(v) => handleChange("pushEnabled", v)}
          />
          <PreferenceToggle
            icon={Bell}
            label="In-App Notifications"
            description="Show notifications in the app"
            checked={prefs.inAppEnabled}
            onCheckedChange={(v) => handleChange("inAppEnabled", v)}
          />
          <PreferenceToggle
            icon={Clock}
            label="Quiet Hours"
            description="Pause notifications during set hours"
            checked={prefs.quietHoursEnabled}
            onCheckedChange={(v) => handleChange("quietHoursEnabled", v)}
          />
          {prefs.quietHoursEnabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="ml-12 flex items-center gap-2"
            >
              <Input
                type="time"
                value={prefs.quietHoursStart}
                onChange={(e) => handleChange("quietHoursStart", e.target.value)}
                className="w-28 rounded-lg"
              />
              <span className="text-sm text-muted-foreground">to</span>
              <Input
                type="time"
                value={prefs.quietHoursEnd}
                onChange={(e) => handleChange("quietHoursEnd", e.target.value)}
                className="w-28 rounded-lg"
              />
            </motion.div>
          )}
        </div>
      </div>

      {/* Clock Reminders */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Clock Reminders
        </h3>
        <div className="space-y-3">
          <PreferenceToggle
            icon={Clock}
            label="Clock-In Reminder"
            description="Remind me to clock in each workday"
            checked={prefs.clockInReminder}
            onCheckedChange={(v) => handleChange("clockInReminder", v)}
          />
          {prefs.clockInReminder && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="ml-12 flex items-center gap-2"
            >
              <Label className="text-sm text-muted-foreground">Remind at:</Label>
              <Input
                type="time"
                value={prefs.clockInTime}
                onChange={(e) => handleChange("clockInTime", e.target.value)}
                className="w-28 rounded-lg"
              />
            </motion.div>
          )}
          <PreferenceToggle
            icon={AlertTriangle}
            label="Forgot to Clock Out"
            description="Alert if I've been clocked in too long"
            checked={prefs.forgotClockOutReminder}
            onCheckedChange={(v) => handleChange("forgotClockOutReminder", v)}
          />
          {prefs.forgotClockOutReminder && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="ml-12 flex items-center gap-2"
            >
              <Label className="text-sm text-muted-foreground">After:</Label>
              <Select
                value={prefs.forgotClockOutAfterHours.toString()}
                onValueChange={(v) => handleChange("forgotClockOutAfterHours", parseInt(v))}
              >
                <SelectTrigger className="w-24 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[8, 9, 10, 11, 12].map((h) => (
                    <SelectItem key={h} value={h.toString()}>
                      {h} hours
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </motion.div>
          )}
        </div>
      </div>

      {/* Break Reminders */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
          <Coffee className="h-4 w-4" />
          Break Reminders
        </h3>
        <div className="space-y-3">
          <PreferenceToggle
            icon={Coffee}
            label="Break Reminder"
            description="Remind me to take breaks"
            checked={prefs.breakReminder}
            onCheckedChange={(v) => handleChange("breakReminder", v)}
          />
          {prefs.breakReminder && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="ml-12 flex items-center gap-2"
            >
              <Label className="text-sm text-muted-foreground">After:</Label>
              <Select
                value={prefs.breakReminderAfterHours.toString()}
                onValueChange={(v) => handleChange("breakReminderAfterHours", parseInt(v))}
              >
                <SelectTrigger className="w-24 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2, 3, 4, 5, 6].map((h) => (
                    <SelectItem key={h} value={h.toString()}>
                      {h} hours
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </motion.div>
          )}
        </div>
      </div>

      {/* Compliance */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Compliance
        </h3>
        <div className="space-y-3">
          <PreferenceToggle
            icon={Calendar}
            label="Weekly Compliance Reminder"
            description="Remind me if I'm behind on required days"
            checked={prefs.weeklyComplianceReminder}
            onCheckedChange={(v) => handleChange("weeklyComplianceReminder", v)}
          />
          {prefs.weeklyComplianceReminder && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="ml-12 flex items-center gap-2"
            >
              <Label className="text-sm text-muted-foreground">On:</Label>
              <Select
                value={prefs.complianceReminderDay.toString()}
                onValueChange={(v) => handleChange("complianceReminderDay", parseInt(v))}
              >
                <SelectTrigger className="w-32 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_OF_WEEK.map((day) => (
                    <SelectItem key={day.value} value={day.value.toString()}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </motion.div>
          )}
          <PreferenceToggle
            icon={AlertTriangle}
            label="Compliance Warning"
            description="Alert when I might miss compliance"
            checked={prefs.complianceWarning}
            onCheckedChange={(v) => handleChange("complianceWarning", v)}
          />
        </div>
      </div>

      {/* Achievements */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
          <Trophy className="h-4 w-4" />
          Achievements
        </h3>
        <div className="space-y-3">
          <PreferenceToggle
            icon={Trophy}
            label="Badge Earned"
            description="When I unlock a new badge"
            checked={prefs.badgeNotifications}
            onCheckedChange={(v) => handleChange("badgeNotifications", v)}
          />
          <PreferenceToggle
            icon={Sparkles}
            label="XP Milestones"
            description="When I reach XP milestones"
            checked={prefs.xpMilestones}
            onCheckedChange={(v) => handleChange("xpMilestones", v)}
          />
          <PreferenceToggle
            icon={Flame}
            label="Streak Milestones"
            description="When I hit streak milestones (7, 30, 100 days)"
            checked={prefs.streakMilestones}
            onCheckedChange={(v) => handleChange("streakMilestones", v)}
          />
        </div>
      </div>

      {/* Schedule */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Schedule
        </h3>
        <div className="space-y-3">
          <PreferenceToggle
            icon={Calendar}
            label="Schedule Changes"
            description="When my schedule is updated"
            checked={prefs.scheduleChanges}
            onCheckedChange={(v) => handleChange("scheduleChanges", v)}
          />
          <PreferenceToggle
            icon={Clock}
            label="Shift Reminders"
            description="Remind me before shifts start"
            checked={prefs.shiftReminders}
            onCheckedChange={(v) => handleChange("shiftReminders", v)}
          />
        </div>
      </div>

      {/* Admin-only settings */}
      {isAdmin && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Users className="h-4 w-4" />
            Team (Admin)
          </h3>
          <div className="space-y-3">
            <PreferenceToggle
              icon={Users}
              label="Team Clock Events"
              description="When team members clock in/out"
              checked={prefs.teamClockEvents}
              onCheckedChange={(v) => handleChange("teamClockEvents", v)}
            />
            <PreferenceToggle
              icon={AlertTriangle}
              label="Overtime Alerts"
              description="When team members approach overtime"
              checked={prefs.overtimeAlerts}
              onCheckedChange={(v) => handleChange("overtimeAlerts", v)}
            />
            <PreferenceToggle
              icon={FileCheck}
              label="Timesheet Submissions"
              description="When timesheets are submitted for approval"
              checked={prefs.timesheetSubmissions}
              onCheckedChange={(v) => handleChange("timesheetSubmissions", v)}
            />
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="sticky bottom-0 pt-4 pb-2 bg-background border-t border-border/50 -mx-4 px-4">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full h-12 rounded-xl gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : saved ? (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Saved!
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Preferences
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

function PreferenceToggle({
  icon: Icon,
  label,
  description,
  checked,
  onCheckedChange,
}: {
  icon: typeof Bell
  label: string
  description: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted/50 transition-colors">
      <div className={cn(
        "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
        checked ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
      )}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <Label className="text-sm font-medium cursor-pointer">{label}</Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}
