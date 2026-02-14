import Link from "next/link"
import { Logo } from "@/components/logo"

const footerLinks = {
  Product: [
    { label: "Time Tracking", href: "/features/time-tracking" },
    { label: "Compliance", href: "/features/compliance" },
    { label: "Payroll", href: "/features/payroll" },
    { label: "Analytics", href: "/features/analytics" },
    { label: "Scheduling", href: "/features/scheduling" },
  ],
  Company: [
    { label: "About", href: "/about" },
    { label: "Changelog", href: "/roadmap" },
    { label: "Pricing", href: "/pricing" },
    { label: "FAQ", href: "/faq" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "/legal/privacy" },
    { label: "Terms of Service", href: "/legal/terms" },
    { label: "Sitemap", href: "/sitemap.xml" },
  ],
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-8 mb-12">
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-sm font-semibold mb-4">{title}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Logo size="sm" />
            </Link>
            <span className="text-xs text-muted-foreground">
              GDPR Compliant
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} KPR Technologies, Inc.
          </p>
        </div>
      </div>
    </footer>
  )
}
