"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sparkles, Star, Trophy, Flame, Zap, X, Coins, Shield } from "lucide-react"
import {
  levelUp,
  confettiPiece,
  badgeUnlock,
  modalOverlay,
  scaleUp,
  transitions,
} from "@/lib/animations"

// Confetti component
function Confetti({ count = 50 }: { count?: number }) {
  const colors = [
    "bg-yellow-400",
    "bg-pink-500",
    "bg-blue-500",
    "bg-emerald-500",
    "bg-purple-500",
    "bg-orange-500",
  ]

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          custom={i}
          variants={confettiPiece}
          initial="initial"
          animate="animate"
          className={cn(
            "absolute w-3 h-3 rounded-sm",
            colors[i % colors.length]
          )}
          style={{
            left: `${Math.random() * 100}%`,
            top: "50%",
          }}
        />
      ))}
    </div>
  )
}

// Level up modal
interface LevelUpModalProps {
  isOpen: boolean
  onClose: () => void
  level: number
  totalXP: number
  unlockedRewards?: string[]
  coinBonus?: number
  shieldEarned?: boolean
  titleUnlocked?: string | null
}

export function LevelUpModal({
  isOpen,
  onClose,
  level,
  totalXP,
  unlockedRewards = [],
  coinBonus = 0,
  shieldEarned = false,
  titleUnlocked = null,
}: LevelUpModalProps) {
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true)
      const timer = setTimeout(() => setShowConfetti(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={modalOverlay}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            variants={levelUp}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative w-full max-w-sm bg-gradient-to-b from-amber-500 to-orange-600 rounded-3xl p-8 text-white text-center shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {showConfetti && <Confetti count={60} />}

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Icon */}
            <motion.div
              variants={scaleUp}
              className="relative w-28 h-28 mx-auto mb-6"
            >
              <div className="absolute inset-0 bg-white/20 rounded-full animate-ping" />
              <div className="relative w-full h-full rounded-full bg-white/30 flex items-center justify-center">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.5, repeat: 3 }}
                >
                  <Trophy className="h-14 w-14 text-yellow-200" />
                </motion.div>
              </div>
              <motion.div
                className="absolute -top-2 -right-2"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <Sparkles className="h-8 w-8 text-yellow-200" />
              </motion.div>
            </motion.div>

            {/* Title */}
            <motion.h2
              variants={scaleUp}
              className="text-3xl font-bold mb-2"
            >
              Level Up!
            </motion.h2>

            {/* Level badge */}
            <motion.div
              variants={scaleUp}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 mb-4"
            >
              <Star className="h-5 w-5 text-yellow-200" />
              <span className="text-xl font-bold">Level {level}</span>
            </motion.div>

            {/* XP total */}
            <motion.p variants={scaleUp} className="text-white/80 mb-4">
              {totalXP.toLocaleString()} XP Total
            </motion.p>

            {/* Level-up bonuses */}
            {(coinBonus > 0 || shieldEarned || titleUnlocked) && (
              <motion.div variants={scaleUp} className="flex flex-wrap justify-center gap-2 mb-4">
                {coinBonus > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 text-sm font-medium">
                    <Coins className="h-4 w-4 text-yellow-200" />
                    +{coinBonus} Coins
                  </div>
                )}
                {shieldEarned && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 text-sm font-medium">
                    <Shield className="h-4 w-4 text-blue-200" />
                    +1 Streak Shield
                  </div>
                )}
                {titleUnlocked && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 text-sm font-medium">
                    <Star className="h-4 w-4 text-yellow-200" />
                    Title: {titleUnlocked}
                  </div>
                )}
              </motion.div>
            )}

            {/* Unlocked rewards */}
            {unlockedRewards.length > 0 && (
              <motion.div variants={scaleUp} className="mb-6">
                <p className="text-sm text-white/70 mb-3">Rewards Unlocked</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {unlockedRewards.map((reward, i) => (
                    <motion.span
                      key={reward}
                      variants={badgeUnlock}
                      initial="hidden"
                      animate="visible"
                      transition={{ delay: i * 0.1 }}
                      className="px-3 py-1 rounded-full bg-white/20 text-sm"
                    >
                      {reward}
                    </motion.span>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Continue button */}
            <motion.div variants={scaleUp}>
              <Button
                onClick={onClose}
                className="w-full bg-white text-orange-600 hover:bg-white/90 font-semibold"
              >
                Continue
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Badge unlock modal
interface BadgeUnlockModalProps {
  isOpen: boolean
  onClose: () => void
  badge: {
    name: string
    description: string
    icon: string
    xpReward: number
  } | null
}

export function BadgeUnlockModal({
  isOpen,
  onClose,
  badge,
}: BadgeUnlockModalProps) {
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true)
      const timer = setTimeout(() => setShowConfetti(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  if (!badge) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={modalOverlay}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            variants={badgeUnlock}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="relative w-full max-w-xs bg-card rounded-3xl p-6 text-center shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {showConfetti && <Confetti count={30} />}

            {/* Badge icon */}
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-24 h-24 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-5xl shadow-lg shadow-amber-500/25"
            >
              {badge.icon}
            </motion.div>

            {/* Badge name */}
            <h3 className="text-xl font-bold mb-1">{badge.name}</h3>

            {/* Description */}
            <p className="text-sm text-muted-foreground mb-4">
              {badge.description}
            </p>

            {/* XP reward */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-600 text-sm font-medium mb-6">
              <Zap className="h-4 w-4" />
              +{badge.xpReward} XP
            </div>

            {/* Close button */}
            <Button onClick={onClose} className="w-full">
              Awesome!
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Streak milestone modal
interface StreakMilestoneModalProps {
  isOpen: boolean
  onClose: () => void
  streakDays: number
  xpBonus: number
}

export function StreakMilestoneModal({
  isOpen,
  onClose,
  streakDays,
  xpBonus,
}: StreakMilestoneModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={modalOverlay}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            variants={levelUp}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative w-full max-w-xs bg-gradient-to-b from-orange-500 to-red-600 rounded-3xl p-6 text-white text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Fire icon */}
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                rotate: [-5, 5, -5],
              }}
              transition={{ duration: 0.5, repeat: Infinity }}
              className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center"
            >
              <Flame className="h-10 w-10" />
            </motion.div>

            {/* Title */}
            <h3 className="text-2xl font-bold mb-2">
              {streakDays} Day Streak!
            </h3>

            {/* Description */}
            <p className="text-white/80 text-sm mb-4">
              Amazing consistency! Keep it up!
            </p>

            {/* XP bonus */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 text-sm font-medium mb-6">
              <Zap className="h-4 w-4" />
              +{xpBonus} Bonus XP
            </div>

            {/* Continue button */}
            <Button
              onClick={onClose}
              className="w-full bg-white text-orange-600 hover:bg-white/90 font-semibold"
            >
              Keep Going!
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
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
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.9 }}
      className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500 text-white shadow-lg shadow-amber-500/25"
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
