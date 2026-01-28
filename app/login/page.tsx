"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Mail, Lock, ArrowRight, Sparkles } from "lucide-react"
import { Logo, LogoMark } from "@/components/logo"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
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
      setError(null)
      alert("Check your email for the login link!")
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Side - Branding (desktop only) */}
      <div className="hidden lg:flex flex-1 bg-gradient-mesh items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-primary opacity-5" />
        <div className="absolute top-20 left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 max-w-md"
        >
          <div className="mb-8">
            <LogoMark className="h-16 w-16" />
          </div>
          <h1 className="heading-1 mb-4">
            Track your time,<br />
            <span className="text-gradient">anywhere you work.</span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            GPS-verified attendance tracking with real-time compliance monitoring.
            Know your status at a glance.
          </p>

          <div className="mt-8 flex items-center gap-4">
            <div className="flex -space-x-2">
              {["bg-primary", "bg-success", "bg-warning"].map((color, i) => (
                <div key={i} className={`w-8 h-8 rounded-full ${color} border-2 border-background flex items-center justify-center`}>
                  <span className="text-xs text-white font-bold">{["US0", "HNA", "MCC"][i]?.charAt(0)}</span>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">8 locations tracked</p>
          </div>
        </motion.div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:max-w-lg">
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
            className="flex items-center justify-center gap-3 mb-10 lg:hidden"
          >
            <Logo size="md" />
          </motion.div>

          {/* Header */}
          <div className="mb-8">
            <h2 className="heading-2 mb-2">Welcome back</h2>
            <p className="text-muted-foreground">Sign in to your account to continue</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="card-elevated p-3 border-destructive/20 bg-destructive/5 text-sm text-destructive"
              >
                {error}
              </motion.div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 rounded-xl"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-12 rounded-xl"
                  required
                />
              </div>
            </div>

            <motion.div whileTap={{ scale: 0.98 }}>
              <Button
                type="submit"
                className="w-full h-12 rounded-xl bg-gradient-primary hover:opacity-90 transition-opacity gap-2"
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
            </motion.div>

            <div className="divider-text">or continue with</div>

            <Button
              type="button"
              variant="outline"
              className="w-full h-12 rounded-xl gap-2"
              onClick={handleMagicLink}
              disabled={loading}
            >
              <Sparkles className="h-4 w-4" />
              Magic Link
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-medium text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
