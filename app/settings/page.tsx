"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
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
  Smartphone,
  Palette,
  User,
  Home,
  Navigation,
  Loader2,
  Check,
  Pencil,
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
  const [autoClockOut, setAutoClockOut] = useState(false)
  const [isPWAInstalled, setIsPWAInstalled] = useState(false)

  // WFH state
  const [wfhLocation, setWfhLocation] = useState<WfhLocation | null>(null)
  const [wfhLoading, setWfhLoading] = useState(true)
  const [wfhEditing, setWfhEditing] = useState(false)
  const [wfhAddress, setWfhAddress] = useState("")
  const [wfhLat, setWfhLat] = useState("")
  const [wfhLng, setWfhLng] = useState("")
  const [wfhSaving, setWfhSaving] = useState(false)
  const [wfhDetecting, setWfhDetecting] = useState(false)
  const [wfhError, setWfhError] = useState<string | null>(null)
  const [wfhSuccess, setWfhSuccess] = useState(false)

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsPWAInstalled(true)
    }
  }, [])

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

  const handleInstallPWA = () => {
    alert("To install: tap the share button and select 'Add to Home Screen'")
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

          {/* Install PWA Card */}
          {!isPWAInstalled && (
            <motion.div variants={staggerItem}>
              <Card className="border-0 shadow-lg ring-2 ring-primary/20 bg-primary/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <Smartphone className="h-5 w-5 text-primary" />
                    Install App
                  </CardTitle>
                  <CardDescription>
                    Install OnSite for the best experience
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={handleInstallPWA} className="w-full rounded-xl">
                    Install on Device
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

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
                      <Input
                        id="settingsWfhAddress"
                        placeholder="123 Main St, City, State ZIP"
                        value={wfhAddress}
                        onChange={(e) => setWfhAddress(e.target.value)}
                        className="mt-1.5"
                      />
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
                <div className="flex items-center justify-between bg-muted/50 rounded-xl p-4">
                  <div>
                    <p className="font-medium">Required Days</p>
                    <p className="text-sm text-muted-foreground">3 days per week</p>
                  </div>
                  <Button variant="outline" size="sm" className="rounded-lg">
                    Edit
                  </Button>
                </div>
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
                    <Label htmlFor="notifications">Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Reminder to clock in/out
                    </p>
                  </div>
                  <Switch
                    id="notifications"
                    checked={notifications}
                    onCheckedChange={setNotifications}
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
                    onCheckedChange={setAutoClockOut}
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
                <Button variant="ghost" className="w-full justify-between rounded-xl h-12">
                  <span>Change PIN</span>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </Button>
                <Separator />
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

          {/* App Info */}
          <motion.div variants={staggerItem}>
            <div className="text-center text-sm text-muted-foreground py-4">
              <p className="font-medium">OnSite v1.0.0</p>
              <p>Personal Time & Attendance Tracker</p>
            </div>
          </motion.div>
        </div>
      </motion.main>

      <BottomNav currentPath="/settings" />
    </motion.div>
  )
}
