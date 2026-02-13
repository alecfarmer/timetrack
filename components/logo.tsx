import { cn } from "@/lib/utils"

interface LogoProps {
  size?: "sm" | "md" | "lg"
  showText?: boolean
  className?: string
}

export function Logo({ size = "md", showText = true, className }: LogoProps) {
  const sizeMap = {
    sm: { icon: "w-8 h-8", text: "text-base" },
    md: { icon: "w-10 h-10", text: "text-lg" },
    lg: { icon: "w-14 h-14", text: "text-2xl" },
  }

  const s = sizeMap[size]

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className={cn(s.icon, "rounded-xl bg-gradient-primary flex items-center justify-center shadow-lg")}>
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-[65%] h-[65%]"
        >
          {/* Bold geometric K with subtle clock-pulse motif */}
          {/* K vertical stem */}
          <rect x="6" y="4" width="4.5" height="24" rx="1.5" fill="white" opacity="0.95" />
          {/* K upper diagonal */}
          <path d="M12 16L22 5C22.8 4.2 24 4.8 24 5.9V9.5L14 17.5" fill="white" opacity="0.95" />
          {/* K lower diagonal */}
          <path d="M12 16L22 27C22.8 27.8 24 27.2 24 26.1V22.5L14 14.5" fill="white" opacity="0.95" />
          {/* Subtle pulse-line accent on the K intersection */}
          <circle cx="12" cy="16" r="2" fill="white" opacity="0.6" />
        </svg>
      </div>
      {showText && (
        <div className="flex flex-col">
          <span className={cn(s.text, "font-bold leading-none tracking-tight")}>KPR</span>
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
        className="w-[65%] h-[65%]"
      >
        <rect x="6" y="4" width="4.5" height="24" rx="1.5" fill="white" opacity="0.95" />
        <path d="M12 16L22 5C22.8 4.2 24 4.8 24 5.9V9.5L14 17.5" fill="white" opacity="0.95" />
        <path d="M12 16L22 27C22.8 27.8 24 27.2 24 26.1V22.5L14 14.5" fill="white" opacity="0.95" />
        <circle cx="12" cy="16" r="2" fill="white" opacity="0.6" />
      </svg>
    </div>
  )
}
