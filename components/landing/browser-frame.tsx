"use client"

import { cn } from "@/lib/utils"
import { Lock } from "lucide-react"

interface BrowserFrameProps {
  url?: string
  children: React.ReactNode
  className?: string
  live?: boolean
}

export function BrowserFrame({
  url = "app.kpr.com",
  children,
  className,
  live,
}: BrowserFrameProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-gray-900 shadow-2xl shadow-black/40 overflow-hidden",
        className
      )}
    >
      {/* Browser chrome */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/10 bg-gray-800/80">
        {/* Traffic lights */}
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400/90 hover:bg-red-400 transition-colors" />
          <div className="w-3 h-3 rounded-full bg-amber-400/90 hover:bg-amber-400 transition-colors" />
          <div className="w-3 h-3 rounded-full bg-emerald-400/90 hover:bg-emerald-400 transition-colors" />
        </div>

        {/* Address bar */}
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-gray-700/60 max-w-[260px] w-full">
            <Lock className="w-2.5 h-2.5 text-emerald-400 flex-shrink-0" />
            <span className="text-[11px] text-white/50 font-mono truncate">{url}</span>
          </div>
        </div>

        {/* Live indicator */}
        {live && (
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] text-emerald-400 font-medium">Live</span>
          </div>
        )}
      </div>

      {/* Browser content */}
      <div className="bg-gray-950">{children}</div>
    </div>
  )
}
