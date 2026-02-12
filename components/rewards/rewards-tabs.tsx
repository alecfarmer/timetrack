"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface Tab {
  id: string
  label: string
  icon: React.ReactNode
  badge?: number
}

interface RewardsTabsProps {
  tabs: Tab[]
  activeTab: string
  onTabChange: (id: string) => void
}

export function RewardsTabs({ tabs, activeTab, onTabChange }: RewardsTabsProps) {
  return (
    <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
            activeTab === tab.id
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          {tab.icon}
          <span>{tab.label}</span>
          {tab.badge && tab.badge > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold min-w-[18px] text-center">
              {tab.badge}
            </span>
          )}
          {activeTab === tab.id && (
            <motion.div
              layoutId="rewards-tab-indicator"
              className="absolute inset-0 bg-primary/10 rounded-lg -z-10"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
        </button>
      ))}
    </div>
  )
}
