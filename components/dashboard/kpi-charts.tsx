"use client"

import { motion } from "framer-motion"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  LineChart,
  Line,
  Area,
  AreaChart,
  Tooltip,
} from "recharts"
import { cn } from "@/lib/utils"

interface RadialProgressProps {
  value: number
  max: number
  size?: number
  strokeWidth?: number
  color?: string
  bgColor?: string
  label?: string
  sublabel?: string
  showValue?: boolean
}

export function RadialProgress({
  value,
  max,
  size = 120,
  strokeWidth = 10,
  color = "hsl(var(--primary))",
  bgColor = "hsl(var(--muted))",
  label,
  sublabel,
  showValue = true,
}: RadialProgressProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = Math.min(value / max, 1)
  const offset = circumference - progress * circumference

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={bgColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {showValue && (
          <span className="text-2xl font-bold tabular-nums">
            {Math.round(progress * 100)}%
          </span>
        )}
        {label && <span className="text-xs text-muted-foreground mt-0.5">{label}</span>}
        {sublabel && <span className="text-[10px] text-muted-foreground/70">{sublabel}</span>}
      </div>
    </div>
  )
}

interface DonutChartData {
  name: string
  value: number
  color: string
}

interface DonutChartProps {
  data: DonutChartData[]
  size?: number
  innerRadius?: number
  outerRadius?: number
  centerLabel?: string
  centerValue?: string
}

export function DonutChart({
  data,
  size = 140,
  innerRadius = 45,
  outerRadius = 60,
  centerLabel,
  centerValue,
}: DonutChartProps) {
  return (
    <div className="relative">
      <ResponsiveContainer width={size} height={size}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={2}
            dataKey="value"
            animationBegin={0}
            animationDuration={800}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      {(centerLabel || centerValue) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {centerValue && <span className="text-xl font-bold">{centerValue}</span>}
          {centerLabel && <span className="text-[10px] text-muted-foreground">{centerLabel}</span>}
        </div>
      )}
    </div>
  )
}

interface MiniBarChartData {
  name: string
  value: number
  target?: number
}

interface MiniBarChartProps {
  data: MiniBarChartData[]
  height?: number
  barColor?: string
  targetColor?: string
  showLabels?: boolean
}

export function MiniBarChart({
  data,
  height = 80,
  barColor = "hsl(var(--primary))",
  targetColor = "hsl(var(--muted-foreground))",
  showLabels = true,
}: MiniBarChartProps) {
  const maxValue = Math.max(...data.map((d) => Math.max(d.value, d.target || 0)), 1)

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} barGap={4}>
        {showLabels && (
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            dy={5}
          />
        )}
        <Bar
          dataKey="value"
          radius={[4, 4, 0, 0]}
          maxBarSize={32}
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.value >= (entry.target || 0) ? barColor : "hsl(var(--muted))"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

interface SparklineData {
  value: number
}

interface SparklineProps {
  data: SparklineData[]
  width?: number
  height?: number
  color?: string
  showArea?: boolean
  showDots?: boolean
}

export function Sparkline({
  data,
  width = 100,
  height = 32,
  color = "hsl(var(--primary))",
  showArea = true,
  showDots = false,
}: SparklineProps) {
  return (
    <ResponsiveContainer width={width} height={height}>
      {showArea ? (
        <AreaChart data={data}>
          <defs>
            <linearGradient id="sparklineGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill="url(#sparklineGradient)"
            dot={showDots}
            isAnimationActive={true}
          />
        </AreaChart>
      ) : (
        <LineChart data={data}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={showDots}
            isAnimationActive={true}
          />
        </LineChart>
      )}
    </ResponsiveContainer>
  )
}

interface TrendIndicatorProps {
  value: number
  previousValue: number
  format?: "percent" | "hours" | "number"
  size?: "sm" | "md"
}

export function TrendIndicator({
  value,
  previousValue,
  format = "percent",
  size = "sm",
}: TrendIndicatorProps) {
  const diff = value - previousValue
  const percentChange = previousValue > 0 ? ((diff / previousValue) * 100) : 0
  const isPositive = diff >= 0
  const isNeutral = Math.abs(percentChange) < 1

  const formatValue = () => {
    if (format === "percent") {
      return `${isPositive ? "+" : ""}${percentChange.toFixed(1)}%`
    } else if (format === "hours") {
      return `${isPositive ? "+" : ""}${diff.toFixed(1)}h`
    } else {
      return `${isPositive ? "+" : ""}${diff}`
    }
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 font-medium",
        size === "sm" ? "text-xs" : "text-sm",
        isNeutral
          ? "text-muted-foreground"
          : isPositive
          ? "text-emerald-600 dark:text-emerald-400"
          : "text-red-600 dark:text-red-400"
      )}
    >
      <span
        className={cn(
          "inline-block",
          !isNeutral && (isPositive ? "rotate-0" : "rotate-180")
        )}
      >
        {isNeutral ? "~" : "\u2191"}
      </span>
      {formatValue()}
    </span>
  )
}

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  trend?: { current: number; previous: number; format?: "percent" | "hours" | "number" }
  chart?: React.ReactNode
  icon?: React.ReactNode
  className?: string
}

export function StatCard({
  title,
  value,
  subtitle,
  trend,
  chart,
  icon,
  className,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-xl border bg-card p-4 flex flex-col",
        className
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {icon && (
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              {icon}
            </div>
          )}
          <span className="text-sm text-muted-foreground">{title}</span>
        </div>
        {trend && (
          <TrendIndicator
            value={trend.current}
            previousValue={trend.previous}
            format={trend.format}
          />
        )}
      </div>
      <div className="flex items-end justify-between flex-1">
        <div>
          <p className="text-2xl font-bold">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
        {chart && <div className="ml-4">{chart}</div>}
      </div>
    </motion.div>
  )
}
