"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Clock,
  MapPin,
  Home,
  Building2,
  ChevronRight,
  ChevronLeft,
  Check,
  BarChart3,
  Shield,
  Navigation,
  Loader2,
  Search,
} from "lucide-react"

interface OnboardingProps {
  onComplete: () => void
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0)
  const [wfhAddress, setWfhAddress] = useState("")
  const [wfhLat, setWfhLat] = useState("")
  const [wfhLng, setWfhLng] = useState("")
  const [skipWfh, setSkipWfh] = useState(false)
  const [detectingLocation, setDetectingLocation] = useState(false)
  const [geocoding, setGeocoding] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const detectHomeLocation = () => {
    setDetectingLocation(true)
    setError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setWfhLat(pos.coords.latitude.toFixed(6))
        setWfhLng(pos.coords.longitude.toFixed(6))
        setDetectingLocation(false)
      },
      (err) => {
        console.error("Geolocation error:", err)
        setError("Could not detect location. Please enter coordinates manually or try again.")
        setDetectingLocation(false)
      },
      { enableHighAccuracy: true, timeout: 15000 }
    )
  }

  const geocodeAddress = async () => {
    if (!wfhAddress.trim() || wfhAddress.trim().length < 3) {
      setError("Enter a valid address to look up")
      return
    }
    setGeocoding(true)
    setError(null)
    try {
      const res = await fetch(`/api/geocode?address=${encodeURIComponent(wfhAddress.trim())}`)
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Could not find address")
      } else {
        setWfhLat(data.latitude.toFixed(6))
        setWfhLng(data.longitude.toFixed(6))
      }
    } catch {
      setError("Failed to look up address")
    }
    setGeocoding(false)
  }

  const handleFinish = async () => {
    setSubmitting(true)
    setError(null)

    try {
      const body: Record<string, unknown> = {}

      if (!skipWfh && wfhLat && wfhLng) {
        body.wfhAddress = wfhAddress
        body.wfhLatitude = parseFloat(wfhLat)
        body.wfhLongitude = parseFloat(wfhLng)
      }

      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to complete setup")
      }

      onComplete()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
      setSubmitting(false)
    }
  }

  const steps = [
    // Step 0: Welcome
    {
      title: "Welcome to OnSite",
      content: (
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <Logo size="lg" />
          </div>
          <div className="space-y-2">
            <p className="text-muted-foreground">
              Your personal time and attendance tracker. Let's get you set up in a few quick steps.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-muted/50 space-y-2 text-center">
              <Clock className="h-6 w-6 text-primary mx-auto" />
              <p className="text-xs font-medium">Track Time</p>
            </div>
            <div className="p-3 rounded-xl bg-muted/50 space-y-2 text-center">
              <MapPin className="h-6 w-6 text-primary mx-auto" />
              <p className="text-xs font-medium">GPS Verified</p>
            </div>
            <div className="p-3 rounded-xl bg-muted/50 space-y-2 text-center">
              <BarChart3 className="h-6 w-6 text-primary mx-auto" />
              <p className="text-xs font-medium">Reports</p>
            </div>
          </div>
        </div>
      ),
    },
    // Step 1: How it works
    {
      title: "How It Works",
      content: (
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">Locations</p>
              <p className="text-sm text-muted-foreground">
                Your work sites are pre-loaded. When you're within range, you can clock in.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Navigation className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">GPS Geofencing</p>
              <p className="text-sm text-muted-foreground">
                Your location is verified via GPS each time you clock in or out. You must be within range of a location.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">Your Data</p>
              <p className="text-sm text-muted-foreground">
                All your time entries, reports, and locations are private to your account. Only you can see your data.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">40-Hour Tracking</p>
              <p className="text-sm text-muted-foreground">
                Weekly and monthly reports track your hours against the standard 40-hour work week and 3-day in-office policy.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    // Step 2: WFH Setup
    {
      title: "Set Up Work From Home",
      content: (
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/50">
            <Home className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">Home Office Location</p>
              <p className="text-xs text-muted-foreground">
                Set your home address so you can clock in when working from home. WFH days don't count toward in-office compliance but are tracked for total hours.
              </p>
            </div>
          </div>

          {!skipWfh ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="wfhAddress" className="text-sm">Home Address</Label>
                <div className="flex gap-2 mt-1.5">
                  <Input
                    id="wfhAddress"
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
                    disabled={geocoding || !wfhAddress.trim()}
                    className="flex-shrink-0"
                    title="Look up coordinates from address"
                  >
                    {geocoding ? (
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
                  <Label htmlFor="wfhLat" className="text-sm">Latitude</Label>
                  <Input
                    id="wfhLat"
                    type="number"
                    step="any"
                    placeholder="34.7373"
                    value={wfhLat}
                    onChange={(e) => setWfhLat(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="wfhLng" className="text-sm">Longitude</Label>
                  <Input
                    id="wfhLng"
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
                disabled={detectingLocation}
              >
                {detectingLocation ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Navigation className="h-4 w-4" />
                )}
                {detectingLocation ? "Detecting..." : "Use My Current Location"}
              </Button>

              <button
                type="button"
                onClick={() => setSkipWfh(true)}
                className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2 w-full text-center"
              >
                Skip — I'll set this up later in Settings
              </button>
            </div>
          ) : (
            <div className="text-center py-4 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-muted mx-auto flex items-center justify-center">
                <Home className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                No problem! You can set up your home location anytime in Settings.
              </p>
              <button
                type="button"
                onClick={() => setSkipWfh(false)}
                className="text-sm text-primary hover:underline"
              >
                Actually, I want to set it up now
              </button>
            </div>
          )}
        </div>
      ),
    },
    // Step 3: Ready
    {
      title: "You're All Set!",
      content: (
        <div className="text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-success/10 mx-auto flex items-center justify-center">
            <Check className="h-8 w-8 text-success" />
          </div>
          <div className="space-y-2">
            <p className="text-muted-foreground">
              Your account is ready. All company locations have been added to your profile.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-left">
            <div className="p-3 rounded-xl bg-muted/50">
              <Building2 className="h-5 w-5 text-primary mb-1" />
              <p className="text-xs font-medium">7 Office Sites</p>
              <p className="text-[11px] text-muted-foreground">US0, HNA, US2, SPA, LXT, MCC, MARC</p>
            </div>
            <div className="p-3 rounded-xl bg-muted/50">
              <Home className="h-5 w-5 text-primary mb-1" />
              <p className="text-xs font-medium">{skipWfh || (!wfhLat && !wfhLng) ? "No WFH Set" : "WFH Ready"}</p>
              <p className="text-[11px] text-muted-foreground">
                {skipWfh || (!wfhLat && !wfhLng) ? "Set up in Settings" : "Home office configured"}
              </p>
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>
      ),
    },
  ]

  const isLastStep = step === steps.length - 1

  return (
    <div className="fixed inset-0 z-[100] bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-mesh pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-6">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step ? "w-8 bg-primary" : i < step ? "w-4 bg-primary/40" : "w-4 bg-muted"
              }`}
            />
          ))}
        </div>

        <Card className="border-0 shadow-xl">
          <CardContent className="p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="text-xl font-bold mb-4 text-center">{steps[step].title}</h2>
                {steps[step].content}
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              {step > 0 ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep(step - 1)}
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </Button>
              ) : (
                <div />
              )}

              {isLastStep ? (
                <Button
                  onClick={handleFinish}
                  disabled={submitting}
                  className="gap-2"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  {submitting ? "Setting up..." : "Get Started"}
                </Button>
              ) : (
                <Button
                  onClick={() => setStep(step + 1)}
                  className="gap-1"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
