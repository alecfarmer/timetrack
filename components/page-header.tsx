"use client"

import { cn } from "@/lib/utils"

interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  className?: string
}

export function PageHeader({ title, subtitle, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b lg:border-0", className)}>
      <div className="flex items-center justify-between px-4 lg:px-8 py-4 lg:py-6">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold tracking-tight">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}
