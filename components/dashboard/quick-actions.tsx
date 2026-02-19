"use client"

import { ReactNode } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { OrgLink } from "@/components/org-link"
import { Button } from "@/components/ui/button"
import {
  Coffee,
  Play,
  Calendar,
  AlertCircle,
  MessageSquare,
  FileText,
  Settings,
  Clock,
  Palmtree,
} from "lucide-react"
import { staggerContainer, staggerChild, buttonPress } from "@/lib/animations"

interface QuickAction {
  id: string
  label: string
  icon: ReactNode
  onClick?: () => void
  href?: string
  variant?: "default" | "primary" | "success" | "warning" | "danger"
  disabled?: boolean
  badge?: string | number
}

interface QuickActionsBarProps {
  actions: QuickAction[]
  layout?: "horizontal" | "grid"
  size?: "sm" | "md" | "lg"
  className?: string
}

export function QuickActionsBar({
  actions,
  layout = "horizontal",
  size = "md",
  className,
}: QuickActionsBarProps) {
  const sizeClasses = {
    sm: "h-10 px-3 text-xs gap-1.5",
    md: "h-12 px-4 text-sm gap-2",
    lg: "h-14 px-5 text-sm gap-2.5",
  }

  const iconSizes = {
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  }

  const getVariantClasses = (variant: QuickAction["variant"]) => {
    switch (variant) {
      case "primary":
        return "bg-primary text-primary-foreground hover:bg-primary/90"
      case "success":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
      case "warning":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/20"
      case "danger":
        return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 hover:bg-rose-500/20"
      default:
        return "bg-muted hover:bg-muted/80"
    }
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className={cn(
        layout === "horizontal"
          ? "flex items-center gap-2 overflow-x-auto no-scrollbar pb-1"
          : "grid grid-cols-2 sm:grid-cols-4 gap-2",
        className
      )}
    >
      {actions.map((action) => {
        const content = (
          <motion.button
            key={action.id}
            variants={staggerChild}
            whileTap={buttonPress}
            onClick={action.onClick}
            disabled={action.disabled}
            className={cn(
              "relative flex items-center justify-center rounded-xl font-medium transition-colors",
              "border",
              sizeClasses[size],
              getVariantClasses(action.variant),
              action.disabled && "opacity-50 cursor-not-allowed",
              layout === "horizontal" ? "flex-shrink-0" : "w-full"
            )}
          >
            <span className={iconSizes[size]}>{action.icon}</span>
            <span>{action.label}</span>
            {action.badge !== undefined && (
              <span className="absolute -top-1 -right-1 min-w-5 h-5 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium px-1.5">
                {action.badge}
              </span>
            )}
          </motion.button>
        )

        if (action.href) {
          return (
            <OrgLink key={action.id} href={action.href} className={layout === "grid" ? "" : "flex-shrink-0"}>
              {content}
            </OrgLink>
          )
        }

        return content
      })}
    </motion.div>
  )
}

// Pre-configured break actions
interface BreakActionsProps {
  isOnBreak: boolean
  onStartBreak: () => void
  onEndBreak: () => void
  disabled?: boolean
  className?: string
}

export function BreakActions({
  isOnBreak,
  onStartBreak,
  onEndBreak,
  disabled,
  className,
}: BreakActionsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      {isOnBreak ? (
        <Button
          variant="outline"
          className="w-full gap-2 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10"
          onClick={onEndBreak}
          disabled={disabled}
        >
          <Play className="h-4 w-4" />
          End Break
        </Button>
      ) : (
        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={onStartBreak}
          disabled={disabled}
        >
          <Coffee className="h-4 w-4" />
          Start Break
        </Button>
      )}
    </motion.div>
  )
}

// Default quick actions for employee dashboard
export function getDefaultQuickActions(options?: {
  isClockedIn?: boolean
  onStartBreak?: () => void
  onEndBreak?: () => void
  isOnBreak?: boolean
  pendingRequests?: number
}): QuickAction[] {
  const {
    isClockedIn = false,
    onStartBreak,
    onEndBreak,
    isOnBreak = false,
    pendingRequests = 0,
  } = options || {}

  const actions: QuickAction[] = []

  // Break action (only when clocked in)
  if (isClockedIn) {
    if (isOnBreak) {
      actions.push({
        id: "end-break",
        label: "End Break",
        icon: <Play className="h-4 w-4" />,
        onClick: onEndBreak,
        variant: "success",
      })
    } else {
      actions.push({
        id: "start-break",
        label: "Break",
        icon: <Coffee className="h-4 w-4" />,
        onClick: onStartBreak,
        variant: "warning",
      })
    }
  }

  // Time off request
  actions.push({
    id: "request-time-off",
    label: "Time Off",
    icon: <Palmtree className="h-4 w-4" />,
    href: "/leave",
    badge: pendingRequests > 0 ? pendingRequests : undefined,
  })

  // View schedule
  actions.push({
    id: "view-schedule",
    label: "Schedule",
    icon: <Calendar className="h-4 w-4" />,
    href: "/schedule",
  })

  // View history
  actions.push({
    id: "view-history",
    label: "History",
    icon: <Clock className="h-4 w-4" />,
    href: "/history",
  })

  return actions
}

// Floating action button for mobile
interface FloatingActionButtonProps {
  icon: ReactNode
  onClick?: () => void
  href?: string
  variant?: "default" | "primary"
  label?: string
  className?: string
}

export function FloatingActionButton({
  icon,
  onClick,
  href,
  variant = "primary",
  label,
  className,
}: FloatingActionButtonProps) {
  const baseClasses = cn(
    "fixed bottom-24 right-4 z-50",
    "flex items-center justify-center",
    "rounded-full shadow-lg",
    "transition-all duration-200",
    variant === "primary"
      ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/25"
      : "bg-card text-foreground border hover:bg-muted",
    label ? "px-5 h-14 gap-2" : "w-14 h-14",
    className
  )

  const content = (
    <>
      {icon}
      {label && <span className="font-medium">{label}</span>}
    </>
  )

  if (href) {
    return (
      <motion.a
        href={href}
        className={baseClasses}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {content}
      </motion.a>
    )
  }

  return (
    <motion.button
      onClick={onClick}
      className={baseClasses}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {content}
    </motion.button>
  )
}

// Quick action card for larger displays
interface QuickActionCardProps {
  icon: ReactNode
  iconColor: string
  title: string
  description: string
  onClick?: () => void
  href?: string
  badge?: string | number
}

export function QuickActionCard({
  icon,
  iconColor,
  title,
  description,
  onClick,
  href,
  badge,
}: QuickActionCardProps) {
  const content = (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className="relative p-4 rounded-xl border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
    >
      <div className="flex items-start gap-3">
        <div className={cn("p-2.5 rounded-lg", iconColor)}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      {badge !== undefined && (
        <span className="absolute top-3 right-3 min-w-5 h-5 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium px-1.5">
          {badge}
        </span>
      )}
    </motion.div>
  )

  if (href) {
    return <OrgLink href={href}>{content}</OrgLink>
  }

  return <button onClick={onClick} className="w-full text-left">{content}</button>
}
