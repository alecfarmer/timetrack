"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

const SHORTCUT_MAP: Record<string, string> = {
  "1": "/",
  "2": "/history",
  "3": "/callouts",
  "4": "/reports",
  "5": "/settings",
  "6": "/leave",
  "7": "/payroll",
}

/**
 * Global keyboard shortcuts for navigation.
 * Press a digit key (1-7) to navigate to the corresponding page.
 * Only activates when no input/textarea/select is focused.
 */
export function useKeyboardShortcuts() {
  const router = useRouter()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger when typing in an input
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return
      // Don't trigger with modifiers
      if (e.metaKey || e.ctrlKey || e.altKey) return

      const path = SHORTCUT_MAP[e.key]
      if (path) {
        e.preventDefault()
        router.push(path)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [router])
}
