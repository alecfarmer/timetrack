"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Settings,
  MapPin,
  Bell,
  Shield,
  Clock,
  ChevronRight,
  LogOut,
  Smartphone,
} from "lucide-react"
import { BottomNav } from "@/components/bottom-nav"

export default function SettingsPage() {
  const [notifications, setNotifications] = useState(true)
  const [autoClockOut, setAutoClockOut] = useState(false)
  const [isPWAInstalled, setIsPWAInstalled] = useState(false)

  useEffect(() => {
    // Check if app is installed as PWA
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsPWAInstalled(true)
    }
  }, [])

  const handleLogout = async () => {
    // TODO: Implement logout with Supabase
    window.location.href = "/login"
  }

  const handleInstallPWA = () => {
    // TODO: Trigger PWA install prompt
    alert("To install: tap the share button and select 'Add to Home Screen'")
  }

  return (
    <div className="flex flex-col min-h-screen pb-20">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center px-4 h-14">
          <h1 className="text-xl font-bold">Settings</h1>
        </div>
      </header>

      <main className="flex-1 p-4 space-y-4">
        {/* Install PWA Card */}
        {!isPWAInstalled && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-primary">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  Install App
                </CardTitle>
                <CardDescription>
                  Install OnSite for the best experience
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handleInstallPWA} className="w-full">
                  Install on Device
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Locations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Locations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="ghost" className="w-full justify-between" asChild>
                <a href="/settings/locations">
                  Manage Locations
                  <ChevronRight className="h-4 w-4" />
                </a>
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Policy */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Work Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Required Days</p>
                  <p className="text-sm text-muted-foreground">3 days per week</p>
                </div>
                <Button variant="outline" size="sm">
                  Edit
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Preferences */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Bell className="h-4 w-4" />
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="ghost" className="w-full justify-between">
                Change PIN
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Separator />
              <Button
                variant="ghost"
                className="w-full justify-between text-destructive hover:text-destructive"
                onClick={handleLogout}
              >
                <span className="flex items-center gap-2">
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </span>
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* App Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="text-center text-sm text-muted-foreground pt-4">
            <p>OnSite v0.1.0</p>
            <p>Personal Time & Attendance Tracker</p>
          </div>
        </motion.div>
      </main>

      <BottomNav currentPath="/settings" />
    </div>
  )
}
