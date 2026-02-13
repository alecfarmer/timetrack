"use client"

import Link from "next/link"
import { useState, useEffect, useRef } from "react"
import {
  Home,
  Clock,
  CalendarDays,
  Trophy,
  Settings,
  BarChart3,
  Palmtree,
  LogIn,
  LogOut as LogOutIcon,
  ShieldCheck,
  Menu,
  X,
  Bell,
  Megaphone,
  DollarSign,
  MessageSquare,
  CalendarClock,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/contexts/auth-context"
import { useRealtime } from "@/contexts/realtime-context"
import { useRouter } from "next/navigation"

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
  { href: "/dashboard", icon: Home, label: "Home" },
  { href: "/schedule", icon: CalendarDays, label: "Schedule" },
  { href: "/history", icon: Clock, label: "History" },
  { href: "/messages", icon: MessageSquare, label: "Messages" },
  { href: "/availability", icon: CalendarClock, label: "Availability" },
  { href: "/leave", icon: Palmtree, label: "Leave" },
  { href: "/reports", icon: BarChart3, label: "Reports" },
  { href: "/rewards", icon: Trophy, label: "Rewards" },
  { href: "/settings", icon: Settings, label: "Settings" },
]

const allMobileMenuItems = [
  { href: "/dashboard", icon: Home, label: "Home" },
  { href: "/schedule", icon: CalendarDays, label: "Schedule" },
  { href: "/history", icon: Clock, label: "History" },
  { href: "/messages", icon: MessageSquare, label: "Messages" },
  { href: "/availability", icon: CalendarClock, label: "Availability" },
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
    "/messages": "Messages",
    "/availability": "Availability",
    "/rewards": "Rewards",
    "/leave": "Leave & PTO",
    "/reports": "Reports",
    "/callouts": "Callouts",
    "/payroll": "Payroll",
    "/notifications": "Notifications",
    "/settings": "Settings",
  }
  return titleMap[pathname] || "KPR"
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
  const drawerRef = useRef<HTMLDivElement>(null)

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

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [menuOpen])

  return (
    <>
      {/* Mobile Top Header */}
      <header className="sticky top-0 z-50 bg-card border-b lg:hidden safe-area-pt">
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

      {/* Mobile Slide-in Menu Drawer — CSS transitions */}
      <div
        className={cn(
          "fixed inset-0 z-[60] bg-black/40 lg:hidden transition-opacity duration-200",
          menuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setMenuOpen(false)}
      />
      <div
        ref={drawerRef}
        className={cn(
          "fixed top-0 left-0 bottom-0 w-72 z-[61] bg-card border-r overflow-y-auto lg:hidden",
          "transition-transform duration-200 ease-out",
          menuOpen ? "translate-x-0" : "-translate-x-full"
        )}
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
      </div>

      {/* Mobile Bottom Nav with Center FAB */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t safe-area-pb lg:hidden">
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
                  <div className="absolute inset-x-4 top-0 h-[2px] bg-primary rounded-full" />
                )}
                <Icon className={cn("h-5 w-5", active ? "fill-primary/20" : "")} strokeWidth={active ? 2.5 : 1.8} />
                <span className={cn("text-[10px] mt-0.5", active ? "font-bold" : "font-medium")}>{item.label}</span>
              </Link>
            )
          })}

          {/* Center FAB — Clock In/Out */}
          <div className="flex-1 flex items-center justify-center relative -mt-5">
            <Link href="/dashboard">
              <div
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
              </div>
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
                  <div className="absolute inset-x-4 top-0 h-[2px] bg-primary rounded-full" />
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
      <nav className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 border-r bg-card z-40 flex-col">
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
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 relative",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {active && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-full" />
                )}
                <Icon className={cn("h-5 w-5", active && "text-primary")} />
                <span className={cn("font-medium flex-1", active && "font-semibold text-primary")}>{item.label}</span>
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
          </div>
        </div>
      </nav>
    </>
  )
}
