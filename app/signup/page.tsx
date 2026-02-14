"use client"

import { useState, useRef } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Loader2,
  Mail,
  Lock,
  User,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Building2,
  Link as LinkIcon,
  MapPin,
  Clock,
  Shield,
  Trophy,
  Check,
  X,
} from "lucide-react"
import { Logo, LogoMark } from "@/components/logo"

const benefits = [
  { icon: MapPin, label: "GPS-verified clock in/out" },
  { icon: Clock, label: "Real-time attendance" },
  { icon: Shield, label: "Compliance monitoring" },
  { icon: Trophy, label: "Gamification & rewards" },
]

type OrgIntent = "create" | "join" | null

export default function SignupPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [orgIntent, setOrgIntent] = useState<OrgIntent>(null)
  const [orgName, setOrgName] = useState("")
  const [orgSlug, setOrgSlug] = useState("")
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle")
  const [slugError, setSlugError] = useState("")
  const [inviteCode, setInviteCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [direction, setDirection] = useState<1 | -1>(1)
  const supabase = createClient()
  const slugDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const totalSteps = 3

  const handleOrgNameChange = (name: string) => {
    setOrgName(name)
    if (!slugManuallyEdited) {
      const generated = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 50)
      setOrgSlug(generated)
      checkSlugAvailability(generated)
    }
  }

  const handleSlugChange = (value: string) => {
    const cleaned = value.toLowerCase().replace(/[^a-z0-9-]/g, "")
    setOrgSlug(cleaned)
    setSlugManuallyEdited(true)
    checkSlugAvailability(cleaned)
  }

  const checkSlugAvailability = (slug: string) => {
    if (!slug || slug.length < 2) {
      setSlugStatus("idle")
      setSlugError("")
      return
    }
    if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(slug)) {
      setSlugStatus("invalid")
      setSlugError("Use lowercase letters, numbers, and hyphens only")
      return
    }

    setSlugStatus("checking")
    if (slugDebounceRef.current) clearTimeout(slugDebounceRef.current)
    slugDebounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/org/check-slug?slug=${encodeURIComponent(slug)}`)
        const data = await res.json()
        if (data.available) {
          setSlugStatus("available")
          setSlugError("")
        } else {
          setSlugStatus("taken")
          setSlugError(data.reason || "Not available")
        }
      } catch {
        setSlugStatus("idle")
      }
    }, 400)
  }

  const handleGoogleSignup = async () => {
    setGoogleLoading(true)
    setError(null)
    try {
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
    } catch {
      setError("Failed to connect to Google. Please try again.")
      setGoogleLoading(false)
    }
  }

  const handleSignup = async () => {
    if (orgIntent === "create" && !orgName.trim()) {
      setError("Organization name is required")
      return
    }
    if (orgIntent === "join" && !inviteCode.trim()) {
      setError("Invite code is required")
      return
    }
    if (!orgIntent) {
      setError("Please choose to create or join an organization")
      return
    }

    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          full_name: `${firstName} ${lastName}`.trim(),
          first_name: firstName,
          last_name: lastName,
          org_intent: orgIntent,
          org_name: orgIntent === "create" ? orgName.trim() : undefined,
          org_slug: orgIntent === "create" ? orgSlug : undefined,
          invite_code: orgIntent === "join" ? inviteCode.trim().toUpperCase() : undefined,
        },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setDirection(1)
      setStep(3)
      setLoading(false)
    }
  }

  const goNext = () => {
    setError(null)
    setDirection(1)
    if (step === 1) {
      if (!firstName.trim() || !lastName.trim()) {
        setError("First and last name are required")
        return
      }
      if (!email.trim()) {
        setError("Email is required")
        return
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters")
        return
      }
      setStep(2)
    }
  }

  const goBack = () => {
    setError(null)
    setDirection(-1)
    if (step === 2) setStep(1)
  }

  const slideVariants = {
    enter: (dir: number) => ({ x: dir * 20, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir * -20, opacity: 0 }),
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Panel — Clean marketing */}
      <div className="hidden lg:flex flex-1 bg-muted/30 relative overflow-hidden">
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <Link href="/"><LogoMark className="h-10 w-10 rounded-xl" /></Link>

          <div className="max-w-md">
            <h1 className="text-4xl font-bold leading-tight mb-4">
              Join thousands of{" "}
              <span className="text-primary">modern teams.</span>
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed mb-8">
              Setup in under 5 minutes. GPS-verified clock in/out for your entire team.
            </p>

            <div className="flex flex-wrap gap-3">
              {benefits.map((b) => (
                <div
                  key={b.label}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-background border border-border/50 text-sm"
                >
                  <b.icon className="h-4 w-4 text-primary" />
                  <span className="text-foreground/80">{b.label}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-sm text-muted-foreground">Free to start, no credit card required</p>
        </div>
      </div>

      {/* Right Panel — Multi-step Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm"
        >
          {/* Mobile Logo */}
          <div className="flex items-center justify-center mb-10 lg:hidden">
            <Link href="/"><Logo size="md" /></Link>
          </div>

          {/* Step Indicator */}
          <div className="flex justify-center gap-2 mb-8">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i + 1 === step
                    ? "w-8 bg-primary"
                    : i + 1 < step
                      ? "w-4 bg-primary/40"
                      : "w-4 bg-muted"
                }`}
              />
            ))}
          </div>

          <AnimatePresence mode="wait" custom={direction}>
            {step === 1 && (
              <motion.div
                key="step1"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.2 }}
              >
                <div className="mb-6">
                  <h2 className="text-2xl font-bold mb-1">Create your account</h2>
                  <p className="text-muted-foreground">Get started in minutes</p>
                </div>

                {/* Google OAuth */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12 rounded-xl gap-3 border-border/50 mb-4"
                  onClick={handleGoogleSignup}
                  disabled={googleLoading}
                >
                  {googleLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                  )}
                  Continue with Google
                </Button>

                <div className="relative my-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border/50" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-4 bg-background text-muted-foreground">or</span>
                  </div>
                </div>

                <div className="space-y-4">
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-xl p-4 border border-destructive/20 bg-destructive/5 text-sm text-destructive"
                    >
                      {error}
                    </motion.div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-sm font-medium">First name</Label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="firstName"
                          type="text"
                          placeholder="Jane"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="pl-11 h-12 rounded-xl border-border/50 bg-muted/30 focus:bg-background transition-colors"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-sm font-medium">Last name</Label>
                      <Input
                        id="lastName"
                        type="text"
                        placeholder="Smith"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="h-12 rounded-xl border-border/50 bg-muted/30 focus:bg-background transition-colors"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">Work email</Label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="jane@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-11 h-12 rounded-xl border-border/50 bg-muted/30 focus:bg-background transition-colors"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="Min 6 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-11 h-12 rounded-xl border-border/50 bg-muted/30 focus:bg-background transition-colors"
                        required
                        minLength={6}
                      />
                    </div>
                  </div>

                  <Button
                    type="button"
                    className="w-full h-12 rounded-xl gap-2 font-medium"
                    onClick={goNext}
                  >
                    Continue
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>

                <p className="mt-8 text-center text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link href="/login" className="font-semibold text-foreground hover:underline">
                    Sign in
                  </Link>
                </p>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.2 }}
              >
                <div className="mb-6">
                  <h2 className="text-2xl font-bold mb-1">Your organization</h2>
                  <p className="text-muted-foreground">Create a new team or join an existing one</p>
                </div>

                <div className="space-y-4">
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-xl p-4 border border-destructive/20 bg-destructive/5 text-sm text-destructive"
                    >
                      {error}
                    </motion.div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => { setOrgIntent("create"); setError(null) }}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        orgIntent === "create"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/30"
                      }`}
                    >
                      <Building2 className={`h-6 w-6 mb-2 ${orgIntent === "create" ? "text-primary" : "text-muted-foreground"}`} />
                      <p className="font-medium text-sm">Create New</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Start fresh</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setOrgIntent("join"); setError(null) }}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        orgIntent === "join"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/30"
                      }`}
                    >
                      <LinkIcon className={`h-6 w-6 mb-2 ${orgIntent === "join" ? "text-primary" : "text-muted-foreground"}`} />
                      <p className="font-medium text-sm">Join Team</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Have a code?</p>
                    </button>
                  </div>

                  <AnimatePresence mode="wait">
                    {orgIntent === "create" && (
                      <motion.div
                        key="create-input"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-2"
                      >
                        <Label htmlFor="orgName" className="text-sm font-medium">Organization name</Label>
                        <div className="relative">
                          <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="orgName"
                            placeholder="e.g., Acme Corp"
                            value={orgName}
                            onChange={(e) => handleOrgNameChange(e.target.value)}
                            className="pl-11 h-12 rounded-xl border-border/50 bg-muted/30 focus:bg-background transition-colors"
                          />
                        </div>

                        <Label htmlFor="orgSlug" className="text-sm font-medium mt-3 block">URL slug</Label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground select-none">
                            app.usekpr.com/
                          </span>
                          <Input
                            id="orgSlug"
                            placeholder="your-company"
                            value={orgSlug}
                            onChange={(e) => handleSlugChange(e.target.value)}
                            className="pl-[120px] pr-10 h-12 rounded-xl border-border/50 bg-muted/30 focus:bg-background transition-colors font-mono text-sm"
                          />
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            {slugStatus === "checking" && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                            {slugStatus === "available" && <Check className="h-4 w-4 text-emerald-500" />}
                            {(slugStatus === "taken" || slugStatus === "invalid") && <X className="h-4 w-4 text-destructive" />}
                          </div>
                        </div>
                        {slugError && (
                          <p className="text-xs text-destructive">{slugError}</p>
                        )}
                        {slugStatus === "available" && (
                          <p className="text-xs text-emerald-600">This slug is available!</p>
                        )}
                      </motion.div>
                    )}
                    {orgIntent === "join" && (
                      <motion.div
                        key="join-input"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-2"
                      >
                        <Label htmlFor="inviteCode" className="text-sm font-medium">Invite code</Label>
                        <Input
                          id="inviteCode"
                          placeholder="e.g., AB3K7NXQ"
                          value={inviteCode}
                          onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                          className="h-12 rounded-xl border-border/50 bg-muted/30 focus:bg-background transition-colors font-mono tracking-wider text-center text-lg"
                          maxLength={8}
                        />
                        <p className="text-xs text-muted-foreground">
                          Ask your admin for the 8-character invite code.
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex items-center gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-12 rounded-xl gap-2 border-border/50"
                      onClick={goBack}
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back
                    </Button>
                    <Button
                      type="button"
                      className="flex-1 h-12 rounded-xl gap-2 font-medium"
                      onClick={handleSignup}
                      disabled={loading || !orgIntent}
                    >
                      {loading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <>
                          Create Account
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.2 }}
                className="text-center"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Check your email</h2>
                <p className="text-muted-foreground mb-6">
                  We sent a confirmation link to{" "}
                  <strong className="text-foreground">{email}</strong>
                </p>

                <div className="rounded-xl border border-border/50 bg-muted/30 p-5 mb-6 text-left">
                  <p className="text-sm text-muted-foreground">
                    Click the link in your email to verify your account. The link expires in 24 hours.
                  </p>
                </div>

                <Button
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => window.location.href = "/login"}
                >
                  Back to Login
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-8 pb-6 shrink-0">
          By continuing, you agree to KPR&apos;s{" "}
          <a href="/legal/terms" className="font-semibold hover:text-foreground transition-colors">Terms of Service</a>{" "}
          and{" "}
          <a href="/legal/privacy" className="font-semibold hover:text-foreground transition-colors">Privacy Policy</a>.
        </p>
      </div>
    </div>
  )
}
