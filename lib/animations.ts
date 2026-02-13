/**
 * KPR Animation System
 * Framer Motion presets for consistent animations across the app
 */

import { Variants, Transition } from "framer-motion"

// ============================================
// TIMING & EASING
// ============================================

export const DURATIONS = {
  instant: 0.1,
  fast: 0.15,
  normal: 0.2,
  slow: 0.3,
  slower: 0.5,
  slowest: 0.8,
} as const

export const EASINGS = {
  // Smooth deceleration - good for entrances
  easeOut: [0.16, 1, 0.3, 1],
  // Smooth acceleration - good for exits
  easeIn: [0.55, 0.055, 0.675, 0.19],
  // Smooth both ways - good for continuous animations
  easeInOut: [0.65, 0, 0.35, 1],
  // Bouncy - good for playful elements
  bounce: [0.68, -0.55, 0.265, 1.55],
  // Spring-like - good for buttons and cards
  spring: [0.175, 0.885, 0.32, 1.275],
} as const

// ============================================
// TRANSITION PRESETS
// ============================================

export const transitions: Record<string, Transition> = {
  fast: {
    duration: DURATIONS.fast,
    ease: EASINGS.easeOut,
  },
  normal: {
    duration: DURATIONS.normal,
    ease: EASINGS.easeOut,
  },
  slow: {
    duration: DURATIONS.slow,
    ease: EASINGS.easeOut,
  },
  spring: {
    type: "spring",
    stiffness: 400,
    damping: 30,
  },
  springBouncy: {
    type: "spring",
    stiffness: 300,
    damping: 20,
  },
  springGentle: {
    type: "spring",
    stiffness: 200,
    damping: 25,
  },
}

// ============================================
// VARIANT PRESETS - ENTRANCES
// ============================================

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: transitions.normal,
  },
}

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: transitions.normal,
  },
}

export const fadeDown: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: transitions.normal,
  },
}

export const fadeLeft: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: transitions.normal,
  },
}

export const fadeRight: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: transitions.normal,
  },
}

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: transitions.spring,
  },
}

export const scaleUp: Variants = {
  hidden: { opacity: 0, scale: 0.5 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: transitions.springBouncy,
  },
}

// ============================================
// STAGGER CHILDREN
// ============================================

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
}

export const staggerContainerFast: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0.05,
    },
  },
}

export const staggerContainerSlow: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}

// Child variants for staggered lists
export const staggerChild: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: transitions.normal,
  },
}

// ============================================
// PAGE TRANSITIONS
// ============================================

export const pageSlideRight: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: DURATIONS.slow, ease: EASINGS.easeOut },
  },
  exit: {
    opacity: 0,
    x: -20,
    transition: { duration: DURATIONS.normal, ease: EASINGS.easeIn },
  },
}

export const pageSlideLeft: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: DURATIONS.slow, ease: EASINGS.easeOut },
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: { duration: DURATIONS.normal, ease: EASINGS.easeIn },
  },
}

export const pageSlideUp: Variants = {
  initial: { opacity: 0, y: 30 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATIONS.slow, ease: EASINGS.easeOut },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: { duration: DURATIONS.normal, ease: EASINGS.easeIn },
  },
}

export const pageFade: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: DURATIONS.normal },
  },
  exit: {
    opacity: 0,
    transition: { duration: DURATIONS.fast },
  },
}

export const pageScale: Variants = {
  initial: { opacity: 0, scale: 0.98 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { duration: DURATIONS.slow, ease: EASINGS.easeOut },
  },
  exit: {
    opacity: 0,
    scale: 1.02,
    transition: { duration: DURATIONS.normal, ease: EASINGS.easeIn },
  },
}

// ============================================
// MODAL & OVERLAY ANIMATIONS
// ============================================

export const modalOverlay: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: DURATIONS.normal },
  },
  exit: {
    opacity: 0,
    transition: { duration: DURATIONS.fast },
  },
}

export const modalContent: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: transitions.spring,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: { duration: DURATIONS.fast },
  },
}

export const sheetSlideUp: Variants = {
  hidden: { y: "100%" },
  visible: {
    y: 0,
    transition: transitions.springGentle,
  },
  exit: {
    y: "100%",
    transition: { duration: DURATIONS.normal, ease: EASINGS.easeIn },
  },
}

export const dropdownMenu: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: -5 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: DURATIONS.fast, ease: EASINGS.easeOut },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: -5,
    transition: { duration: DURATIONS.instant },
  },
}

// ============================================
// BUTTON & INTERACTION ANIMATIONS
// ============================================

export const buttonPress = {
  scale: 0.97,
  transition: { duration: DURATIONS.instant },
}

export const buttonHover = {
  scale: 1.02,
  transition: { duration: DURATIONS.fast },
}

export const cardHover = {
  y: -4,
  transition: { duration: DURATIONS.fast, ease: EASINGS.easeOut },
}

export const cardPress = {
  scale: 0.98,
  transition: { duration: DURATIONS.instant },
}

// ============================================
// CLOCK BUTTON SPECIFIC
// ============================================

export const clockButtonPulse: Variants = {
  idle: {
    scale: 1,
    boxShadow: "0 0 0 0 rgba(34, 197, 94, 0)",
  },
  pulse: {
    scale: [1, 1.02, 1],
    boxShadow: [
      "0 0 0 0 rgba(34, 197, 94, 0.4)",
      "0 0 0 20px rgba(34, 197, 94, 0)",
      "0 0 0 0 rgba(34, 197, 94, 0)",
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
}

export const clockButtonRipple: Variants = {
  initial: { scale: 0, opacity: 0.5 },
  animate: {
    scale: 2.5,
    opacity: 0,
    transition: { duration: 0.6, ease: EASINGS.easeOut },
  },
}

export const clockButtonSuccess: Variants = {
  initial: { scale: 0, rotate: -45 },
  animate: {
    scale: 1,
    rotate: 0,
    transition: transitions.springBouncy,
  },
}

// ============================================
// GAMIFICATION ANIMATIONS
// ============================================

export const confettiPiece: Variants = {
  initial: {
    y: 0,
    opacity: 1,
    scale: 1,
    rotate: 0,
  },
  animate: (i: number) => ({
    y: [0, -100 - Math.random() * 200, 400],
    x: [0, (Math.random() - 0.5) * 300],
    opacity: [1, 1, 0],
    scale: [1, 1.2, 0.5],
    rotate: [0, Math.random() * 720 - 360],
    transition: {
      duration: 2 + Math.random(),
      ease: "easeOut",
      delay: i * 0.02,
    },
  }),
}

export const badgeUnlock: Variants = {
  hidden: {
    scale: 0,
    rotate: -180,
    opacity: 0,
  },
  visible: {
    scale: 1,
    rotate: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 15,
    },
  },
}

export const xpCounter: Variants = {
  initial: {
    y: 0,
    opacity: 1,
    scale: 1,
  },
  animate: {
    y: -30,
    opacity: 0,
    scale: 1.5,
    transition: { duration: 1, ease: EASINGS.easeOut },
  },
}

export const levelUp: Variants = {
  hidden: {
    scale: 0.5,
    opacity: 0,
    y: 50,
  },
  visible: {
    scale: 1,
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 20,
      staggerChildren: 0.1,
    },
  },
  exit: {
    scale: 0.9,
    opacity: 0,
    y: -20,
    transition: { duration: DURATIONS.normal },
  },
}

export const streakFire: Variants = {
  idle: {
    scale: 1,
    rotate: 0,
  },
  burning: {
    scale: [1, 1.1, 1],
    rotate: [-3, 3, -3],
    transition: {
      duration: 0.5,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
}

// ============================================
// PROGRESS ANIMATIONS
// ============================================

export const progressFill: Variants = {
  hidden: { width: 0 },
  visible: (progress: number) => ({
    width: `${progress}%`,
    transition: {
      duration: DURATIONS.slowest,
      ease: EASINGS.easeOut,
    },
  }),
}

export const circularProgress: Variants = {
  hidden: { pathLength: 0 },
  visible: (progress: number) => ({
    pathLength: progress / 100,
    transition: {
      duration: DURATIONS.slowest,
      ease: EASINGS.easeOut,
    },
  }),
}

// ============================================
// WIDGET ANIMATIONS
// ============================================

export const widgetEnter: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: transitions.spring,
  },
}

export const widgetReorder: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 30,
}

// ============================================
// LOADING STATES
// ============================================

export const skeletonPulse: Variants = {
  initial: { opacity: 0.4 },
  animate: {
    opacity: [0.4, 0.7, 0.4],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
}

export const spinnerRotate: Variants = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: "linear",
    },
  },
}

export const dotsLoading: Variants = {
  animate: (i: number) => ({
    y: [0, -8, 0],
    transition: {
      duration: 0.6,
      repeat: Infinity,
      delay: i * 0.1,
      ease: "easeInOut",
    },
  }),
}

// ============================================
// NOTIFICATION ANIMATIONS
// ============================================

export const notificationSlideIn: Variants = {
  hidden: {
    opacity: 0,
    x: 50,
    scale: 0.9,
  },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: transitions.spring,
  },
  exit: {
    opacity: 0,
    x: 50,
    scale: 0.9,
    transition: { duration: DURATIONS.fast },
  },
}

export const toastSlideUp: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: transitions.spring,
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.95,
    transition: { duration: DURATIONS.fast },
  },
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Create a stagger container with custom timing
 */
export function createStaggerContainer(
  staggerChildren: number = 0.05,
  delayChildren: number = 0.1
): Variants {
  return {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren, delayChildren },
    },
  }
}

/**
 * Create a custom fade with direction
 */
export function createFade(
  direction: "up" | "down" | "left" | "right" = "up",
  distance: number = 20
): Variants {
  const sign = direction === "down" || direction === "right" ? -1 : 1
  const offset = distance * sign

  if (direction === "up" || direction === "down") {
    return {
      hidden: { opacity: 0, y: offset },
      visible: { opacity: 1, y: 0, transition: transitions.normal },
    }
  }
  return {
    hidden: { opacity: 0, x: offset },
    visible: { opacity: 1, x: 0, transition: transitions.normal },
  }
}

/**
 * Create a delayed fade animation
 */
export function createDelayedFade(delay: number): Variants {
  return {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        ...transitions.normal,
        delay,
      },
    },
  }
}

// ============================================
// PAGE ENTER (for template.tsx transitions)
// ============================================

export const pageEnter: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATIONS.slow, ease: EASINGS.easeOut },
  },
}

export const pageEnterSubtle: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: DURATIONS.normal },
  },
}

// ============================================
// INTERACTIVE CARD & BUTTON VARIANTS
// ============================================

export const cardInteractive: Variants = {
  hidden: { opacity: 0, y: 15, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: transitions.spring,
  },
}

export const cardInteractiveHover = {
  y: -4,
  scale: 1.01,
  transition: { duration: DURATIONS.fast, ease: EASINGS.easeOut },
}

export const cardInteractiveTap = {
  scale: 0.98,
  transition: { duration: DURATIONS.instant },
}

export const buttonSpring = {
  whileHover: { scale: 1.03, transition: { type: "spring", stiffness: 400, damping: 25 } },
  whileTap: { scale: 0.97, transition: { duration: DURATIONS.instant } },
}

// ============================================
// DRAMATIC STAGGER
// ============================================

export const staggerContainerDramatic: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.15,
    },
  },
}

export const staggerChildDramatic: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24,
    },
  },
}
