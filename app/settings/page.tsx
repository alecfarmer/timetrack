"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { requestNotificationPermission, getReminderSettings, saveReminderSettings, canNotify } from "@/lib/notifications"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/contexts/auth-context"
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
  Home,
  Navigation,
  Loader2,
  Check,
  Pencil,
  Trash2,
  AlertTriangle,
  Search,
} from "lucide-react"
import { BottomNav } from "@/components/bottom-nav"

const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.08,
    },
  },
}

const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

interface WfhLocation {
  id: string
  address: string | null
  latitude: number
  longitude: number
  geofenceRadius: number
}

export default function SettingsPage() {
  const router = useRouter()
  const { user, signOut } = useAuth()
  const [notifications, setNotifications] = useState(true)
  const [autoClockOut, setAutoClockOut] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("onsite-auto-clockout") === "true"
    }
    return false
  })
  // Initialize notification state from actual permissions
  useEffect(() => {
    setNotifications(canNotify() && getReminderSettings().clockInReminder)
  }, [])

  // WFH state
  const [wfhLocation, setWfhLocation] = useState<WfhLocation | null>(null)
  const [wfhLoading, setWfhLoading] = useState(true)
  const [wfhEditing, setWfhEditing] = useState(false)
  const [wfhAddress, setWfhAddress] = useState("")
  const [wfhLat, setWfhLat] = useState("")
  const [wfhLng, setWfhLng] = useState("")
  const [wfhSaving, setWfhSaving] = useState(false)
  const [wfhDetecting, setWfhDetecting] = useState(false)
  const [wfhGeocoding, setWfhGeocoding] = useState(false)
  const [wfhError, setWfhError] = useState<string | null>(null)
  const [wfhSuccess, setWfhSuccess] = useState(false)

  // Delete account state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState("")
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Fetch WFH location
  useEffect(() => {
    const fetchWfh = async () => {
      try {
        const res = await fetch("/api/locations")
        if (res.ok) {
          const locations = await res.json()
          const wfh = locations.find((l: { category: string }) => l.category === "HOME")
          if (wfh) {
            setWfhLocation(wfh)
            setWfhAddress(wfh.address || "")
            setWfhLat(wfh.latitude.toString())
            setWfhLng(wfh.longitude.toString())
          }
        }
      } catch {
        // silently fail
      }
      setWfhLoading(false)
    }
    fetchWfh()
  }, [])

  const handleSignOut = async () => {
    await signOut()
    router.push("/login")
  }

  const detectHomeLocation = () => {
    setWfhDetecting(true)
    setWfhError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setWfhLat(pos.coords.latitude.toFixed(6))
        setWfhLng(pos.coords.longitude.toFixed(6))
        setWfhDetecting(false)
      },
      () => {
        setWfhError("Could not detect location. Enter coordinates manually.")
        setWfhDetecting(false)
      },
      { enableHighAccuracy: true, timeout: 15000 }
    )
  }

  const geocodeAddress = async () => {
    if (!wfhAddress.trim() || wfhAddress.trim().length < 3) {
      setWfhError("Enter a valid address to look up")
      return
    }
    setWfhGeocoding(true)
    setWfhError(null)
    try {
      const res = await fetch(`/api/geocode?address=${encodeURIComponent(wfhAddress.trim())}`)
      const data = await res.json()
      if (!res.ok) {
        setWfhError(data.error || "Could not find address")
      } else {
        setWfhLat(data.latitude.toFixed(6))
        setWfhLng(data.longitude.toFixed(6))
      }
    } catch {
      setWfhError("Failed to look up address")
    }
    setWfhGeocoding(false)
  }

  const handleWfhSave = async () => {
    if (!wfhLat || !wfhLng) {
      setWfhError("Latitude and longitude are required")
      return
    }

    setWfhSaving(true)
    setWfhError(null)

    try {
      if (wfhLocation) {
        // Update existing
        const res = await fetch("/api/locations", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: wfhLocation.id,
            address: wfhAddress,
            latitude: parseFloat(wfhLat),
            longitude: parseFloat(wfhLng),
          }),
        })
        if (!res.ok) throw new Error("Failed to update")
        const updated = await res.json()
        setWfhLocation(updated)
      } else {
        // Create new
        const res = await fetch("/api/locations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "WFH",
            code: "WFH",
            category: "HOME",
            address: wfhAddress,
            latitude: parseFloat(wfhLat),
            longitude: parseFloat(wfhLng),
            geofenceRadius: 200,
            isDefault: false,
          }),
        })
        if (!res.ok) throw new Error("Failed to create")
        const created = await res.json()
        setWfhLocation(created)
      }

      setWfhEditing(false)
      setWfhSuccess(true)
      setTimeout(() => setWfhSuccess(false), 3000)
    } catch {
      setWfhError("Failed to save WFH location")
    }
    setWfhSaving(false)
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") return

    setDeleting(true)
    setDeleteError(null)

    try {
      const res = await fetch("/api/account", { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to delete account")
      }

      await signOut()
      router.push("/login")
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Something went wrong")
      setDeleting(false)
    }
  }

  return (
    <motion.div
      className="flex flex-col min-h-screen bg-background"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
    >
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b lg:ml-64">
        <div className="flex items-center justify-between px-4 h-16 max-w-6xl mx-auto lg:px-8">
          <div className="flex items-center gap-3 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Settings className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-lg font-bold">Settings</h1>
          </div>
          <h1 className="hidden lg:block text-xl font-semibold">Settings</h1>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <motion.main
        className="flex-1 pb-24 lg:pb-8 lg:ml-64"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        <div className="max-w-3xl mx-auto px-4 py-6 lg:px-8 space-y-6">
          {/* User Card */}
          <motion.div variants={staggerItem}>
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center">
                    <User className="h-7 w-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{user?.email}</p>
                    <p className="text-sm text-muted-foreground">Personal Account</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* WFH Location */}
          <motion.div variants={staggerItem}>
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <Home className="h-5 w-5 text-primary" />
                  Work From Home
                </CardTitle>
                <CardDescription>
                  Set your home address for WFH clock-ins
                </CardDescription>
              </CardHeader>
              <CardContent>
                {wfhLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading...
                  </div>
                ) : wfhEditing ? (
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="settingsWfhAddress" className="text-sm">Home Address</Label>
                      <div className="flex gap-2 mt-1.5">
                        <Input
                          id="settingsWfhAddress"
                          placeholder="123 Main St, City, State ZIP"
                          value={wfhAddress}
                          onChange={(e) => setWfhAddress(e.target.value)}
                          className="flex-1"
                          onKeyDown={(e) => e.key === "Enter" && geocodeAddress()}
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={geocodeAddress}
                          disabled={wfhGeocoding || !wfhAddress.trim()}
                          className="flex-shrink-0"
                          title="Look up coordinates from address"
                        >
                          {wfhGeocoding ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Search className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Enter address and click search to auto-fill coordinates
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="settingsWfhLat" className="text-sm">Latitude</Label>
                        <Input
                          id="settingsWfhLat"
                          type="number"
                          step="any"
                          placeholder="34.7373"
                          value={wfhLat}
                          onChange={(e) => setWfhLat(e.target.value)}
                          className="mt-1.5"
                        />
                      </div>
                      <div>
                        <Label htmlFor="settingsWfhLng" className="text-sm">Longitude</Label>
                        <Input
                          id="settingsWfhLng"
                          type="number"
                          step="any"
                          placeholder="-82.2543"
                          value={wfhLng}
                          onChange={(e) => setWfhLng(e.target.value)}
                          className="mt-1.5"
                        />
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full gap-2"
                      onClick={detectHomeLocation}
                      disabled={wfhDetecting}
                    >
                      {wfhDetecting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Navigation className="h-4 w-4" />
                      )}
                      {wfhDetecting ? "Detecting..." : "Use My Current Location"}
                    </Button>
                    {wfhError && (
                      <p className="text-sm text-destructive">{wfhError}</p>
                    )}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => setWfhEditing(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        className="flex-1 gap-2"
                        onClick={handleWfhSave}
                        disabled={wfhSaving}
                      >
                        {wfhSaving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                        {wfhSaving ? "Saving..." : "Save"}
                      </Button>
                    </div>
                  </div>
                ) : wfhLocation ? (
                  <div className="space-y-3">
                    <div className="flex items-start justify-between bg-muted/50 rounded-xl p-4">
                      <div>
                        <p className="font-medium text-sm">Home Office</p>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {wfhLocation.address || `${wfhLocation.latitude.toFixed(4)}, ${wfhLocation.longitude.toFixed(4)}`}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Geofence: {wfhLocation.geofenceRadius}m radius
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-lg"
                        onClick={() => setWfhEditing(true)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                    {wfhSuccess && (
                      <div className="flex items-center gap-2 text-sm text-success">
                        <Check className="h-4 w-4" />
                        WFH location updated
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-center py-4">
                      <div className="w-12 h-12 rounded-xl bg-muted mx-auto mb-3 flex items-center justify-center">
                        <Home className="h-6 w-6 text-muted-foreground/40" />
                      </div>
                      <p className="text-sm text-muted-foreground">No home location set</p>
                      <p className="text-xs text-muted-foreground/60 mt-0.5">
                        Add your home address to clock in when working from home
                      </p>
                    </div>
                    <Button
                      className="w-full rounded-xl gap-2"
                      onClick={() => setWfhEditing(true)}
                    >
                      <MapPin className="h-4 w-4" />
                      Set Up WFH Location
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Appearance */}
          <motion.div variants={staggerItem}>
            <Card className="border-0 shadow-lg">
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
                    <p className="text-sm text-muted-foreground">
                      Choose your preferred theme
                    </p>
                  </div>
                  <ThemeToggle variant="full" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Locations */}
          <motion.div variants={staggerItem}>
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Locations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Link href="/settings/locations">
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
            <Card className="border-0 shadow-lg">
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
                    <p className="font-medium">3 days / week</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Weekly Hours Target</p>
                    <p className="font-medium">40 hours</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Compliance</p>
                    <p className="font-medium">On-site only (WFH excluded)</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Work policy is managed by your organization administrator.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Preferences */}
          <motion.div variants={staggerItem}>
            <Card className="border-0 shadow-lg">
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
                        if (!granted) {
                          alert("Notifications are blocked. Please enable them in your browser settings.")
                        }
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
                    <p className="text-sm text-muted-foreground">
                      Clock out when leaving geofence
                    </p>
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
            <Card className="border-0 shadow-lg">
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
            <Card className="border-destructive/30 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  Danger Zone
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!deleteConfirmOpen ? (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Permanently delete your account and all associated data. This action cannot be undone.
                    </p>
                    <Button
                      variant="outline"
                      className="w-full border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground rounded-xl gap-2"
                      onClick={() => setDeleteConfirmOpen(true)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Account
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 space-y-2">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-sm text-destructive">This will permanently delete:</p>
                          <ul className="text-sm text-destructive/80 mt-1 space-y-0.5 list-disc list-inside">
                            <li>All your time entries and clock history</li>
                            <li>All your workday records and reports</li>
                            <li>All your locations including WFH</li>
                            <li>All your callout records</li>
                          </ul>
                          <p className="text-sm text-destructive font-medium mt-2">
                            This cannot be undone.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="deleteConfirm" className="text-sm">
                        Type <span className="font-mono font-bold">DELETE</span> to confirm
                      </Label>
                      <Input
                        id="deleteConfirm"
                        placeholder="DELETE"
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        className="mt-1.5 border-destructive/30 focus-visible:ring-destructive"
                      />
                    </div>

                    {deleteError && (
                      <p className="text-sm text-destructive">{deleteError}</p>
                    )}

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1 rounded-xl"
                        onClick={() => {
                          setDeleteConfirmOpen(false)
                          setDeleteConfirmText("")
                          setDeleteError(null)
                        }}
                        disabled={deleting}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        className="flex-1 rounded-xl gap-2"
                        onClick={handleDeleteAccount}
                        disabled={deleteConfirmText !== "DELETE" || deleting}
                      >
                        {deleting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                        {deleting ? "Deleting..." : "Delete My Account"}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
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

      <BottomNav currentPath="/settings" />
    </motion.div>
  )
}
