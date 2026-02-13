/**
 * KPR Animation System — Minimal
 * Only essential Framer Motion presets
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
  easeOut: [0.16, 1, 0.3, 1],
  easeIn: [0.55, 0.055, 0.675, 0.19],
  easeInOut: [0.65, 0, 0.35, 1],
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
}

// ============================================
// VARIANT PRESETS
// ============================================

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: transitions.normal,
  },
}

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: transitions.normal,
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
      staggerChildren: 0.04,
      delayChildren: 0.05,
    },
  },
}

export const staggerChild: Variants = {
  hidden: { opacity: 0, y: 6 },
  visible: {
    opacity: 1,
    y: 0,
    transition: transitions.normal,
  },
}

// ============================================
// MODAL & OVERLAY
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
    transition: { duration: DURATIONS.normal, ease: EASINGS.easeOut },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: { duration: DURATIONS.fast },
  },
}

// ============================================
// BUTTON
// ============================================

export const buttonPress = {
  scale: 0.98,
  transition: { duration: DURATIONS.instant },
}
