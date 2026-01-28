import { cn } from "@/lib/utils"

interface LogoProps {
  size?: "sm" | "md" | "lg"
  showText?: boolean
  className?: string
}

export function Logo({ size = "md", showText = true, className }: LogoProps) {
  const sizeMap = {
    sm: { icon: "w-8 h-8", text: "text-base", sub: "text-[10px]" },
    md: { icon: "w-10 h-10", text: "text-lg", sub: "text-xs" },
    lg: { icon: "w-14 h-14", text: "text-2xl", sub: "text-sm" },
  }

  const s = sizeMap[size]

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className={cn(s.icon, "rounded-xl bg-gradient-primary flex items-center justify-center shadow-lg")}>
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-[60%] h-[60%]"
        >
          {/* Clock circle */}
          <circle cx="16" cy="17" r="12" stroke="white" strokeWidth="2.2" opacity="0.95" />
          {/* Clock center */}
          <circle cx="16" cy="17" r="1.5" fill="white" />
          {/* Hour hand */}
          <line x1="16" y1="17" x2="12.5" y2="10" stroke="white" strokeWidth="2" strokeLinecap="round" />
          {/* Minute hand */}
          <line x1="16" y1="17" x2="23" y2="13" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
          {/* Location pin */}
          <g transform="translate(25, 4)">
            <path d="M0-1C-2.5-1-4.5 1-4.5 3.5C-4.5 6.5 0 9.5 0 9.5S4.5 6.5 4.5 3.5C4.5 1 2.5-1 0-1Z" fill="#FCE500" />
            <circle cx="0" cy="3.2" r="1.5" fill="white" opacity="0.9" />
          </g>
        </svg>
      </div>
      {showText && (
        <div className="flex flex-col">
          <span className={cn(s.text, "font-bold leading-none tracking-tight")}>OnSite</span>
          <span className={cn(s.sub, "text-muted-foreground leading-tight")}>Time Tracking</span>
        </div>
      )}
    </div>
  )
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <div className={cn("w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-lg", className)}>
      <svg
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-[60%] h-[60%]"
      >
        <circle cx="16" cy="17" r="12" stroke="white" strokeWidth="2.2" opacity="0.95" />
        <circle cx="16" cy="17" r="1.5" fill="white" />
        <line x1="16" y1="17" x2="12.5" y2="10" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <line x1="16" y1="17" x2="23" y2="13" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
        <g transform="translate(25, 4)">
          <path d="M0-1C-2.5-1-4.5 1-4.5 3.5C-4.5 6.5 0 9.5 0 9.5S4.5 6.5 4.5 3.5C4.5 1 2.5-1 0-1Z" fill="#FCE500" />
          <circle cx="0" cy="3.2" r="1.5" fill="white" opacity="0.9" />
        </g>
      </svg>
    </div>
  )
}
