"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"
import {
  LogIn,
  LogOut as LogOutIcon,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Delete,
} from "lucide-react"
import { cn } from "@/lib/utils"

type KioskState = "idle" | "entering-email" | "processing" | "success" | "error"

export default function KioskPage() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token") || ""

  const [state, setState] = useState<KioskState>("idle")
  const [email, setEmail] = useState("")
  const [action, setAction] = useState<"clock-in" | "clock-out">("clock-in")
  const [message, setMessage] = useState("")
  const [currentTime, setCurrentTime] = useState(new Date())
  const inputRef = useRef<HTMLInputElement>(null)

  // Update time every second
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  // Auto-reset after success/error
  useEffect(() => {
    if (state === "success" || state === "error") {
      const timeout = setTimeout(() => {
        setState("idle")
        setEmail("")
        setMessage("")
      }, 4000)
      return () => clearTimeout(timeout)
    }
  }, [state])

  // Focus input when entering email
  useEffect(() => {
    if (state === "entering-email" && inputRef.current) {
      inputRef.current.focus()
    }
  }, [state])

  const handleClock = async () => {
    if (!email.trim() || !token) return
    setState("processing")

    try {
      const res = await fetch("/api/kiosk/clock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email: email.trim(), action }),
      })

      const data = await res.json()

      if (res.ok) {
        setState("success")
        setMessage(data.message || `${action === "clock-in" ? "Clocked in" : "Clocked out"} successfully`)
      } else {
        setState("error")
        setMessage(data.error || "Something went wrong")
      }
    } catch {
      setState("error")
      setMessage("Connection error. Please try again.")
    }
  }

  const handlePinKey = (key: string) => {
    if (key === "backspace") {
      setEmail((prev) => prev.slice(0, -1))
    } else {
      setEmail((prev) => prev + key)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <Card className="p-8 text-center max-w-md">
          <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">Invalid Kiosk Link</h1>
          <p className="text-muted-foreground">
            This kiosk link is missing a token. Please contact your administrator to get the correct URL.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 select-none">
      {/* Header */}
      <div className="mb-8 text-center">
        <Logo size="lg" />
        <div className="mt-4">
          <p className="text-4xl font-bold tabular-nums">
            {currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
          <p className="text-muted-foreground mt-1">
            {currentTime.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-md">
        {state === "idle" && (
          <div className="space-y-4">
            <Button
              size="lg"
              className="w-full h-20 text-xl gap-3"
              onClick={() => {
                setAction("clock-in")
                setState("entering-email")
              }}
            >
              <LogIn className="h-7 w-7" />
              Clock In
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full h-20 text-xl gap-3"
              onClick={() => {
                setAction("clock-out")
                setState("entering-email")
              }}
            >
              <LogOutIcon className="h-7 w-7" />
              Clock Out
            </Button>
          </div>
        )}

        {state === "entering-email" && (
          <Card className="p-6 space-y-4">
            <div className="text-center mb-2">
              <p className="text-lg font-semibold">
                {action === "clock-in" ? "Clock In" : "Clock Out"}
              </p>
              <p className="text-sm text-muted-foreground">Enter your email to continue</p>
            </div>

            <input
              ref={inputRef}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && email.trim()) handleClock()
              }}
              placeholder="your.email@company.com"
              className="w-full px-4 py-3 rounded-xl border bg-background text-center text-lg"
              autoComplete="off"
            />

            {/* On-screen keyboard for tablets */}
            <div className="grid grid-cols-3 gap-2">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9", "@", "0", "."].map((key) => (
                <button
                  key={key}
                  onClick={() => handlePinKey(key)}
                  className="h-14 rounded-xl bg-muted hover:bg-muted/80 text-lg font-medium transition-colors"
                >
                  {key}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handlePinKey("backspace")}
                className="h-14 rounded-xl bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
              >
                <Delete className="h-6 w-6" />
              </button>
              <Button
                className="h-14 text-lg"
                onClick={handleClock}
                disabled={!email.trim()}
              >
                {action === "clock-in" ? "Clock In" : "Clock Out"}
              </Button>
            </div>

            <Button
              variant="ghost"
              className="w-full"
              onClick={() => {
                setState("idle")
                setEmail("")
              }}
            >
              Cancel
            </Button>
          </Card>
        )}

        {state === "processing" && (
          <div className="text-center py-12">
            <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-4" />
            <p className="text-lg font-medium">Processing...</p>
          </div>
        )}

        {state === "success" && (
          <div className="text-center py-12">
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-12 w-12 text-emerald-500" />
            </div>
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{message}</p>
            <p className="text-muted-foreground mt-2 flex items-center justify-center gap-1">
              <Clock className="h-4 w-4" />
              {currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        )}

        {state === "error" && (
          <div className="text-center py-12">
            <div className="w-20 h-20 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto mb-4">
              <XCircle className="h-12 w-12 text-rose-500" />
            </div>
            <p className="text-xl font-bold text-rose-600 dark:text-rose-400">{message}</p>
            <p className="text-sm text-muted-foreground mt-2">Returning to home screen...</p>
          </div>
        )}
      </div>
    </div>
  )
}
