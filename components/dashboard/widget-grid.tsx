"use client"

import { useState, useCallback, ReactNode } from "react"
import { motion, Reorder, AnimatePresence, useDragControls } from "framer-motion"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { GripVertical, X, Settings, Plus, ChevronRight } from "lucide-react"
import { staggerContainer, staggerChild } from "@/lib/animations"

// Widget configuration type
export interface WidgetConfig {
  id: string
  type: string
  title: string
  icon?: ReactNode
  size?: "sm" | "md" | "lg" | "full"
  removable?: boolean
  visible?: boolean
}

interface WidgetGridProps {
  widgets: WidgetConfig[]
  onReorder?: (newOrder: WidgetConfig[]) => void
  onRemove?: (widgetId: string) => void
  onAdd?: () => void
  renderWidget: (widget: WidgetConfig) => ReactNode
  editable?: boolean
  className?: string
}

export function WidgetGrid({
  widgets,
  onReorder,
  onRemove,
  onAdd,
  renderWidget,
  editable = false,
  className,
}: WidgetGridProps) {
  const [isEditing, setIsEditing] = useState(false)
  const visibleWidgets = widgets.filter((w) => w.visible !== false)

  const handleReorder = useCallback(
    (newOrder: WidgetConfig[]) => {
      onReorder?.(newOrder)
    },
    [onReorder]
  )

  const getSizeClasses = (size: WidgetConfig["size"]) => {
    switch (size) {
      case "sm":
        return "col-span-1"
      case "md":
        return "col-span-1 md:col-span-2"
      case "lg":
        return "col-span-1 md:col-span-2 lg:col-span-3"
      case "full":
        return "col-span-full"
      default:
        return "col-span-1"
    }
  }

  if (editable && isEditing) {
    return (
      <div className={cn("space-y-4", className)}>
        {/* Edit mode header */}
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">
            Drag to reorder widgets
          </p>
          <div className="flex items-center gap-2">
            {onAdd && (
              <Button variant="outline" size="sm" onClick={onAdd}>
                <Plus className="h-4 w-4 mr-1" />
                Add Widget
              </Button>
            )}
            <Button variant="default" size="sm" onClick={() => setIsEditing(false)}>
              Done
            </Button>
          </div>
        </div>

        {/* Reorderable list */}
        <Reorder.Group
          axis="y"
          values={visibleWidgets}
          onReorder={handleReorder}
          className="space-y-3"
        >
          <AnimatePresence>
            {visibleWidgets.map((widget) => (
              <ReorderableWidget
                key={widget.id}
                widget={widget}
                onRemove={onRemove}
                renderWidget={renderWidget}
              />
            ))}
          </AnimatePresence>
        </Reorder.Group>
      </div>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header with edit button */}
      {editable && (
        <div className="flex items-center justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="text-muted-foreground hover:text-foreground"
          >
            <Settings className="h-4 w-4 mr-1" />
            Customize
          </Button>
        </div>
      )}

      {/* Static grid */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {visibleWidgets.map((widget) => (
          <motion.div
            key={widget.id}
            variants={staggerChild}
            className={getSizeClasses(widget.size)}
          >
            {renderWidget(widget)}
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}

// Reorderable widget item
function ReorderableWidget({
  widget,
  onRemove,
  renderWidget,
}: {
  widget: WidgetConfig
  onRemove?: (id: string) => void
  renderWidget: (widget: WidgetConfig) => ReactNode
}) {
  const dragControls = useDragControls()

  return (
    <Reorder.Item
      value={widget}
      dragListener={false}
      dragControls={dragControls}
      className="relative"
    >
      <div className="relative">
        <Card className="border-2 border-dashed border-primary/20 bg-card/50">
          <div className="absolute left-0 top-0 bottom-0 w-10 flex items-center justify-center cursor-grab active:cursor-grabbing z-10"
            onPointerDown={(e) => dragControls.start(e)}
          >
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </div>

          <div className="pl-10">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  {widget.icon}
                  {widget.title}
                </CardTitle>
                {widget.removable !== false && onRemove && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                    onClick={() => onRemove(widget.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="opacity-50 pointer-events-none">
              {renderWidget(widget)}
            </CardContent>
          </div>
        </Card>
      </div>
    </Reorder.Item>
  )
}

// Pre-built widget wrapper component
interface WidgetWrapperProps {
  title: string
  icon?: ReactNode
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
  children: ReactNode
  className?: string
  noPadding?: boolean
}

export function Widget({
  title,
  icon,
  action,
  children,
  className,
  noPadding = false,
}: WidgetWrapperProps) {
  return (
    <div>
      <Card className={cn("border shadow-sm overflow-hidden", className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              {icon}
              {title}
            </CardTitle>
            {action && (
              action.href ? (
                <a
                  href={action.href}
                  className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                >
                  {action.label}
                  <ChevronRight className="h-4 w-4" />
                </a>
              ) : (
                <button
                  onClick={action.onClick}
                  className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                >
                  {action.label}
                  <ChevronRight className="h-4 w-4" />
                </button>
              )
            )}
          </div>
        </CardHeader>
        <CardContent className={noPadding ? "p-0" : undefined}>
          {children}
        </CardContent>
      </Card>
    </div>
  )
}

// Stat widget for metrics
interface StatWidgetProps {
  icon: ReactNode
  iconColor: string
  label: string
  value: string | number
  subvalue?: string
  progress?: number
  progressColor?: string
  indicator?: ReactNode
  trend?: {
    value: number
    positive?: boolean
  }
}

export function StatWidget({
  icon,
  iconColor,
  label,
  value,
  subvalue,
  progress,
  progressColor = "bg-primary",
  indicator,
  trend,
}: StatWidgetProps) {
  return (
    <div>
      <Card className="border shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className={cn("p-2 rounded-lg", iconColor)}>
              {icon}
            </div>
            {indicator}
            {trend && (
              <div
                className={cn(
                  "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
                  trend.positive
                    ? "bg-emerald-500/10 text-emerald-600"
                    : "bg-rose-500/10 text-rose-600"
                )}
              >
                {trend.positive ? "+" : ""}{trend.value}%
              </div>
            )}
          </div>
          <p className="text-2xl font-bold tabular-nums">{value}</p>
          <p className="text-xs text-muted-foreground mt-1">{label}</p>
          {subvalue && (
            <p className="text-xs text-muted-foreground">{subvalue}</p>
          )}
          {progress !== undefined && (
            <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                className={cn("h-full rounded-full", progressColor)}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, progress)}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Activity list widget
interface ActivityItem {
  id: string
  icon: ReactNode
  iconColor: string
  title: string
  subtitle?: string
  timestamp: string
}

interface ActivityWidgetProps {
  items: ActivityItem[]
  maxItems?: number
  showAll?: boolean
  onShowAll?: () => void
}

export function ActivityWidget({
  items,
  maxItems = 5,
  showAll = false,
  onShowAll,
}: ActivityWidgetProps) {
  const displayedItems = showAll ? items : items.slice(0, maxItems)

  return (
    <div className="divide-y">
      <AnimatePresence>
        {displayedItems.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center gap-4 px-6 py-3 hover:bg-muted/30 transition-colors"
          >
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center",
                item.iconColor
              )}
            >
              {item.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{item.title}</p>
              {item.subtitle && (
                <p className="text-xs text-muted-foreground truncate">
                  {item.subtitle}
                </p>
              )}
            </div>
            <span className="text-sm text-muted-foreground tabular-nums">
              {item.timestamp}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>

      {!showAll && items.length > maxItems && onShowAll && (
        <button
          onClick={onShowAll}
          className="w-full px-6 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors flex items-center justify-center gap-1"
        >
          Show {items.length - maxItems} more
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
