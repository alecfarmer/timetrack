"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Home, Clock, BarChart3, Settings, Phone, Keyboard, Palmtree, DollarSign } from "lucide-react"
import { cn } from "@/lib/utils"
import { Logo } from "@/components/logo"

interface BottomNavProps {
  currentPath: string
}

const mobileNavItems = [
  { href: "/", icon: Home, label: "Home", shortcut: "1" },
  { href: "/history", icon: Clock, label: "History", shortcut: "2" },
  { href: "/callouts", icon: Phone, label: "Callouts", shortcut: "3" },
  { href: "/reports", icon: BarChart3, label: "Reports", shortcut: "4" },
  { href: "/settings", icon: Settings, label: "Settings", shortcut: "5" },
]

const desktopNavItems = [
  { href: "/", icon: Home, label: "Home", shortcut: "1" },
  { href: "/history", icon: Clock, label: "History", shortcut: "2" },
  { href: "/callouts", icon: Phone, label: "Callouts", shortcut: "3" },
  { href: "/reports", icon: BarChart3, label: "Reports", shortcut: "4" },
  { href: "/leave", icon: Palmtree, label: "Leave / PTO", shortcut: "6" },
  { href: "/payroll", icon: DollarSign, label: "Payroll", shortcut: "7" },
  { href: "/settings", icon: Settings, label: "Settings", shortcut: "5" },
]

export function BottomNav({ currentPath }: BottomNavProps) {
  return (
    <>
      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t safe-area-pb lg:hidden">
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
          {mobileNavItems.map((item) => {
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
                  <motion.div
                    layoutId="activeTabMobile"
                    className="absolute inset-x-3 top-0 h-0.5 bg-gradient-primary rounded-full"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className="flex flex-col items-center gap-1"
                >
                  <Icon className={cn("h-5 w-5", isActive && "text-primary")} />
                  <span className={cn("text-[10px] font-medium tracking-wide", isActive && "text-primary")}>
                    {item.label}
                  </span>
                </motion.div>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Desktop Side Nav - Linear/Notion inspired */}
      <nav className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 border-r bg-card/50 glass-strong z-40 flex-col">
        {/* Logo */}
        <div className="p-6">
          <Logo size="md" />
        </div>

        {/* Nav Items */}
        <div className="flex-1 px-3 space-y-0.5">
          <div className="divider-text px-3 mb-2">Navigation</div>
          {desktopNavItems.map((item) => {
            const isActive = currentPath === item.href
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 relative",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabDesktop"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-full"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
                <Icon className={cn("h-5 w-5", isActive && "text-primary")} />
                <span className={cn("font-medium flex-1", isActive && "text-primary")}>{item.label}</span>
                <kbd
                  className={cn(
                    "hidden group-hover:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono rounded-md border bg-muted",
                    isActive && "bg-primary/10 border-primary/20 text-primary"
                  )}
                >
                  {item.shortcut}
                </kbd>
              </Link>
            )
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>v2.0.0</span>
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
