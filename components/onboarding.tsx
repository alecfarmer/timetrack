"use client"

import { useState, useEffect } from "react"
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
  Users,
  Link as LinkIcon,
} from "lucide-react"

interface OnboardingProps {
  onComplete: () => void
}

type OrgMode = "create" | "join" | null

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0)
  const [orgMode, setOrgMode] = useState<OrgMode>(null)
  const [orgName, setOrgName] = useState("")
  const [inviteCode, setInviteCode] = useState("")
  const [wfhAddress, setWfhAddress] = useState("")
  const [wfhLat, setWfhLat] = useState("")
  const [wfhLng, setWfhLng] = useState("")
  const [skipWfh, setSkipWfh] = useState(false)
  const [detectingLocation, setDetectingLocation] = useState(false)
  const [geocoding, setGeocoding] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingInvites, setPendingInvites] = useState<Array<{ code: string; org: { name: string } | null }>>([])

  useEffect(() => {
    async function checkPendingInvites() {
      try {
        const res = await fetch("/api/onboarding")
        if (res.ok) {
          const data = await res.json()
          if (data.pendingInvites?.length > 0) {
            setPendingInvites(data.pendingInvites)
            setOrgMode("join")
            setInviteCode(data.pendingInvites[0].code)
          }
        }
      } catch {
        // ignore
      }
    }
    checkPendingInvites()
  }, [])

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
    if (orgMode === "create" && !orgName.trim()) {
      setError("Organization name is required")
      return
    }
    if (orgMode === "join" && !inviteCode.trim()) {
      setError("Invite code is required")
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const body: Record<string, unknown> = {}

      if (orgMode === "create") {
        body.orgName = orgName.trim()
      } else if (orgMode === "join") {
        body.inviteCode = inviteCode.trim().toUpperCase()
      }

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
      title: "Welcome to KPR",
      content: (
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <Logo size="lg" />
          </div>
          <div className="space-y-2">
            <p className="text-muted-foreground">
              Your team&apos;s time and attendance tracker. Let&apos;s get you set up in a few quick steps.
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
              <Users className="h-6 w-6 text-primary mx-auto" />
              <p className="text-xs font-medium">Team View</p>
            </div>
          </div>
        </div>
      ),
    },
    // Step 1: Create or join org
    {
      title: "Your Organization",
      content: (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Create a new organization or join an existing one with an invite code.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => { setOrgMode("create"); setError(null) }}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                orgMode === "create"
                  ? "border-primary bg-primary/5"
                  : "border-muted hover:border-muted-foreground/30"
              }`}
            >
              <Building2 className={`h-6 w-6 mb-2 ${orgMode === "create" ? "text-primary" : "text-muted-foreground"}`} />
              <p className="font-medium text-sm">Create New</p>
              <p className="text-xs text-muted-foreground">Start a new organization</p>
            </button>
            <button
              type="button"
              onClick={() => { setOrgMode("join"); setError(null) }}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                orgMode === "join"
                  ? "border-primary bg-primary/5"
                  : "border-muted hover:border-muted-foreground/30"
              }`}
            >
              <LinkIcon className={`h-6 w-6 mb-2 ${orgMode === "join" ? "text-primary" : "text-muted-foreground"}`} />
              <p className="font-medium text-sm">Join Existing</p>
              <p className="text-xs text-muted-foreground">Use an invite code</p>
            </button>
          </div>

          {pendingInvites.length > 0 && (
            <div className="p-3 rounded-xl bg-primary/5 border border-primary/20">
              <p className="text-sm font-medium text-primary">You have a pending invite!</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {pendingInvites[0].org
                  ? `${(Array.isArray(pendingInvites[0].org) ? pendingInvites[0].org[0] : pendingInvites[0].org).name} has invited you to join.`
                  : "An organization has invited you to join."}
              </p>
            </div>
          )}

          <AnimatePresence mode="wait">
            {orgMode === "create" && (
              <motion.div
                key="create"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                <Label htmlFor="orgName">Organization Name</Label>
                <Input
                  id="orgName"
                  placeholder="e.g., Acme Corp"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  You&apos;ll be the admin. Default work sites will be added automatically.
                </p>
              </motion.div>
            )}
            {orgMode === "join" && (
              <motion.div
                key="join"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                <Label htmlFor="inviteCode">Invite Code</Label>
                <Input
                  id="inviteCode"
                  placeholder="e.g., AB3K7NXQ"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  className="font-mono tracking-wider text-center text-lg"
                  maxLength={8}
                />
                <p className="text-xs text-muted-foreground">
                  Ask your admin for the 8-character invite code.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
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
                Set your home address so you can clock in when working from home. WFH days don&apos;t count toward in-office compliance but are tracked for total hours.
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
                Skip — I&apos;ll set this up later in Settings
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
              {orgMode === "create"
                ? `"${orgName}" has been created. Default company locations have been added.`
                : "You've joined the organization. All shared locations are ready."}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-left">
            <div className="p-3 rounded-xl bg-muted/50">
              <Building2 className="h-5 w-5 text-primary mb-1" />
              <p className="text-xs font-medium">
                {orgMode === "create" ? "7 Office Sites" : "Org Locations"}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {orgMode === "create" ? "US0, HNA, US2, SPA, LXT, MCC, MARC" : "Shared by your team"}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-muted/50">
              <Home className="h-5 w-5 text-primary mb-1" />
              <p className="text-xs font-medium">{skipWfh || (!wfhLat && !wfhLng) ? "No WFH Set" : "WFH Ready"}</p>
              <p className="text-[11px] text-muted-foreground">
                {skipWfh || (!wfhLat && !wfhLng) ? "Set up in Settings" : "Home office configured"}
              </p>
            </div>
          </div>

          {orgMode === "create" && (
            <div className="p-3 rounded-xl bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="h-4 w-4 text-primary" />
                <p className="text-xs font-medium text-primary">Admin Access</p>
              </div>
              <p className="text-xs text-muted-foreground">
                You&apos;re the admin. Invite team members from Settings &gt; Team.
              </p>
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>
      ),
    },
  ]

  const canProceed = () => {
    if (step === 1) {
      if (!orgMode) return false
      if (orgMode === "create" && !orgName.trim()) return false
      if (orgMode === "join" && !inviteCode.trim()) return false
    }
    return true
  }

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
                  onClick={() => { setError(null); setStep(step + 1) }}
                  disabled={!canProceed()}
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
