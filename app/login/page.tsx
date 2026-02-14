"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Mail, Lock, ArrowRight, CheckCircle2, Shield, Clock, Users } from "lucide-react"
import { Logo, LogoMark } from "@/components/logo"

const features = [
  { icon: Shield, label: "Enterprise-grade security" },
  { icon: Clock, label: "Real-time GPS tracking" },
  { icon: Users, label: "Team management tools" },
]

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push("/select-org")
      router.refresh()
    }
  }

  const handleGoogleLogin = async () => {
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

  const handleMagicLink = async () => {
    if (!email) {
      setError("Please enter your email address")
      return
    }

    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
    } else {
      setMagicLinkSent(true)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Panel — Clean marketing */}
      <div className="hidden lg:flex flex-1 bg-muted/30 relative overflow-hidden">
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <Link href="/"><LogoMark className="h-10 w-10 rounded-xl" /></Link>

          <div className="max-w-md">
            <h1 className="text-4xl font-bold leading-tight mb-4">
              Track time with{" "}
              <span className="text-primary">confidence.</span>
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed mb-8">
              GPS-verified attendance tracking with real-time compliance monitoring for modern teams.
            </p>

            <div className="flex flex-wrap gap-3">
              {features.map((f) => (
                <div
                  key={f.label}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-background border border-border/50 text-sm"
                >
                  <f.icon className="h-4 w-4 text-primary" />
                  <span className="text-foreground/80">{f.label}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-sm text-muted-foreground">Trusted by 500+ teams worldwide</p>
        </div>
      </div>

      {/* Right Panel — Form */}
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

          {magicLinkSent ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Check your email</h2>
              <p className="text-muted-foreground mb-6">
                We sent a magic link to <strong className="text-foreground">{email}</strong>
              </p>
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => setMagicLinkSent(false)}
              >
                Back to login
              </Button>
            </motion.div>
          ) : (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-1">Welcome back</h2>
                <p className="text-muted-foreground">Sign in to your account</p>
              </div>

              {/* Google OAuth */}
              <Button
                type="button"
                variant="outline"
                className="w-full h-12 rounded-xl gap-3 border-border/50 mb-4"
                onClick={handleGoogleLogin}
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

              {/* Email/Password Form */}
              <form onSubmit={handleLogin} className="space-y-4">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl p-4 border border-destructive/20 bg-destructive/5 text-sm text-destructive"
                  >
                    {error}
                  </motion.div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email address</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-11 h-12 rounded-xl border-border/50 bg-muted/30 focus:bg-background transition-colors"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                    <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                      Forgot?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-11 h-12 rounded-xl border-border/50 bg-muted/30 focus:bg-background transition-colors"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 rounded-xl gap-2 font-medium"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>

                <div className="relative my-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border/50" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-4 bg-background text-muted-foreground">or continue with</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12 rounded-xl gap-2 border-border/50"
                  onClick={handleMagicLink}
                  disabled={loading}
                >
                  <Mail className="h-4 w-4" />
                  Email Magic Link
                </Button>
              </form>

              <p className="mt-8 text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="font-semibold text-foreground hover:underline">
                  Create one
                </Link>
              </p>
            </>
          )}
        </motion.div>

        {/* Footer */}
        <div className="flex justify-center gap-4 text-xs text-muted-foreground mt-8 pb-6 shrink-0">
          <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
          <span>·</span>
          <a href="#" className="hover:text-foreground transition-colors">Terms</a>
          <span>·</span>
          <a href="#" className="hover:text-foreground transition-colors">Help</a>
        </div>
      </div>
    </div>
  )
}
