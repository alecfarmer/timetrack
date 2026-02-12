// Level definitions: 20 levels with XP thresholds and rewards

export interface LevelDefinition {
  level: number
  title: string
  xpThreshold: number
  coinReward: number
  streakShieldReward: number
}

export const LEVELS: LevelDefinition[] = [
  { level: 1, title: "Newcomer", xpThreshold: 0, coinReward: 0, streakShieldReward: 0 },
  { level: 2, title: "Regular", xpThreshold: 100, coinReward: 10, streakShieldReward: 0 },
  { level: 3, title: "Committed", xpThreshold: 300, coinReward: 10, streakShieldReward: 0 },
  { level: 4, title: "Dedicated", xpThreshold: 600, coinReward: 15, streakShieldReward: 0 },
  { level: 5, title: "Reliable", xpThreshold: 1000, coinReward: 20, streakShieldReward: 1 },
  { level: 6, title: "Dependable", xpThreshold: 1600, coinReward: 20, streakShieldReward: 0 },
  { level: 7, title: "Standout", xpThreshold: 2400, coinReward: 25, streakShieldReward: 0 },
  { level: 8, title: "Star", xpThreshold: 3500, coinReward: 30, streakShieldReward: 0 },
  { level: 9, title: "Ace", xpThreshold: 5000, coinReward: 35, streakShieldReward: 0 },
  { level: 10, title: "Champion", xpThreshold: 7000, coinReward: 40, streakShieldReward: 1 },
  { level: 11, title: "Hero", xpThreshold: 9500, coinReward: 45, streakShieldReward: 0 },
  { level: 12, title: "Elite", xpThreshold: 12500, coinReward: 50, streakShieldReward: 0 },
  { level: 13, title: "Master", xpThreshold: 16000, coinReward: 60, streakShieldReward: 0 },
  { level: 14, title: "Grandmaster", xpThreshold: 20000, coinReward: 70, streakShieldReward: 0 },
  { level: 15, title: "Legend", xpThreshold: 25000, coinReward: 80, streakShieldReward: 1 },
  { level: 16, title: "Mythic", xpThreshold: 31000, coinReward: 100, streakShieldReward: 0 },
  { level: 17, title: "Titan", xpThreshold: 38000, coinReward: 120, streakShieldReward: 0 },
  { level: 18, title: "Immortal", xpThreshold: 46000, coinReward: 150, streakShieldReward: 0 },
  { level: 19, title: "Transcendent", xpThreshold: 55000, coinReward: 200, streakShieldReward: 0 },
  { level: 20, title: "Apex", xpThreshold: 65000, coinReward: 300, streakShieldReward: 1 },
]

export function getLevelForXp(xp: number): LevelDefinition {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].xpThreshold) return LEVELS[i]
  }
  return LEVELS[0]
}

export function getNextLevel(currentLevel: number): LevelDefinition | null {
  if (currentLevel >= 20) return null
  return LEVELS[currentLevel] // 0-indexed: level 1 → LEVELS[0], next → LEVELS[1]
}

export function getXpProgress(xp: number): {
  level: number
  title: string
  xpInLevel: number
  xpForLevel: number
  progress: number
  nextLevel: LevelDefinition | null
} {
  const current = getLevelForXp(xp)
  const next = getNextLevel(current.level)

  if (!next) {
    return {
      level: current.level,
      title: current.title,
      xpInLevel: 0,
      xpForLevel: 0,
      progress: 100,
      nextLevel: null,
    }
  }

  const xpInLevel = xp - current.xpThreshold
  const xpForLevel = next.xpThreshold - current.xpThreshold

  return {
    level: current.level,
    title: current.title,
    xpInLevel,
    xpForLevel,
    progress: Math.min(100, Math.round((xpInLevel / xpForLevel) * 100)),
    nextLevel: next,
  }
}
