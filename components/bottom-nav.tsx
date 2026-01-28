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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t safe-area-pb">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = currentPath === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full relative",
                "transition-colors duration-200",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-x-2 top-0 h-0.5 bg-primary rounded-full"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              <motion.div
                whileTap={{ scale: 0.9 }}
                className="flex flex-col items-center gap-1"
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </motion.div>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
