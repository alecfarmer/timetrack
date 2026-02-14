"use client"

import { cn } from "@/lib/utils"
import { Lock } from "lucide-react"

interface BrowserFrameProps {
  url?: string
  children: React.ReactNode
  className?: string
}

export function BrowserFrame({
  url = "app.usekpr.com",
  children,
  className,
}: BrowserFrameProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card shadow-2xl shadow-black/10 overflow-hidden",
        className
      )}
    >
      {/* Browser chrome */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-muted/30">
        {/* Traffic lights */}
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400/80" />
          <div className="w-3 h-3 rounded-full bg-amber-400/80" />
          <div className="w-3 h-3 rounded-full bg-green-400/80" />
        </div>

        {/* Address bar */}
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-muted/50 max-w-xs w-full justify-center">
            <Lock className="w-2.5 h-2.5 text-muted-foreground/40 flex-shrink-0" />
            <span className="text-[11px] text-muted-foreground truncate">{url}</span>
          </div>
        </div>

        {/* Spacer */}
        <div className="w-[52px]" />
      </div>

      {/* Browser content */}
      <div className="bg-gray-950 overflow-hidden">{children}</div>
    </div>
  )
}
