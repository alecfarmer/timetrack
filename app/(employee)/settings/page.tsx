"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { OrgLink as Link } from "@/components/org-link"
import { requestNotificationPermission, getReminderSettings, saveReminderSettings, canNotify } from "@/lib/notifications"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { TimezoneSelector } from "@/components/timezone-prompt"
import { useAuth } from "@/contexts/auth-context"
import { WfhSection } from "@/components/settings/wfh-section"
import { DangerZone } from "@/components/settings/danger-zone"
import { getTimezone, detectUserTimezone } from "@/lib/dates"
import {
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
  Home,
  Settings2,
  Moon,
  Sun,
  Monitor,
  Check,
  Mail,
  Smartphone,
  AlertTriangle,
  ChevronDown,
} from "lucide-react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

// Navigation sections
const sections = [
  { id: "profile", label: "Profile", icon: User, description: "Your account info" },
  { id: "general", label: "General", icon: Settings2, description: "Timezone & appearance" },
  { id: "notifications", label: "Notifications", icon: Bell, description: "Alerts & reminders" },
  { id: "locations", label: "Locations", icon: MapPin, description: "WFH & work locations" },
  { id: "security", label: "Security", icon: Shield, description: "Account security" },
] as const

type SectionId = typeof sections[number]["id"]

export default function SettingsPage() {
  const router = useRouter()
  const { user, org, isAdmin, signOut } = useAuth()
  const { theme, setTheme } = useTheme()
  const [activeSection, setActiveSection] = useState<SectionId>("profile")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [notifications, setNotifications] = useState(true)
  const [timezone, setTimezone] = useState(getTimezone())
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
      // ignore
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

  const currentSection = sections.find(s => s.id === activeSection)!

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-card/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div>
              <h1 className="text-lg font-semibold">Settings</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">Manage your account preferences</p>
            </div>
            <Badge variant="outline" className="hidden sm:flex gap-1.5 text-xs">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              Synced
            </Badge>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 lg:px-8 pb-24 lg:pb-8">
        {/* Mobile Section Selector */}
        <div className="lg:hidden py-4">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-full flex items-center justify-between p-4 rounded-xl border bg-card"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <currentSection.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-medium">{currentSection.label}</p>
                <p className="text-xs text-muted-foreground">{currentSection.description}</p>
              </div>
            </div>
            <ChevronDown className={cn("h-5 w-5 text-muted-foreground transition-transform", mobileMenuOpen && "rotate-180")} />
          </button>

          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-2 rounded-xl border bg-card divide-y">
                  {sections.filter(s => s.id !== activeSection).map((section) => (
                    <button
                      key={section.id}
                      onClick={() => { setActiveSection(section.id); setMobileMenuOpen(false) }}
                      className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors"
                    >
                      <section.icon className="h-5 w-5 text-muted-foreground" />
                      <div className="text-left">
                        <p className="font-medium text-sm">{section.label}</p>
                        <p className="text-xs text-muted-foreground">{section.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Desktop Layout */}
        <div className="lg:grid lg:grid-cols-12 lg:gap-8 py-6">
          {/* Sidebar Navigation */}
          <aside className="hidden lg:block lg:col-span-3">
            <nav className="sticky top-24 space-y-1">
              {sections.map((section) => {
                const isActive = activeSection === section.id
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-lg"
                        : "hover:bg-muted/50"
                    )}
                  >
                    <section.icon className={cn("h-5 w-5", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
                    <div>
                      <p className={cn("font-medium text-sm", !isActive && "text-foreground")}>{section.label}</p>
                      <p className={cn("text-xs", isActive ? "text-primary-foreground/70" : "text-muted-foreground")}>{section.description}</p>
                    </div>
                  </button>
                )
              })}

              {/* App Version */}
              <div className="pt-6 px-4">
                <p className="text-xs text-muted-foreground">KPR v4.0.0</p>
                <p className="text-xs text-muted-foreground/60">Time & Attendance</p>
              </div>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-9">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {activeSection === "profile" && (
                  <ProfileSection user={user} org={org} isAdmin={isAdmin} policy={policy} />
                )}
                {activeSection === "general" && (
                  <GeneralSection
                    timezone={timezone}
                    onTimezoneChange={handleTimezoneChange}
                    theme={theme}
                    setTheme={setTheme}
                  />
                )}
                {activeSection === "notifications" && (
                  <NotificationsSection
                    notifications={notifications}
                    setNotifications={setNotifications}
                    autoClockOut={autoClockOut}
                    setAutoClockOut={setAutoClockOut}
                  />
                )}
                {activeSection === "locations" && (
                  <LocationsSection />
                )}
                {activeSection === "security" && (
                  <SecuritySection onSignOut={handleSignOut} />
                )}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  )
}

// Section Components

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="text-sm text-muted-foreground mt-1">{description}</p>
    </div>
  )
}

function SettingsCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-2xl border bg-card p-6", className)}>
      {children}
    </div>
  )
}

function SettingsRow({
  icon,
  label,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode
  label: string
  description?: string
  action: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {icon && (
          <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center flex-shrink-0">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <p className="font-medium text-sm">{label}</p>
          {description && <p className="text-xs text-muted-foreground truncate">{description}</p>}
        </div>
      </div>
      <div className="flex-shrink-0">{action}</div>
    </div>
  )
}

// Profile Section
function ProfileSection({
  user,
  org,
  isAdmin,
  policy,
}: {
  user: any
  org: any
  isAdmin: boolean
  policy: any
}) {
  return (
    <div className="space-y-6">
      <SectionHeader title="Profile" description="Your account information and organization details" />

      {/* Profile Card */}
      <SettingsCard>
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary via-primary/80 to-primary/60 flex items-center justify-center text-2xl font-bold text-primary-foreground shadow-lg">
            {org?.firstName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            {(org?.firstName || org?.lastName) && (
              <h3 className="text-lg font-semibold">{[org.firstName, org.lastName].filter(Boolean).join(" ")}</h3>
            )}
            <p className={cn("text-sm", org?.firstName ? "text-muted-foreground" : "font-semibold")}>{user?.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">{org?.role || "Member"}</Badge>
              {isAdmin && <Badge className="text-xs bg-primary/10 text-primary border-primary/20">Admin</Badge>}
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-4 pt-4 border-t">
          Your name is managed by your organization administrator. Contact them to make changes.
        </p>
      </SettingsCard>

      {/* Organization Card */}
      {org && (
        <SettingsCard>
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Organization</h3>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="rounded-xl bg-muted/50 p-4">
              <p className="text-xs text-muted-foreground mb-1">Company</p>
              <p className="font-medium">{org.orgName}</p>
            </div>
            <div className="rounded-xl bg-muted/50 p-4">
              <p className="text-xs text-muted-foreground mb-1">Your Role</p>
              <p className="font-medium capitalize">{org.role.toLowerCase()}</p>
            </div>
          </div>
          {isAdmin && (
            <Link href="/admin" className="mt-4 block">
              <Button variant="outline" className="w-full justify-between rounded-xl h-12">
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Manage Team
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Button>
            </Link>
          )}
        </SettingsCard>
      )}

      {/* Work Policy Card */}
      <SettingsCard>
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Work Policy</h3>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="rounded-xl bg-muted/50 p-4 text-center">
            <p className="text-2xl font-bold text-primary">{policy?.requiredDaysPerWeek ?? 3}</p>
            <p className="text-xs text-muted-foreground mt-1">Days Required</p>
          </div>
          <div className="rounded-xl bg-muted/50 p-4 text-center">
            <p className="text-2xl font-bold text-primary">On-site</p>
            <p className="text-xs text-muted-foreground mt-1">Compliance Type</p>
          </div>
          <div className="rounded-xl bg-muted/50 p-4 text-center">
            <p className="text-2xl font-bold text-primary">40h</p>
            <p className="text-xs text-muted-foreground mt-1">Weekly Target</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          {isAdmin
            ? "You can edit the work policy from the Admin dashboard."
            : "Work policy is set by your organization administrator."}
        </p>
      </SettingsCard>
    </div>
  )
}

// General Section
function GeneralSection({
  timezone,
  onTimezoneChange,
  theme,
  setTheme,
}: {
  timezone: string
  onTimezoneChange: (tz: string) => void
  theme: string | undefined
  setTheme: (theme: string) => void
}) {
  const themes = [
    { id: "light", label: "Light", icon: Sun },
    { id: "dark", label: "Dark", icon: Moon },
    { id: "system", label: "System", icon: Monitor },
  ]

  return (
    <div className="space-y-6">
      <SectionHeader title="General" description="Customize your experience" />

      {/* Timezone Card */}
      <SettingsCard>
        <div className="flex items-center gap-2 mb-4">
          <Globe className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Timezone</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Your Timezone</p>
              <p className="text-xs text-muted-foreground">All times will be displayed in this timezone</p>
            </div>
            <TimezoneSelector
              value={timezone}
              onChange={onTimezoneChange}
              className="w-[220px]"
            />
          </div>
          <div className="rounded-xl bg-muted/50 p-3 flex items-center gap-2">
            <Monitor className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              Browser detected: <span className="font-medium text-foreground">{detectUserTimezone()}</span>
            </p>
          </div>
        </div>
      </SettingsCard>

      {/* Appearance Card */}
      <SettingsCard>
        <div className="flex items-center gap-2 mb-4">
          <Palette className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Appearance</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">Choose your preferred color theme</p>
        <div className="grid grid-cols-3 gap-3">
          {themes.map((t) => {
            const isActive = theme === t.id
            return (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={cn(
                  "relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                  isActive
                    ? "border-primary bg-primary/5"
                    : "border-transparent bg-muted/50 hover:bg-muted"
                )}
              >
                {isActive && (
                  <div className="absolute top-2 right-2">
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center",
                  isActive ? "bg-primary text-primary-foreground" : "bg-background border"
                )}>
                  <t.icon className="h-5 w-5" />
                </div>
                <span className={cn("text-sm font-medium", isActive && "text-primary")}>{t.label}</span>
              </button>
            )
          })}
        </div>
      </SettingsCard>
    </div>
  )
}

// Notifications Section
function NotificationsSection({
  notifications,
  setNotifications,
  autoClockOut,
  setAutoClockOut,
}: {
  notifications: boolean
  setNotifications: (v: boolean) => void
  autoClockOut: boolean
  setAutoClockOut: (v: boolean) => void
}) {
  const handleNotificationToggle = async (checked: boolean) => {
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
  }

  return (
    <div className="space-y-6">
      <SectionHeader title="Notifications" description="Manage how you receive alerts and reminders" />

      {/* Push Notifications Card */}
      <SettingsCard>
        <div className="flex items-center gap-2 mb-4">
          <Smartphone className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Push Notifications</h3>
        </div>

        <div className="space-y-4">
          <SettingsRow
            icon={<Bell className="h-5 w-5 text-blue-500" />}
            label="Enable Notifications"
            description="Receive push notifications on this device"
            action={
              <Switch
                checked={notifications}
                onCheckedChange={handleNotificationToggle}
              />
            }
          />

          <Separator />

          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">When enabled, you'll receive:</p>
            <div className="grid sm:grid-cols-2 gap-2">
              {[
                { label: "Clock-in reminders", desc: "Daily at your usual start time" },
                { label: "Forgot to clock out", desc: "After work hours if still clocked in" },
                { label: "Weekly compliance", desc: "Summary of your weekly attendance" },
                { label: "Policy updates", desc: "When org policies change" },
              ].map((item) => (
                <div key={item.label} className={cn(
                  "rounded-lg p-3 border",
                  notifications ? "bg-primary/5 border-primary/20" : "bg-muted/50 border-transparent"
                )}>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SettingsCard>

      {/* Automation Card */}
      <SettingsCard>
        <div className="flex items-center gap-2 mb-4">
          <Settings2 className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Automation</h3>
        </div>

        <SettingsRow
          icon={<MapPin className="h-5 w-5 text-emerald-500" />}
          label="Auto Clock-Out"
          description="Automatically clock out when you leave the geofence"
          action={
            <Switch
              checked={autoClockOut}
              onCheckedChange={(checked) => {
                setAutoClockOut(checked)
                localStorage.setItem("onsite-auto-clockout", String(checked))
              }}
            />
          }
        />
      </SettingsCard>
    </div>
  )
}

// Locations Section
function LocationsSection() {
  return (
    <div className="space-y-6">
      <SectionHeader title="Locations" description="Manage your work locations and WFH settings" />

      {/* WFH Section */}
      <WfhSection />

      {/* Manage Locations Card */}
      <SettingsCard>
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Work Locations</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          View and manage all your work locations including offices and remote sites.
        </p>
        <Link href="/settings/locations">
          <Button variant="outline" className="w-full justify-between rounded-xl h-12">
            <span className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Manage All Locations
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Button>
        </Link>
      </SettingsCard>
    </div>
  )
}

// Security Section
function SecuritySection({ onSignOut }: { onSignOut: () => void }) {
  return (
    <div className="space-y-6">
      <SectionHeader title="Security" description="Manage your account security and data" />

      {/* Sign Out Card */}
      <SettingsCard>
        <div className="flex items-center gap-2 mb-4">
          <LogOut className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Session</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Sign out of your account on this device. You can sign back in at any time.
        </p>
        <Button
          variant="outline"
          className="w-full justify-center rounded-xl h-12 gap-2"
          onClick={onSignOut}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </SettingsCard>

      {/* Danger Zone */}
      <DangerZone />
    </div>
  )
}
