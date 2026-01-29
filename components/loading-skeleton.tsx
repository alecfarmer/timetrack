"use client"

import { cn } from "@/lib/utils"

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-muted", className)} />
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {/* Status card */}
      <div className="card-elevated p-5 space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-4 w-36" />
          </div>
        </div>
        <Skeleton className="h-16 w-full rounded-xl" />
        <div className="flex gap-4">
          <Skeleton className="h-12 flex-1 rounded-lg" />
          <Skeleton className="h-12 flex-1 rounded-lg" />
          <Skeleton className="h-12 flex-1 rounded-lg" />
        </div>
      </div>

      {/* Clock button */}
      <div className="card-elevated p-4 space-y-3">
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-14 w-full rounded-xl" />
      </div>

      {/* Weekly progress */}
      <div className="card-elevated p-4 space-y-3">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-3 w-full rounded-full" />
        <div className="flex gap-1">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="flex-1 h-7 rounded-md" />
          ))}
        </div>
      </div>

      {/* Entries */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
    </div>
  )
}

export function PageSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-3 mb-6">
        <Skeleton className="w-9 h-9 rounded-xl" />
        <Skeleton className="h-5 w-32" />
      </div>
      <Skeleton className="h-32 w-full rounded-xl" />
      <Skeleton className="h-48 w-full rounded-xl" />
      <Skeleton className="h-24 w-full rounded-xl" />
    </div>
  )
}
