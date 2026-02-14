"use client"

import { motion } from "framer-motion"
import { Clock, MapPin, Calendar, Bell } from "lucide-react"

export function DashboardMockup() {
  return (
    <div className="p-6 space-y-4 min-h-[320px]">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/40 text-xs">Good morning, Sarah</p>
          <p className="text-white font-semibold text-sm">Ready to clock in</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 border border-white/10">
            <MapPin className="h-3 w-3 text-emerald-400" />
            <span className="text-[10px] text-white/60">HQ Office</span>
          </div>
          <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center">
            <Bell className="h-3.5 w-3.5 text-white/40" />
          </div>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-3 gap-3">
        {/* Clock button - spans 1 col */}
        <div className="flex flex-col items-center justify-center">
          <motion.div
            animate={{ boxShadow: ["0 0 0 0 rgba(37,99,235,0.3)", "0 0 0 12px rgba(37,99,235,0)", "0 0 0 0 rgba(37,99,235,0.3)"] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex flex-col items-center justify-center shadow-lg shadow-blue-500/20"
          >
            <Clock className="h-5 w-5 text-white mb-0.5" />
            <span className="text-white text-[8px] font-bold uppercase tracking-wider">Clock In</span>
          </motion.div>
          <div className="mt-3 text-center">
            <p className="text-white text-lg font-bold tabular-nums">0h 00m</p>
            <p className="text-white/30 text-[10px]">Today</p>
          </div>
        </div>

        {/* Week overview - spans 2 cols */}
        <div className="col-span-2 bg-white/5 rounded-lg border border-white/10 p-3">
          <p className="text-[10px] text-white/40 uppercase tracking-wider mb-2">This Week</p>
          <div className="grid grid-cols-5 gap-1.5">
            {["Mon", "Tue", "Wed", "Thu", "Fri"].map((day, i) => (
              <motion.div
                key={day}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4 + i * 0.06, type: "spring", stiffness: 300, damping: 20 }}
                className={`rounded-lg py-2 text-center ${
                  i < 3 ? "bg-emerald-500/15 border border-emerald-500/20" : "bg-white/5 border border-white/5"
                }`}
              >
                <p className="text-[9px] text-white/40">{day}</p>
                <p className={`text-xs font-semibold ${i < 3 ? "text-emerald-400" : "text-white/15"}`}>
                  {i < 3 ? "8h" : "\u2014"}
                </p>
              </motion.div>
            ))}
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
            <span className="text-[10px] text-white/30">Week total</span>
            <span className="text-xs font-semibold text-white/70">24h 00m</span>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "Streak", value: "12d", icon: "🔥" },
          { label: "This Month", value: "142h", color: "text-blue-400" },
          { label: "On-Time", value: "98%", color: "text-emerald-400" },
          { label: "XP", value: "4,250", color: "text-amber-400" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 + i * 0.06 }}
            className="p-2.5 rounded-lg bg-white/5 border border-white/10 text-center"
          >
            <p className={`text-sm font-bold ${stat.color || "text-white"}`}>
              {stat.icon || ""}{stat.value}
            </p>
            <p className="text-[9px] text-white/40 mt-0.5">{stat.label}</p>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export function AdminMockup() {
  const metrics = [
    { label: "On-Site Now", value: "24", color: "text-emerald-400", trend: "+3" },
    { label: "Clock-Ins Today", value: "31", color: "text-blue-400", trend: "" },
    { label: "Pending Approvals", value: "3", color: "text-amber-400", trend: "" },
    { label: "Compliance Rate", value: "98%", color: "text-emerald-400", trend: "+2%" },
  ]

  const feed = [
    { name: "Lisa Rodriguez", action: "clocked in", time: "2m ago", color: "bg-emerald-500", location: "HQ Office" },
    { name: "Mike Davidson", action: "started break", time: "5m ago", color: "bg-amber-500", location: "HQ Office" },
    { name: "Anna Williams", action: "clocked out", time: "8m ago", color: "bg-red-400", location: "Warehouse" },
    { name: "James Chen", action: "clocked in", time: "12m ago", color: "bg-emerald-500", location: "Remote" },
  ]

  return (
    <div className="p-6 space-y-4 min-h-[320px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <p className="text-white font-semibold text-sm">Admin Dashboard</p>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] text-emerald-400 font-medium">Live</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 border border-white/10">
            <Calendar className="h-3 w-3 text-white/40" />
            <span className="text-[10px] text-white/60">Today</span>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-2">
        {metrics.map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 + i * 0.06 }}
            className="p-3 rounded-lg bg-white/5 border border-white/10"
          >
            <div className="flex items-center justify-between mb-1">
              <p className={`text-xl font-bold ${m.color}`}>{m.value}</p>
              {m.trend && (
                <span className="text-[9px] text-emerald-400 font-medium">{m.trend}</span>
              )}
            </div>
            <p className="text-[10px] text-white/40">{m.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Activity feed */}
      <div>
        <p className="text-[10px] text-white/40 uppercase tracking-wider mb-2">Recent Activity</p>
        <div className="space-y-1">
          {feed.map((entry, i) => (
            <motion.div
              key={entry.name}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.08 }}
              className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] transition-colors"
            >
              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${entry.color}`} />
              <span className="text-[11px] font-medium text-white/80 flex-1">{entry.name}</span>
              <span className="text-[10px] text-white/40">{entry.action}</span>
              <span className="text-[10px] text-white/25 hidden sm:block">{entry.location}</span>
              <span className="text-[9px] text-white/20">{entry.time}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function RewardsMockup() {
  const badges = [
    { icon: "🔥", name: "On Fire", desc: "12-day streak" },
    { icon: "🐦", name: "Early Bird", desc: "Before 7am" },
    { icon: "💯", name: "Century", desc: "100 clock-ins" },
    { icon: "⭐", name: "Consistent", desc: "98% on-time" },
  ]

  const leaderboard = [
    { rank: 1, name: "Sarah Chen", xp: "5,120", level: 8 },
    { rank: 2, name: "Mike D.", xp: "4,890", level: 7 },
    { rank: 3, name: "Anna W.", xp: "4,250", level: 7 },
  ]

  return (
    <div className="p-6 space-y-4 min-h-[320px]">
      {/* Level card */}
      <div className="flex items-center gap-4">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex flex-col items-center justify-center text-white shadow-lg shadow-amber-500/20"
        >
          <span className="text-xl font-bold">7</span>
          <span className="text-[6px] uppercase tracking-wider opacity-80">Level</span>
        </motion.div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-bold text-white text-sm">Star Rank</span>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 text-[10px] font-medium">4,250 XP</span>
          </div>
          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
              initial={{ width: 0 }}
              animate={{ width: "75%" }}
              transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
            />
          </div>
          <p className="text-[10px] text-white/30 mt-1">750 XP to Level 8</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Badges */}
        <div>
          <p className="text-[10px] text-white/40 uppercase tracking-wider mb-2">Recent Badges</p>
          <div className="grid grid-cols-2 gap-1.5">
            {badges.map((b, i) => (
              <motion.div
                key={b.name}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + i * 0.08, type: "spring", stiffness: 300, damping: 15 }}
                className="flex flex-col items-center gap-1 p-2 rounded-lg border border-white/10 bg-white/5"
              >
                <span className="text-base">{b.icon}</span>
                <span className="text-[8px] font-medium text-white/50">{b.name}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Leaderboard */}
        <div>
          <p className="text-[10px] text-white/40 uppercase tracking-wider mb-2">Team Leaderboard</p>
          <div className="space-y-1">
            {leaderboard.map((entry, i) => (
              <motion.div
                key={entry.name}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.08 }}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/[0.03]"
              >
                <span className={`text-[10px] font-bold ${i === 0 ? "text-amber-400" : "text-white/30"}`}>#{entry.rank}</span>
                <span className="text-[11px] font-medium text-white/70 flex-1">{entry.name}</span>
                <span className="text-[10px] text-white/30">Lv.{entry.level}</span>
                <span className="text-[10px] font-semibold text-amber-400">{entry.xp}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Streak bar */}
      <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
        <span className="text-lg">🔥</span>
        <div className="flex-1">
          <p className="text-[11px] font-semibold text-white/80">12-Day Streak</p>
          <p className="text-[9px] text-white/30">3 days until next milestone</p>
        </div>
        <span className="text-[10px] font-bold text-amber-400">+17 XP/day</span>
      </div>
    </div>
  )
}
