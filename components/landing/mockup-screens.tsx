"use client"

import { motion } from "framer-motion"
import { Clock, MapPin, Users, Trophy, TrendingUp, Shield } from "lucide-react"

export function DashboardMockup() {
  return (
    <div className="px-5 py-4 space-y-4">
      {/* Greeting */}
      <div>
        <p className="text-white/50 text-xs">Good morning</p>
        <p className="text-white font-semibold text-sm">Ready to clock in</p>
      </div>

      {/* Clock button */}
      <div className="flex justify-center">
        <motion.div
          animate={{ boxShadow: ["0 0 0 0 rgba(37,99,235,0.4)", "0 0 0 16px rgba(37,99,235,0)", "0 0 0 0 rgba(37,99,235,0.4)"] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex flex-col items-center justify-center shadow-lg shadow-blue-500/30"
        >
          <Clock className="h-5 w-5 text-white mb-0.5" />
          <span className="text-white text-[9px] font-bold uppercase tracking-wider">Clock In</span>
        </motion.div>
      </div>

      {/* Today's hours */}
      <div className="text-center">
        <p className="text-white text-xl font-bold tabular-nums">0h 00m</p>
        <p className="text-white/40 text-[10px]">Today</p>
      </div>

      {/* Week strip */}
      <div className="flex gap-1.5">
        {["M", "T", "W", "T", "F"].map((day, i) => (
          <motion.div
            key={`${day}-${i}`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.6 + i * 0.08, type: "spring", stiffness: 300, damping: 20 }}
            className={`flex-1 rounded-lg py-1.5 text-center ${
              i < 3 ? "bg-emerald-500/20 border border-emerald-500/30" : "bg-white/5 border border-white/10"
            }`}
          >
            <p className="text-[8px] text-white/40">{day}</p>
            <p className={`text-[9px] font-semibold ${i < 3 ? "text-emerald-400" : "text-white/20"}`}>
              {i < 3 ? "8h" : "\u2014"}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export function AdminMockup() {
  const metrics = [
    { label: "On-Site", value: "24", color: "text-emerald-400" },
    { label: "Clock-Ins", value: "31", color: "text-blue-400" },
    { label: "Pending", value: "3", color: "text-amber-400" },
    { label: "Compliance", value: "98%", color: "text-emerald-400" },
  ]

  const feed = [
    { name: "Lisa R.", action: "clocked in", time: "2m ago", color: "bg-emerald-500" },
    { name: "Mike D.", action: "started break", time: "5m ago", color: "bg-amber-500" },
    { name: "Anna W.", action: "clocked out", time: "8m ago", color: "bg-red-400" },
  ]

  return (
    <div className="p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-white font-semibold text-sm">Admin Dashboard</p>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] text-emerald-400 font-medium">Live</span>
        </div>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 gap-2">
        {metrics.map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 + i * 0.08 }}
            className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-center"
          >
            <p className={`text-lg font-bold ${m.color}`}>{m.value}</p>
            <p className="text-[9px] text-white/50">{m.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Activity feed */}
      <div className="space-y-1.5">
        {feed.map((entry, i) => (
          <motion.div
            key={entry.name}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + i * 0.1 }}
            className="flex items-center gap-2 p-2 rounded-lg bg-white/5"
          >
            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${entry.color}`} />
            <span className="text-[11px] font-medium text-white/80 flex-1">{entry.name}</span>
            <span className="text-[10px] text-white/40">{entry.action}</span>
            <span className="text-[9px] text-white/30">{entry.time}</span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export function RewardsMockup() {
  const badges = [
    { icon: "\uD83D\uDD25", name: "On Fire" },
    { icon: "\uD83D\uDC26", name: "Early Bird" },
    { icon: "\uD83D\uDCAF", name: "Century" },
  ]

  return (
    <div className="px-5 py-4 space-y-4">
      {/* Level card */}
      <div className="flex items-center gap-3">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex flex-col items-center justify-center text-white shadow-lg shadow-amber-500/25"
        >
          <span className="text-lg font-bold">7</span>
          <span className="text-[6px] uppercase tracking-wider opacity-80">Level</span>
        </motion.div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-white text-sm">Star</span>
            <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[9px] font-medium">4,250 XP</span>
          </div>
          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
              initial={{ width: 0 }}
              animate={{ width: "75%" }}
              transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>

      {/* Badges */}
      <div className="flex gap-2">
        {badges.map((b, i) => (
          <motion.div
            key={b.name}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 + i * 0.1, type: "spring", stiffness: 300, damping: 15 }}
            className="flex-1 flex flex-col items-center gap-1 p-2 rounded-xl border border-white/10 bg-white/5"
          >
            <span className="text-lg">{b.icon}</span>
            <span className="text-[8px] font-medium text-white/50">{b.name}</span>
          </motion.div>
        ))}
      </div>

      {/* Streak */}
      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 border border-white/10">
        <span className="text-lg">{"\uD83D\uDD25"}</span>
        <div className="flex-1">
          <p className="text-[11px] font-semibold text-white/80">12-Day Streak</p>
          <p className="text-[9px] text-white/40">Keep it going!</p>
        </div>
        <span className="text-[10px] font-bold text-amber-400">+17 XP/day</span>
      </div>
    </div>
  )
}
