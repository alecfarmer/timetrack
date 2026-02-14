"use client"

import { useAppPathname } from "@/components/org-link"
import { EmployeeNav } from "@/components/employee-nav"
import { RealtimeProvider } from "@/contexts/realtime-context"
import { useAuth } from "@/contexts/auth-context"

export default function EmployeeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = useAppPathname()
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <RealtimeProvider>
      <EmployeeNav currentPath={pathname} />
      <main className="pb-20 lg:pb-0 lg:ml-64 min-h-screen">
        {children}
      </main>
    </RealtimeProvider>
  )
}
