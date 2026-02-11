"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Clock,
  FileCheck,
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
  ChevronDown,
  LogOut,
  Building2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Logo } from "@/components/logo"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { useState } from "react"

interface NavSection {
  title: string
  items: NavItem[]
}

interface NavItem {
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  badge?: number
}

const navSections: NavSection[] = [
  {
    title: "Dashboard",
    items: [
      { href: "/admin", icon: LayoutDashboard, label: "Overview" },
    ],
  },
  {
    title: "Team",
    items: [
      { href: "/admin/team", icon: Users, label: "Members" },
    ],
  },
  {
    title: "Time Management",
    items: [
      { href: "/admin/entries", icon: Clock, label: "Edit Entries" },
      { href: "/admin/timesheets", icon: FileCheck, label: "Timesheets" },
      { href: "/admin/bulk-edit", icon: FileText, label: "Corrections" },
    ],
  },
  {
    title: "Scheduling",
    items: [
      { href: "/admin/shifts", icon: Calendar, label: "Shifts" },
    ],
  },
  {
    title: "Insights",
    items: [
      { href: "/admin/analytics", icon: BarChart3, label: "Analytics" },
      { href: "/admin/wellbeing", icon: Heart, label: "Well-being" },
    ],
  },
  {
    title: "Settings",
    items: [
      { href: "/admin/settings", icon: Settings, label: "All Settings" },
      { href: "/admin/features", icon: Shield, label: "Features" },
      { href: "/admin/jurisdictions", icon: MapPin, label: "Policies" },
      { href: "/admin/leave-policy", icon: Palmtree, label: "Leave & PTO" },
      { href: "/admin/payroll-config", icon: DollarSign, label: "Payroll" },
      { href: "/admin/alerts", icon: Bell, label: "Alerts" },
    ],
  },
  {
    title: "System",
    items: [
      { href: "/admin/audit", icon: FileText, label: "Audit Log" },
    ],
  },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const { org, signOut } = useAuth()
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())

  const toggleSection = (title: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev)
      if (next.has(title)) {
        next.delete(title)
      } else {
        next.add(title)
      }
      return next
    })
  }

  const isActive = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin"
    }
    return pathname.startsWith(href)
  }

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-72 border-r bg-card flex-col z-40">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{org?.orgName || "Admin Portal"}</p>
            <p className="text-xs text-muted-foreground">Administration</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {navSections.map((section) => {
          const isCollapsed = collapsedSections.has(section.title)

          return (
            <div key={section.title} className="mb-2">
              <button
                onClick={() => toggleSection(section.title)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
              >
                {section.title}
                <ChevronDown
                  className={cn(
                    "h-3 w-3 transition-transform",
                    isCollapsed && "-rotate-90"
                  )}
                />
              </button>

              {!isCollapsed && (
                <div className="mt-1 space-y-0.5">
                  {section.items.map((item) => {
                    const Icon = item.icon
                    const active = isActive(item.href)

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 relative",
                          active
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        {active && (
                          <motion.div
                            layoutId="adminActiveTab"
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-full"
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          />
                        )}
                        <Icon className={cn("h-4 w-4", active && "text-primary")} />
                        <span className={cn("text-sm font-medium", active && "text-primary")}>
                          {item.label}
                        </span>
                        {item.badge !== undefined && item.badge > 0 && (
                          <span className="ml-auto text-xs bg-destructive text-destructive-foreground px-1.5 py-0.5 rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t space-y-3">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
        >
          <Clock className="h-4 w-4" />
          <span>Employee View</span>
        </Link>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
          onClick={() => signOut()}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
        <div className="px-3 text-xs text-muted-foreground">
          v2.0.0 &middot; Admin Portal
        </div>
      </div>
    </aside>
  )
}
