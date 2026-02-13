import { cn } from "@/lib/utils"

function Bone({ className }: { className?: string }) {
  return <div className={cn("bg-muted animate-pulse rounded-lg", className)} />
}

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 bg-gradient-radial pointer-events-none" />
      <header className="sticky top-0 z-50 bg-card border-b lg:ml-64">
        <div className="flex items-center justify-between px-4 h-16 max-w-7xl mx-auto lg:px-8">
          <Bone className="h-8 w-24 lg:hidden" />
          <div className="hidden lg:flex items-center gap-4">
            <Bone className="h-6 w-28" />
            <Bone className="h-5 w-16 rounded-full" />
          </div>
          <div className="flex items-center gap-2">
            <Bone className="h-9 w-9 rounded-xl" />
            <Bone className="h-9 w-9 rounded-xl" />
            <Bone className="h-9 w-9 rounded-xl" />
          </div>
        </div>
      </header>
      <main className="relative pb-24 lg:pb-4 lg:ml-64">
        <div className="max-w-7xl mx-auto px-4 py-4 lg:px-6 lg:py-4 space-y-4">
          {/* Mobile hero */}
          <div className="lg:hidden space-y-4">
            <Bone className="h-48 rounded-2xl" />
            <Bone className="h-56 rounded-2xl" />
            <Bone className="h-28 rounded-2xl" />
          </div>
          {/* Desktop grid */}
          <div className="hidden lg:grid lg:grid-cols-12 gap-4">
            <div className="lg:col-span-4"><Bone className="h-72 rounded-2xl" /></div>
            <div className="lg:col-span-4 space-y-3">
              <Bone className="h-32 rounded-2xl" />
              <div className="grid grid-cols-3 gap-3">
                <Bone className="h-16 rounded-2xl" />
                <Bone className="h-16 rounded-2xl" />
                <Bone className="h-16 rounded-2xl" />
              </div>
              <Bone className="h-28 rounded-2xl" />
            </div>
            <div className="lg:col-span-4"><Bone className="h-[420px] rounded-2xl" /></div>
          </div>
        </div>
      </main>
    </div>
  )
}

export function PageWithHeaderSkeleton({ title }: { title?: string }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 bg-gradient-radial pointer-events-none" />
      <header className="sticky top-0 z-50 bg-card border-b">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <Bone className="h-8 w-8 rounded-lg" />
            {title ? (
              <span className="text-lg font-semibold">{title}</span>
            ) : (
              <Bone className="h-6 w-28" />
            )}
          </div>
          <Bone className="h-8 w-8 rounded-lg" />
        </div>
      </header>
      <main className="relative pb-24">
        <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
          <Bone className="h-10 w-full rounded-xl" />
          <Bone className="h-64 rounded-2xl" />
          <div className="space-y-2">
            <Bone className="h-16 rounded-xl" />
            <Bone className="h-16 rounded-xl" />
            <Bone className="h-16 rounded-xl" />
          </div>
        </div>
      </main>
    </div>
  )
}

export function ListPageSkeleton({ title }: { title?: string }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 bg-gradient-radial pointer-events-none" />
      <header className="sticky top-0 z-50 bg-card border-b">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <Bone className="h-8 w-8 rounded-lg" />
            {title ? (
              <span className="text-lg font-semibold">{title}</span>
            ) : (
              <Bone className="h-6 w-28" />
            )}
          </div>
          <div className="flex items-center gap-2">
            <Bone className="h-8 w-20 rounded-lg" />
            <Bone className="h-8 w-8 rounded-lg" />
          </div>
        </div>
      </header>
      <main className="relative pb-24">
        <div className="max-w-2xl mx-auto px-4 py-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Bone key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      </main>
    </div>
  )
}
