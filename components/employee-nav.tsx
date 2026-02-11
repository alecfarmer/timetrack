"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Home, Clock, CalendarDays, Trophy, Settings, BarChart3, Palmtree, Keyboard, LogIn, LogOut as LogOutIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Logo } from "@/components/logo"
import { useAuth } from "@/contexts/auth-context"

interface EmployeeNavProps {
  currentPath: string
}

const mobileNavItems = [
  { href: "/dashboard", icon: Home, label: "Home" },
  { href: "/schedule", icon: CalendarDays, label: "Schedule" },
  // FAB goes in the middle (index 2)
  { href: "/history", icon: Clock, label: "History" },
  { href: "/rewards", icon: Trophy, label: "Rewards" },
]

const desktopNavItems = [
  { href: "/dashboard", icon: Home, label: "Home", shortcut: "1" },
  { href: "/schedule", icon: CalendarDays, label: "Schedule", shortcut: "2" },
  { href: "/history", icon: Clock, label: "History", shortcut: "3" },
  { href: "/leave", icon: Palmtree, label: "Leave", shortcut: "4" },
  { href: "/reports", icon: BarChart3, label: "Reports", shortcut: "5" },
  { href: "/rewards", icon: Trophy, label: "Rewards", shortcut: "6" },
  { href: "/settings", icon: Settings, label: "Settings", shortcut: "7" },
]

// Mini hook to check clock status from API
function useQuickClockStatus() {
  const [isClockedIn, setIsClockedIn] = useState(false)
  const [sessionStart, setSessionStart] = useState<string | null>(null)

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch("/api/status")
        if (res.ok) {
          const data = await res.json()
          setIsClockedIn(data.isClockedIn ?? false)
          setSessionStart(data.currentSessionStart ?? null)
        }
      } catch {
        // Silent fail
      }
    }
    check()
    const interval = setInterval(check, 30000) // Poll every 30s
    return () => clearInterval(interval)
  }, [])

  return { isClockedIn, sessionStart }
}

function MiniTimer({ sessionStart }: { sessionStart: string }) {
  const [elapsed, setElapsed] = useState("")

  useEffect(() => {
    const update = () => {
      const diff = Math.floor((Date.now() - new Date(sessionStart).getTime()) / 1000)
      const h = Math.floor(diff / 3600)
      const m = Math.floor((diff % 3600) / 60)
      setElapsed(`${h}:${m.toString().padStart(2, "0")}`)
    }
    update()
    const interval = setInterval(update, 60000) // Update every minute
    return () => clearInterval(interval)
  }, [sessionStart])

  return <span className="text-[9px] font-mono font-bold">{elapsed}</span>
}

export function EmployeeNav({ currentPath }: EmployeeNavProps) {
  const { isAdmin } = useAuth()
  const { isClockedIn, sessionStart } = useQuickClockStatus()

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return currentPath === "/dashboard"
    }
    return currentPath.startsWith(href)
  }

  return (
    <>
      {/* Mobile Bottom Nav with Center FAB */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t safe-area-pb lg:hidden">
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-1 relative">
          {/* First 2 items */}
          {mobileNavItems.slice(0, 2).map((item) => {
            const active = isActive(item.href)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 h-full relative py-2",
                  "transition-all duration-200",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                {active && (
                  <motion.div
                    layoutId="mobileActiveTab"
                    className="absolute inset-x-4 top-0 h-[3px] bg-primary rounded-full"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
                <Icon className={cn("h-5 w-5", active ? "fill-primary/20" : "")} strokeWidth={active ? 2.5 : 1.8} />
                <span className={cn("text-[10px] mt-0.5", active ? "font-bold" : "font-medium")}>{item.label}</span>
              </Link>
            )
          })}

          {/* Center FAB — Clock In/Out */}
          <div className="flex-1 flex items-center justify-center relative -mt-5">
            <Link href="/dashboard">
              <motion.div
                whileTap={{ scale: 0.9 }}
                className={cn(
                  "fab",
                  isClockedIn ? "fab-clocked-in" : "fab-clocked-out"
                )}
              >
                <div className="flex flex-col items-center justify-center text-white">
                  {isClockedIn ? (
                    <>
                      <LogOutIcon className="h-5 w-5" />
                      {sessionStart && <MiniTimer sessionStart={sessionStart} />}
                    </>
                  ) : (
                    <LogIn className="h-6 w-6" />
                  )}
                </div>
              </motion.div>
            </Link>
          </div>

          {/* Last 2 items */}
          {mobileNavItems.slice(2).map((item) => {
            const active = isActive(item.href)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 h-full relative py-2",
                  "transition-all duration-200",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                {active && (
                  <motion.div
                    layoutId="mobileActiveTab"
                    className="absolute inset-x-4 top-0 h-[3px] bg-primary rounded-full"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
                <Icon className={cn("h-5 w-5", active ? "fill-primary/20" : "")} strokeWidth={active ? 2.5 : 1.8} />
                <span className={cn("text-[10px] mt-0.5", active ? "font-bold" : "font-medium")}>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Desktop Side Nav */}
      <nav className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 border-r bg-card/80 backdrop-blur-xl z-40 flex-col">
        {/* Logo */}
        <div className="p-6">
          <Logo size="md" />
        </div>

        {/* Nav Items */}
        <div className="flex-1 px-3 space-y-0.5">
          <div className="divider-text px-3 mb-2">Navigation</div>
          {desktopNavItems.map((item) => {
            const active = isActive(item.href)
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 relative",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {active && (
                  <motion.div
                    layoutId="desktopActiveTab"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-full"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
                <Icon className={cn("h-5 w-5", active && "text-primary")} />
                <span className={cn("font-medium flex-1", active && "font-semibold text-primary")}>{item.label}</span>
                <kbd
                  className={cn(
                    "hidden group-hover:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono rounded-md border bg-muted",
                    active && "bg-primary/10 border-primary/20 text-primary"
                  )}
                >
                  {item.shortcut}
                </kbd>
              </Link>
            )
          })}
        </div>

        {/* Admin link & footer */}
        <div className="p-4 border-t space-y-2">
          {isAdmin && (
            <Link
              href="/admin"
              className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            >
              <Settings className="h-4 w-4" />
              <span>Admin Portal</span>
            </Link>
          )}
          <div className="flex items-center justify-between text-xs text-muted-foreground px-3">
            <span>v3.0</span>
            <div className="flex items-center gap-1">
              <Keyboard className="h-3 w-3" />
              <span>Shortcuts</span>
            </div>
          </div>
        </div>
      </nav>
    </>
  )
}
