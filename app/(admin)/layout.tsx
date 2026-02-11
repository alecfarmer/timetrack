"use client"

import { AdminSidebar } from "@/components/admin-sidebar"
import { AdminMobileNav } from "@/components/admin-mobile-nav"
import { useAuth } from "@/contexts/auth-context"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isAdmin, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!user || !isAdmin) {
    return null
  }

  return (
    <>
      <AdminSidebar />
      <AdminMobileNav />
      <main className="lg:ml-72 min-h-screen bg-muted/30 pb-20 lg:pb-0">
        {children}
      </main>
    </>
  )
}
