"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface IPhoneFrameProps {
  children: React.ReactNode
  className?: string
  float?: boolean
}

export function IPhoneFrame({ children, className, float = false }: IPhoneFrameProps) {
  const Wrapper = float ? motion.div : "div"
  const wrapperProps = float
    ? {
        animate: { y: [0, -10, 0] },
        transition: { duration: 5, repeat: Infinity, ease: "easeInOut" as const },
      }
    : {}

  return (
    <Wrapper {...wrapperProps} className={cn("relative", className)}>
      {/* Phone outer shell */}
      <div className="relative rounded-[2.8rem] bg-gradient-to-b from-gray-800 to-gray-950 p-[3px] shadow-2xl shadow-black/40">
        {/* Inner bezel */}
        <div className="rounded-[2.6rem] bg-gray-950 p-2 relative overflow-hidden">
          {/* Dynamic Island */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20">
            <div className="w-[90px] h-[26px] bg-black rounded-full flex items-center justify-center gap-2">
              <div className="w-[8px] h-[8px] rounded-full bg-gray-800 ring-1 ring-gray-700" />
            </div>
          </div>

          {/* Status bar */}
          <div className="flex items-center justify-between px-7 pt-3.5 pb-1 relative z-10">
            <span className="text-white/70 text-[11px] font-semibold tabular-nums">9:41</span>
            <div />
            <div className="flex items-center gap-1">
              {/* Signal */}
              <div className="flex items-end gap-[1px]">
                {[3, 4.5, 6, 7.5].map((h, i) => (
                  <div key={i} className="w-[2.5px] rounded-sm bg-white/70" style={{ height: h }} />
                ))}
              </div>
              {/* WiFi */}
              <svg className="w-3.5 h-3.5 text-white/70 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 18c.55 0 1-.45 1-1s-.45-1-1-1-1 .45-1 1 .45 1 1 1zm-4.24-4.24l1.41 1.41C10.07 14.27 11 13.8 12 13.8s1.93.47 2.83 1.37l1.41-1.41C14.9 12.42 13.5 11.8 12 11.8s-2.9.62-4.24 1.96zm-2.83-2.83l1.41 1.41C8.21 10.47 10.06 9.5 12 9.5s3.79.97 5.66 2.84l1.41-1.41C16.84 8.7 14.5 7.5 12 7.5s-4.84 1.2-7.07 3.43z" />
              </svg>
              {/* Battery */}
              <div className="w-[18px] h-[9px] rounded-[2px] border border-white/50 ml-0.5 relative">
                <div className="absolute inset-[1px] rounded-[1px] bg-green-400" style={{ width: "70%" }} />
                <div className="absolute -right-[3px] top-1/2 -translate-y-1/2 w-[2px] h-[4px] rounded-r-sm bg-white/50" />
              </div>
            </div>
          </div>

          {/* Screen content */}
          <div className="rounded-[2.2rem] overflow-hidden bg-gray-950">
            {children}
          </div>

          {/* Home indicator */}
          <div className="flex justify-center py-2">
            <div className="w-[100px] h-[4px] rounded-full bg-white/20" />
          </div>
        </div>
      </div>

      {/* Reflection overlay */}
      <div className="absolute inset-0 rounded-[2.8rem] bg-gradient-to-tr from-transparent via-white/[0.03] to-white/[0.08] pointer-events-none" />
    </Wrapper>
  )
}
