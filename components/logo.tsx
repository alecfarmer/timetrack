import { cn } from "@/lib/utils"

interface LogoProps {
  size?: "sm" | "md" | "lg"
  showText?: boolean
  className?: string
}

export function Logo({ size = "md", showText = true, className }: LogoProps) {
  const sizeMap = {
    sm: { icon: "w-7 h-7", text: "text-base" },
    md: { icon: "w-9 h-9", text: "text-lg" },
    lg: { icon: "w-12 h-12", text: "text-2xl" },
  }

  const s = sizeMap[size]

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn(s.icon, "rounded-lg bg-foreground flex items-center justify-center")}>
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-[60%] h-[60%]"
        >
          {/* K letterform — geometric, bold */}
          <rect x="7" y="5" width="4" height="22" rx="1" fill="currentColor" className="text-background" />
          <path d="M13 16L22 6C22.6 5.4 23.5 5.8 23.5 6.6V10L15 17" fill="currentColor" className="text-background" />
          <path d="M13 16L22 26C22.6 26.6 23.5 26.2 23.5 25.4V22L15 15" fill="currentColor" className="text-background" />
        </svg>
      </div>
      {showText && (
        <span className={cn(s.text, "font-bold leading-none tracking-tight")}>KPR</span>
      )}
    </div>
  )
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <div className={cn("w-9 h-9 rounded-lg bg-foreground flex items-center justify-center", className)}>
      <svg
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-[60%] h-[60%]"
      >
        <rect x="7" y="5" width="4" height="22" rx="1" fill="currentColor" className="text-background" />
        <path d="M13 16L22 6C22.6 5.4 23.5 5.8 23.5 6.6V10L15 17" fill="currentColor" className="text-background" />
        <path d="M13 16L22 26C22.6 26.6 23.5 26.2 23.5 25.4V22L15 15" fill="currentColor" className="text-background" />
      </svg>
    </div>
  )
}
