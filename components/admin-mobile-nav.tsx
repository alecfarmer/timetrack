"use client"

import Link from "next/link"
import { useState } from "react"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard,
  Users,
  FileCheck,
  MoreHorizontal,
  Clock,
  Calendar,
  BarChart3,
  Heart,
  Settings,
  Shield,
  Bell,
  DollarSign,
  MapPin,
  Palmtree,
  FileText,
  X,
  Menu,
  ArrowLeft,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface QuickNavItem {
  href: string
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  label: string
}

const quickNavItems: QuickNavItem[] = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/team", icon: Users, label: "Team" },
  { href: "/admin/timesheets", icon: FileCheck, label: "Timesheets" },
]

const moreNavItems: QuickNavItem[] = [
  { href: "/admin/entries", icon: Clock, label: "Edit Entries" },
  { href: "/admin/bulk-edit", icon: FileText, label: "Corrections" },
  { href: "/admin/shifts", icon: Calendar, label: "Shifts" },
  { href: "/admin/analytics", icon: BarChart3, label: "Analytics" },
  { href: "/admin/wellbeing", icon: Heart, label: "Well-being" },
  { href: "/admin/settings", icon: Settings, label: "Settings" },
  { href: "/admin/features", icon: Shield, label: "Features" },
  { href: "/admin/jurisdictions", icon: MapPin, label: "Policies" },
  { href: "/admin/leave-policy", icon: Palmtree, label: "Leave & PTO" },
  { href: "/admin/payroll-config", icon: DollarSign, label: "Payroll" },
  { href: "/admin/alerts", icon: Bell, label: "Alerts" },
  { href: "/admin/audit", icon: FileText, label: "Audit Log" },
]

// Map pathnames to page titles
function getPageTitle(pathname: string): string {
  const titleMap: Record<string, string> = {
    "/admin": "Dashboard",
    "/admin/team": "Team",
    "/admin/timesheets": "Timesheets",
    "/admin/entries": "Edit Entries",
    "/admin/bulk-edit": "Corrections",
    "/admin/shifts": "Shifts",
    "/admin/analytics": "Analytics",
    "/admin/wellbeing": "Well-being",
    "/admin/settings": "Settings",
    "/admin/features": "Features",
    "/admin/jurisdictions": "Policies",
    "/admin/leave-policy": "Leave & PTO",
    "/admin/payroll-config": "Payroll",
    "/admin/alerts": "Alerts",
    "/admin/audit": "Audit Log",
  }
  return titleMap[pathname] || "Admin"
}

export function AdminMobileNav() {
  const pathname = usePathname()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const pageTitle = getPageTitle(pathname)

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin"
    return pathname.startsWith(href)
  }

  const isMoreActive = moreNavItems.some(item => isActive(item.href))

  return (
    <>
      {/* Top Header Bar */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-xl border-b lg:hidden">
        <div className="flex items-center gap-3 px-4 h-14">
          {pathname !== "/admin" && (
            <Link href="/admin">
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
          )}
          <h1 className="text-lg font-bold flex-1">{pageTitle}</h1>
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
              Employee
            </Button>
          </Link>
        </div>
      </header>

      {/* Bottom Quick-Access Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t safe-area-pb lg:hidden">
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
          {quickNavItems.map((item) => {
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
                    layoutId="adminActiveTab"
                    className="absolute inset-x-4 top-0 h-[3px] bg-primary rounded-full"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
                <Icon className="h-5 w-5" />
                <span className={cn("text-[10px] mt-0.5", active ? "font-bold" : "font-medium")}>{item.label}</span>
              </Link>
            )
          })}

          {/* More button */}
          <button
            onClick={() => setDrawerOpen(true)}
            className={cn(
              "flex flex-col items-center justify-center flex-1 h-full relative py-2",
              "transition-all duration-200",
              isMoreActive ? "text-primary" : "text-muted-foreground"
            )}
          >
            {isMoreActive && (
              <motion.div
                layoutId="adminActiveTab"
                className="absolute inset-x-4 top-0 h-[3px] bg-primary rounded-full"
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
            <MoreHorizontal className="h-5 w-5" />
            <span className={cn("text-[10px] mt-0.5", isMoreActive ? "font-bold" : "font-medium")}>More</span>
          </button>
        </div>
      </nav>

      {/* Slide-up Drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm lg:hidden"
              onClick={() => setDrawerOpen(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[61] bg-card rounded-t-3xl border-t max-h-[70vh] overflow-y-auto safe-area-pb lg:hidden"
            >
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-bold">More</h2>
                <Button variant="ghost" size="icon" onClick={() => setDrawerOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-2 p-4">
                {moreNavItems.map((item) => {
                  const active = isActive(item.href)
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setDrawerOpen(false)}
                      className={cn(
                        "flex flex-col items-center gap-2 p-4 rounded-2xl transition-all",
                        active
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted"
                      )}
                    >
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center",
                        active ? "bg-primary/20" : "bg-muted"
                      )}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className={cn("text-xs text-center", active && "font-semibold")}>{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
