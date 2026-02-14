import { SiteHeader } from "@/components/marketing/site-header"
import { SiteFooter } from "@/components/marketing/site-footer"
import { PageTransition } from "@/components/marketing/page-transition"

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="pt-14">
        <PageTransition>{children}</PageTransition>
      </main>
      <SiteFooter />
    </div>
  )
}
