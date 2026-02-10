"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Mail, Lock, ArrowRight, Sparkles, Shield, Clock, Users, CheckCircle2 } from "lucide-react"
import { Logo, LogoMark } from "@/components/logo"
import { cn } from "@/lib/utils"

const features = [
  { icon: Shield, text: "Enterprise-grade security" },
  { icon: Clock, text: "Real-time tracking" },
  { icon: Users, text: "Team management" },
]

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
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
      router.push("/")
      router.refresh()
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
      {/* Left Side - Branding */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        {/* Background layers */}
        <div className="absolute inset-0 bg-foreground" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23fff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {/* Floating elements */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-primary/10 blur-3xl"
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-primary/5 blur-3xl"
          animate={{ x: [0, -20, 0], y: [0, 30, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div>
            <LogoMark className="h-12 w-12 rounded-xl" />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-lg"
          >
            <h1 className="text-5xl font-bold text-background leading-tight mb-6">
              Track time with
              <br />
              <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                confidence.
              </span>
            </h1>
            <p className="text-lg text-background/60 leading-relaxed mb-10">
              GPS-verified attendance tracking with real-time compliance monitoring.
              Know your status at a glance.
            </p>

            <div className="space-y-4">
              {features.map((feature, i) => (
                <motion.div
                  key={feature.text}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-background/10 flex items-center justify-center">
                    <feature.icon className="h-5 w-5 text-background/80" />
                  </div>
                  <span className="text-background/80">{feature.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <div className="flex items-center gap-4">
            <div className="flex -space-x-3">
              {["bg-emerald-500", "bg-blue-500", "bg-violet-500", "bg-amber-500"].map((color, i) => (
                <div key={i} className={cn("w-10 h-10 rounded-full border-2 border-foreground flex items-center justify-center", color)}>
                  <span className="text-xs text-white font-bold">{["US", "HQ", "MC", "NY"][i]}</span>
                </div>
              ))}
            </div>
            <p className="text-sm text-background/50">Trusted by teams worldwide</p>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          {/* Mobile Logo */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
            className="flex items-center justify-center mb-10 lg:hidden"
          >
            <Logo size="md" />
          </motion.div>

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
              {/* Header */}
              <div className="mb-8">
                <h2 className="text-3xl font-bold mb-2">Welcome back</h2>
                <p className="text-muted-foreground">Sign in to continue to your dashboard</p>
              </div>

              {/* Form */}
              <form onSubmit={handleLogin} className="space-y-5">
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
                      Forgot password?
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
                  className="w-full h-12 rounded-xl bg-foreground text-background hover:bg-foreground/90 gap-2 font-medium"
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

                <div className="relative my-6">
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
                  <Sparkles className="h-4 w-4" />
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
        <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4 text-xs text-muted-foreground">
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
