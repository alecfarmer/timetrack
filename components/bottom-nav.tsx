"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Home, Clock, BarChart3, Settings, Phone } from "lucide-react"
import { cn } from "@/lib/utils"

interface BottomNavProps {
  currentPath: string
}

const navItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/history", icon: Clock, label: "History" },
  { href: "/callouts", icon: Phone, label: "Callouts" },
  { href: "/reports", icon: BarChart3, label: "Reports" },
  { href: "/settings", icon: Settings, label: "Settings" },
]

export function BottomNav({ currentPath }: BottomNavProps) {
  return (
    <>
      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t safe-area-pb lg:hidden">
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
          {navItems.map((item) => {
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
                    className="absolute inset-x-3 top-1 h-1 bg-primary rounded-full"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className="flex flex-col items-center gap-1"
                >
                  <Icon className={cn("h-5 w-5", isActive && "text-primary")} />
                  <span className={cn(
                    "text-[10px] font-medium",
                    isActive && "text-primary"
                  )}>
                    {item.label}
                  </span>
                </motion.div>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Desktop Side Nav */}
      <nav className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 border-r bg-card z-40 flex-col">
        <div className="p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-lg">
              <Home className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold">OnSite</h1>
              <p className="text-xs text-muted-foreground">Time & Attendance</p>
            </div>
          </div>
        </div>

        <div className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = currentPath === item.href
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeTabDesktop"
                    className="absolute inset-0 bg-primary rounded-xl -z-10"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </Link>
            )
          })}
        </div>

        <div className="p-4 border-t">
          <p className="text-xs text-muted-foreground text-center">
            Version 1.0.0
          </p>
        </div>
      </nav>
    </>
  )
}
