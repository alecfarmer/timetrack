"use client"

import Link from "next/link"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Home,
  Clock,
  CalendarDays,
  Trophy,
  Settings,
  BarChart3,
  Palmtree,
  Keyboard,
  LogIn,
  LogOut as LogOutIcon,
  ShieldCheck,
  Menu,
  X,
  Bell,
  Megaphone,
  DollarSign,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/contexts/auth-context"
import { useRealtime } from "@/contexts/realtime-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

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

const allMobileMenuItems = [
  { href: "/dashboard", icon: Home, label: "Home" },
  { href: "/schedule", icon: CalendarDays, label: "Schedule" },
  { href: "/history", icon: Clock, label: "History" },
  { href: "/rewards", icon: Trophy, label: "Rewards" },
  { href: "/leave", icon: Palmtree, label: "Leave & PTO" },
  { href: "/reports", icon: BarChart3, label: "Reports" },
  { href: "/callouts", icon: Megaphone, label: "Callouts" },
  { href: "/payroll", icon: DollarSign, label: "Payroll" },
  { href: "/notifications", icon: Bell, label: "Notifications" },
  { href: "/settings", icon: Settings, label: "Settings" },
]

function getPageTitle(pathname: string): string {
  const titleMap: Record<string, string> = {
    "/dashboard": "Home",
    "/schedule": "Schedule",
    "/history": "History",
    "/rewards": "Rewards",
    "/leave": "Leave & PTO",
    "/reports": "Reports",
    "/callouts": "Callouts",
    "/payroll": "Payroll",
    "/notifications": "Notifications",
    "/settings": "Settings",
  }
  return titleMap[pathname] || "OnSite"
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
    const interval = setInterval(update, 60000)
    return () => clearInterval(interval)
  }, [sessionStart])

  return <span className="text-[9px] font-mono font-bold">{elapsed}</span>
}

export function EmployeeNav({ currentPath }: EmployeeNavProps) {
  const { isAdmin, signOut } = useAuth()
  const router = useRouter()
  const { isClockedIn, clockInTime, unclaimedRewards } = useRealtime()
  const sessionStart = clockInTime?.toISOString() ?? null
  const [menuOpen, setMenuOpen] = useState(false)
  const pageTitle = getPageTitle(currentPath)

  const handleSignOut = async () => {
    setMenuOpen(false)
    await signOut()
    router.push("/login")
  }

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return currentPath === "/dashboard"
    }
    return currentPath.startsWith(href)
  }

  return (
    <>
      {/* Mobile Top Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-xl border-b lg:hidden safe-area-pt">
        <div className="flex items-center gap-3 px-4 h-14">
          <button
            onClick={() => setMenuOpen(true)}
            className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-bold flex-1">{pageTitle}</h1>
          <ThemeToggle />
        </div>
      </header>

      {/* Mobile Slide-in Menu Drawer */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm lg:hidden"
              onClick={() => setMenuOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed top-0 left-0 bottom-0 w-72 z-[61] bg-card border-r overflow-y-auto lg:hidden"
            >
              <div className="flex items-center justify-between p-4 border-b">
                <Logo size="sm" />
                <Button variant="ghost" size="icon" onClick={() => setMenuOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <nav className="p-3 space-y-0.5">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 py-2">
                  Navigation
                </div>
                {allMobileMenuItems.map((item) => {
                  const active = isActive(item.href)
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
                        active
                          ? "bg-primary/10 text-primary font-semibold"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-sm">{item.label}</span>
                    </Link>
                  )
                })}
              </nav>

              <div className="p-3 border-t mt-2 space-y-0.5">
                {isAdmin && (
                  <Link
                    href="/admin"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    <ShieldCheck className="h-5 w-5" />
                    <span>Admin Portal</span>
                  </Link>
                )}
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-destructive hover:bg-destructive/10 transition-colors w-full"
                >
                  <LogOutIcon className="h-5 w-5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

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
            const showBadge = item.href === "/rewards" && unclaimedRewards > 0
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
                <div className="relative">
                  <Icon className={cn("h-5 w-5", active ? "fill-primary/20" : "")} strokeWidth={active ? 2.5 : 1.8} />
                  {showBadge && (
                    <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 bg-amber-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                      {unclaimedRewards > 9 ? "9+" : unclaimedRewards}
                    </span>
                  )}
                </div>
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

        {/* Admin link, sign out & footer */}
        <div className="p-3 border-t space-y-1">
          {isAdmin && (
            <Link
              href="/admin"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <ShieldCheck className="h-5 w-5" />
              <span className="font-medium">Admin Portal</span>
            </Link>
          )}
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-destructive hover:bg-destructive/10 transition-colors w-full"
          >
            <LogOutIcon className="h-5 w-5" />
            <span className="font-medium">Sign Out</span>
          </button>
          <div className="flex items-center justify-between text-xs text-muted-foreground px-3 pt-1">
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
