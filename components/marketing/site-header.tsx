"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Menu, X, ArrowRight } from "lucide-react"

const navLinks = [
  { label: "Features", href: "/features" },
  { label: "Pricing", href: "/pricing" },
  { label: "About", href: "/about" },
  { label: "Changelog", href: "/roadmap" },
]

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-[background-color,border-color,box-shadow] duration-200",
        scrolled
          ? "bg-background border-b border-border shadow-sm"
          : "bg-background/0"
      )}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <nav className="relative flex items-center justify-between h-14">
          {/* Logo — left */}
          <Link href="/" className="relative z-10 shrink-0">
            <Logo size="sm" />
          </Link>

          {/* Center nav links — absolutely centered */}
          <div className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="px-3.5 py-1.5 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors duration-150"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 relative z-10">
            <Link
              href="/login"
              className="hidden sm:inline-flex items-center px-3.5 py-1.5 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors duration-150"
            >
              Log in
            </Link>
            <Link href="/signup" className="hidden sm:block">
              <Button size="sm" className="gap-1.5 rounded-lg shadow-none h-8 px-3.5 text-xs font-semibold">
                Start Free
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>

            {/* Mobile toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 -mr-2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </nav>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="mx-auto max-w-6xl px-4 py-3 space-y-0.5">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2.5 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 mt-2 border-t border-border flex flex-col gap-2">
              <Link href="/login" onClick={() => setMobileOpen(false)}>
                <Button variant="outline" size="sm" className="w-full">Log in</Button>
              </Link>
              <Link href="/signup" onClick={() => setMobileOpen(false)}>
                <Button size="sm" className="w-full gap-1.5">
                  Start Free <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
