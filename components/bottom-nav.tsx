"use client"

import Link from "next/link"
import { Home, Clock, BarChart3, Settings, Phone, Palmtree, DollarSign, Users, Trophy } from "lucide-react"
import { cn } from "@/lib/utils"
import { Logo } from "@/components/logo"
import { useAuth } from "@/contexts/auth-context"

interface BottomNavProps {
  currentPath: string
}

const mobileNavItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/history", icon: Clock, label: "History" },
  { href: "/rewards", icon: Trophy, label: "Rewards" },
  { href: "/reports", icon: BarChart3, label: "Reports" },
  { href: "/settings", icon: Settings, label: "Settings" },
]

const mobileNavItemsAdmin = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/history", icon: Clock, label: "History" },
  { href: "/admin", icon: Users, label: "Team" },
  { href: "/rewards", icon: Trophy, label: "Rewards" },
  { href: "/settings", icon: Settings, label: "Settings" },
]

const desktopNavItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/history", icon: Clock, label: "History" },
  { href: "/callouts", icon: Phone, label: "Callouts" },
  { href: "/reports", icon: BarChart3, label: "Reports" },
  { href: "/rewards", icon: Trophy, label: "Rewards" },
  { href: "/leave", icon: Palmtree, label: "Leave / PTO" },
  { href: "/payroll", icon: DollarSign, label: "Payroll" },
  { href: "/settings", icon: Settings, label: "Settings" },
]

const desktopNavItemsAdmin = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/history", icon: Clock, label: "History" },
  { href: "/callouts", icon: Phone, label: "Callouts" },
  { href: "/reports", icon: BarChart3, label: "Reports" },
  { href: "/rewards", icon: Trophy, label: "Rewards" },
  { href: "/admin", icon: Users, label: "Team" },
  { href: "/leave", icon: Palmtree, label: "Leave / PTO" },
  { href: "/payroll", icon: DollarSign, label: "Payroll" },
  { href: "/settings", icon: Settings, label: "Settings" },
]

export function BottomNav({ currentPath }: BottomNavProps) {
  const { isAdmin } = useAuth()
  const mobileItems = isAdmin ? mobileNavItemsAdmin : mobileNavItems
  const desktopItems = isAdmin ? desktopNavItemsAdmin : desktopNavItems

  return (
    <>
      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t safe-area-pb lg:hidden">
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
          {mobileItems.map((item) => {
            const isActive = currentPath === item.href
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 h-full relative py-2",
                  "transition-all duration-200",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {isActive && (
                  <div className="absolute inset-x-3 top-0 h-[2px] bg-primary rounded-full" />
                )}
                <div className="flex flex-col items-center gap-1">
                  <Icon className={cn("h-5 w-5", isActive && "text-primary")} />
                  <span className={cn("text-[10px] font-medium tracking-wide", isActive && "text-primary")}>
                    {item.label}
                  </span>
                </div>
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
          {desktopItems.map((item) => {
            const isActive = currentPath === item.href
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 relative",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-full" />
                )}
                <Icon className={cn("h-5 w-5", isActive && "text-primary")} />
                <span className={cn("font-medium flex-1", isActive && "text-primary")}>{item.label}</span>
              </Link>
            )
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t">
          <div className="text-xs text-muted-foreground px-3">
            <span>v3.0</span>
          </div>
        </div>
      </nav>
    </>
  )
}
