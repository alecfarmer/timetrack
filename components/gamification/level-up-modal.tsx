"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Star, Trophy, Flame, Zap, X, Coins, Shield } from "lucide-react"
import { modalOverlay, modalContent } from "@/lib/animations"

// Consolidated reward modal
type RewardType = "level-up" | "badge" | "streak"

interface RewardModalProps {
  type: RewardType
  isOpen: boolean
  onClose: () => void
  // Level-up fields
  level?: number
  totalXP?: number
  unlockedRewards?: string[]
  coinBonus?: number
  shieldEarned?: boolean
  titleUnlocked?: string | null
  // Badge fields
  badge?: {
    name: string
    description: string
    icon: string
    xpReward: number
  } | null
  // Streak fields
  streakDays?: number
  xpBonus?: number
}

export function RewardModal({
  type,
  isOpen,
  onClose,
  level = 0,
  totalXP = 0,
  unlockedRewards = [],
  coinBonus = 0,
  shieldEarned = false,
  titleUnlocked = null,
  badge = null,
  streakDays = 0,
  xpBonus = 0,
}: RewardModalProps) {
  if (type === "badge" && !badge) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={modalOverlay}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={onClose}
        >
          <motion.div
            variants={modalContent}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={cn(
              "relative w-full max-w-sm rounded-2xl p-6 text-center shadow-xl overflow-hidden",
              type === "level-up" && "bg-gradient-to-b from-amber-500 to-orange-600 text-white",
              type === "badge" && "bg-card",
              type === "streak" && "bg-gradient-to-b from-orange-500 to-red-600 text-white"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            {type === "level-up" && (
              <>
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center">
                  <Trophy className="h-10 w-10 text-yellow-200" />
                </div>
                <h2 className="text-2xl font-bold mb-1">Level Up!</h2>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 mb-3 text-sm font-bold">
                  <Star className="h-4 w-4 text-yellow-200" />
                  Level {level}
                </div>
                <p className="text-white/80 text-sm mb-3">{totalXP.toLocaleString()} XP Total</p>

                {(coinBonus > 0 || shieldEarned || titleUnlocked) && (
                  <div className="flex flex-wrap justify-center gap-2 mb-3">
                    {coinBonus > 0 && (
                      <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/20 text-xs font-medium">
                        <Coins className="h-3.5 w-3.5 text-yellow-200" />
                        +{coinBonus} Coins
                      </div>
                    )}
                    {shieldEarned && (
                      <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/20 text-xs font-medium">
                        <Shield className="h-3.5 w-3.5 text-blue-200" />
                        +1 Streak Shield
                      </div>
                    )}
                    {titleUnlocked && (
                      <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/20 text-xs font-medium">
                        <Star className="h-3.5 w-3.5 text-yellow-200" />
                        Title: {titleUnlocked}
                      </div>
                    )}
                  </div>
                )}

                {unlockedRewards.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-white/70 mb-2">Rewards Unlocked</p>
                    <div className="flex flex-wrap justify-center gap-1.5">
                      {unlockedRewards.map((reward) => (
                        <span key={reward} className="px-2.5 py-1 rounded-full bg-white/20 text-xs">
                          {reward}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  onClick={onClose}
                  className="w-full bg-white text-orange-600 hover:bg-white/90 font-semibold"
                >
                  Continue
                </Button>
              </>
            )}

            {type === "badge" && badge && (
              <>
                <div className="w-20 h-20 mx-auto mb-4 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-4xl shadow-md">
                  {badge.icon}
                </div>
                <h3 className="text-lg font-bold mb-1">{badge.name}</h3>
                <p className="text-sm text-muted-foreground mb-3">{badge.description}</p>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-600 text-sm font-medium mb-4">
                  <Zap className="h-4 w-4" />
                  +{badge.xpReward} XP
                </div>
                <Button onClick={onClose} className="w-full">Awesome!</Button>
              </>
            )}

            {type === "streak" && (
              <>
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center">
                  <Flame className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold mb-1">{streakDays} Day Streak!</h3>
                <p className="text-white/80 text-sm mb-3">Amazing consistency! Keep it up!</p>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 text-sm font-medium mb-4">
                  <Zap className="h-4 w-4" />
                  +{xpBonus} Bonus XP
                </div>
                <Button
                  onClick={onClose}
                  className="w-full bg-white text-orange-600 hover:bg-white/90 font-semibold"
                >
                  Keep Going!
                </Button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Keep backward-compatible exports
export function LevelUpModal(props: {
  isOpen: boolean
  onClose: () => void
  level: number
  totalXP: number
  unlockedRewards?: string[]
  coinBonus?: number
  shieldEarned?: boolean
  titleUnlocked?: string | null
}) {
  return <RewardModal type="level-up" {...props} />
}

export function BadgeUnlockModal(props: {
  isOpen: boolean
  onClose: () => void
  badge: { name: string; description: string; icon: string; xpReward: number } | null
}) {
  return <RewardModal type="badge" {...props} />
}

export function StreakMilestoneModal(props: {
  isOpen: boolean
  onClose: () => void
  streakDays: number
  xpBonus: number
}) {
  return <RewardModal type="streak" {...props} />
}

// XP gain toast notification
interface XPGainToastProps {
  amount: number
  reason: string
  onComplete?: () => void
}

export function XPGainToast({ amount, reason, onComplete }: XPGainToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete?.()
    }, 2000)
    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500 text-white shadow-lg"
    >
      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
        <Zap className="h-5 w-5" />
      </div>
      <div>
        <p className="font-bold">+{amount} XP</p>
        <p className="text-sm text-white/80">{reason}</p>
      </div>
    </motion.div>
  )
}

// Gamification context hook for managing modals
interface GamificationState {
  showLevelUp: boolean
  levelUpData: { level: number; totalXP: number; rewards: string[]; coinBonus?: number; shieldEarned?: boolean; titleUnlocked?: string | null } | null
  showBadgeUnlock: boolean
  badgeData: { name: string; description: string; icon: string; xpReward: number } | null
  showStreakMilestone: boolean
  streakData: { days: number; xpBonus: number } | null
  xpGains: { id: string; amount: number; reason: string }[]
}

export function useGamificationModals() {
  const [state, setState] = useState<GamificationState>({
    showLevelUp: false,
    levelUpData: null,
    showBadgeUnlock: false,
    badgeData: null,
    showStreakMilestone: false,
    streakData: null,
    xpGains: [],
  })

  const triggerLevelUp = useCallback(
    (level: number, totalXP: number, rewards: string[] = [], coinBonus?: number, shieldEarned?: boolean, titleUnlocked?: string | null) => {
      setState((s) => ({
        ...s,
        showLevelUp: true,
        levelUpData: { level, totalXP, rewards, coinBonus, shieldEarned, titleUnlocked },
      }))
    },
    []
  )

  const triggerBadgeUnlock = useCallback(
    (badge: { name: string; description: string; icon: string; xpReward: number }) => {
      setState((s) => ({
        ...s,
        showBadgeUnlock: true,
        badgeData: badge,
      }))
    },
    []
  )

  const triggerStreakMilestone = useCallback((days: number, xpBonus: number) => {
    setState((s) => ({
      ...s,
      showStreakMilestone: true,
      streakData: { days, xpBonus },
    }))
  }, [])

  const addXPGain = useCallback((amount: number, reason: string) => {
    const id = `${Date.now()}-${Math.random()}`
    setState((s) => ({
      ...s,
      xpGains: [...s.xpGains, { id, amount, reason }],
    }))
  }, [])

  const removeXPGain = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      xpGains: s.xpGains.filter((g) => g.id !== id),
    }))
  }, [])

  const closeLevelUp = useCallback(() => {
    setState((s) => ({ ...s, showLevelUp: false, levelUpData: null }))
  }, [])

  const closeBadgeUnlock = useCallback(() => {
    setState((s) => ({ ...s, showBadgeUnlock: false, badgeData: null }))
  }, [])

  const closeStreakMilestone = useCallback(() => {
    setState((s) => ({ ...s, showStreakMilestone: false, streakData: null }))
  }, [])

  return {
    state,
    triggerLevelUp,
    triggerBadgeUnlock,
    triggerStreakMilestone,
    addXPGain,
    removeXPGain,
    closeLevelUp,
    closeBadgeUnlock,
    closeStreakMilestone,
  }
}
