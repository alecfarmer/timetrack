"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Target,
  Zap,
  AlertTriangle,
} from "lucide-react"

// ─────────────────────────────────────────────────────────────────────────────
// METRIC CARD - Enterprise-style stat card with comparison
// ─────────────────────────────────────────────────────────────────────────────

interface MetricCardProps {
  label: string
  value: string | number
  subValue?: string
  previousValue?: number
  currentValue?: number
  icon?: React.ReactNode
  trend?: "up" | "down" | "neutral"
  trendLabel?: string
  color?: "default" | "success" | "warning" | "danger" | "info"
  size?: "sm" | "md" | "lg"
  className?: string
}

const colorMap = {
  default: "text-foreground",
  success: "text-emerald-600 dark:text-emerald-400",
  warning: "text-amber-600 dark:text-amber-400",
  danger: "text-red-600 dark:text-red-400",
  info: "text-blue-600 dark:text-blue-400",
}

const bgColorMap = {
  default: "bg-muted/50",
  success: "bg-emerald-500/10",
  warning: "bg-amber-500/10",
  danger: "bg-red-500/10",
  info: "bg-blue-500/10",
}

export function MetricCard({
  label,
  value,
  subValue,
  previousValue,
  currentValue,
  icon,
  trend,
  trendLabel,
  color = "default",
  size = "md",
  className,
}: MetricCardProps) {
  const percentChange = previousValue && currentValue
    ? ((currentValue - previousValue) / previousValue) * 100
    : null

  const actualTrend = trend || (percentChange ? (percentChange > 0 ? "up" : percentChange < 0 ? "down" : "neutral") : undefined)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-2xl border bg-card p-4",
        size === "sm" && "p-3",
        size === "lg" && "p-6",
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className={cn(
            "text-muted-foreground font-medium",
            size === "sm" ? "text-xs" : "text-sm"
          )}>
            {label}
          </p>
          <p className={cn(
            "font-bold tracking-tight mt-1",
            size === "sm" ? "text-xl" : size === "lg" ? "text-4xl" : "text-2xl",
            colorMap[color]
          )}>
            {value}
          </p>
          {subValue && (
            <p className="text-xs text-muted-foreground mt-1">{subValue}</p>
          )}
          {(actualTrend || trendLabel) && (
            <div className={cn(
              "flex items-center gap-1 mt-2",
              actualTrend === "up" && "text-emerald-600 dark:text-emerald-400",
              actualTrend === "down" && "text-red-600 dark:text-red-400",
              actualTrend === "neutral" && "text-muted-foreground"
            )}>
              {actualTrend === "up" && <ArrowUpRight className="h-3.5 w-3.5" />}
              {actualTrend === "down" && <ArrowDownRight className="h-3.5 w-3.5" />}
              {actualTrend === "neutral" && <Minus className="h-3.5 w-3.5" />}
              <span className="text-xs font-medium">
                {percentChange !== null && `${percentChange > 0 ? "+" : ""}${percentChange.toFixed(1)}%`}
                {trendLabel && ` ${trendLabel}`}
              </span>
            </div>
          )}
        </div>
        {icon && (
          <div className={cn("p-3 rounded-xl", bgColorMap[color])}>
            {icon}
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MINI SPARKLINE - Inline trend visualization
// ─────────────────────────────────────────────────────────────────────────────

interface SparklineProps {
  data: number[]
  width?: number
  height?: number
  color?: string
  showArea?: boolean
  className?: string
}

export function Sparkline({
  data,
  width = 80,
  height = 24,
  color = "hsl(var(--primary))",
  showArea = true,
  className,
}: SparklineProps) {
  if (data.length < 2) return null

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const padding = 2

  const points = data.map((val, i) => ({
    x: padding + (i / (data.length - 1)) * (width - padding * 2),
    y: height - padding - ((val - min) / range) * (height - padding * 2),
  }))

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`

  return (
    <svg width={width} height={height} className={className}>
      {showArea && (
        <path d={areaPath} fill={color} fillOpacity={0.1} />
      )}
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={points[points.length - 1].x}
        cy={points[points.length - 1].y}
        r={2.5}
        fill={color}
      />
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PROGRESS RING - Circular progress with label
// ─────────────────────────────────────────────────────────────────────────────

interface ProgressRingProps {
  value: number
  max?: number
  size?: number
  strokeWidth?: number
  color?: string
  bgColor?: string
  label?: React.ReactNode
  sublabel?: string
  showPercent?: boolean
  className?: string
}

export function ProgressRing({
  value,
  max = 100,
  size = 64,
  strokeWidth = 6,
  color = "hsl(var(--primary))",
  bgColor = "hsl(var(--muted))",
  label,
  sublabel,
  showPercent = false,
  className,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = Math.min(100, (value / max) * 100)
  const offset = circumference - (progress / 100) * circumference

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={bgColor}
          strokeWidth={strokeWidth}
          opacity={0.3}
        />
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
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {label !== undefined ? (
          <>
            <span className="text-lg font-bold leading-none">{label}</span>
            {sublabel && <span className="text-[9px] text-muted-foreground uppercase tracking-wide mt-0.5">{sublabel}</span>}
          </>
        ) : showPercent && (
          <span className="text-sm font-bold">{Math.round(progress)}%</span>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// HORIZONTAL BAR CHART - Simple horizontal bars
// ─────────────────────────────────────────────────────────────────────────────

interface HBarData {
  label: string
  value: number
  color?: string
  subLabel?: string
}

interface HorizontalBarChartProps {
  data: HBarData[]
  maxValue?: number
  showValues?: boolean
  formatValue?: (v: number) => string
  className?: string
}

export function HorizontalBarChart({
  data,
  maxValue,
  showValues = true,
  formatValue = (v) => String(v),
  className,
}: HorizontalBarChartProps) {
  const max = maxValue || Math.max(...data.map((d) => d.value), 1)

  return (
    <div className={cn("space-y-3", className)}>
      {data.map((item, i) => (
        <div key={i}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium truncate">{item.label}</span>
            {showValues && (
              <span className="text-sm text-muted-foreground tabular-nums">
                {formatValue(item.value)}
              </span>
            )}
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: item.color || "hsl(var(--primary))" }}
              initial={{ width: 0 }}
              animate={{ width: `${(item.value / max) * 100}%` }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
            />
          </div>
          {item.subLabel && (
            <p className="text-xs text-muted-foreground mt-0.5">{item.subLabel}</p>
          )}
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// DONUT CHART - Simple pie/donut visualization
// ─────────────────────────────────────────────────────────────────────────────

interface DonutSegment {
  label: string
  value: number
  color: string
}

interface DonutChartProps {
  data: DonutSegment[]
  size?: number
  strokeWidth?: number
  centerLabel?: React.ReactNode
  centerSubLabel?: string
  showLegend?: boolean
  className?: string
}

export function DonutChart({
  data,
  size = 120,
  strokeWidth = 20,
  centerLabel,
  centerSubLabel,
  showLegend = true,
  className,
}: DonutChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0)
  if (total === 0) return null

  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius

  let currentOffset = 0

  return (
    <div className={cn("flex items-center gap-4", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {data.map((segment, i) => {
            const segmentLength = (segment.value / total) * circumference
            const offset = currentOffset
            currentOffset += segmentLength

            return (
              <motion.circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={segment.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${segmentLength} ${circumference - segmentLength}`}
                strokeDashoffset={-offset}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.1 }}
              />
            )
          })}
        </svg>
        {(centerLabel || centerSubLabel) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {centerLabel && <span className="text-xl font-bold">{centerLabel}</span>}
            {centerSubLabel && <span className="text-xs text-muted-foreground">{centerSubLabel}</span>}
          </div>
        )}
      </div>
      {showLegend && (
        <div className="space-y-2">
          {data.map((segment, i) => (
            <div key={i} className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: segment.color }}
              />
              <span className="text-sm truncate">{segment.label}</span>
              <span className="text-sm text-muted-foreground tabular-nums ml-auto">
                {Math.round((segment.value / total) * 100)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// WEEKLY HEATMAP - 7-day activity heatmap
// ─────────────────────────────────────────────────────────────────────────────

interface HeatmapDay {
  label: string
  value: number
  date?: string
}

interface WeeklyHeatmapProps {
  data: HeatmapDay[]
  maxValue?: number
  colorScale?: string[]
  className?: string
}

export function WeeklyHeatmap({
  data,
  maxValue,
  colorScale = [
    "hsl(var(--muted))",
    "hsl(142 76% 90%)",
    "hsl(142 76% 75%)",
    "hsl(142 76% 55%)",
    "hsl(142 76% 36%)",
  ],
  className,
}: WeeklyHeatmapProps) {
  const max = maxValue || Math.max(...data.map((d) => d.value), 1)

  const getColor = (value: number) => {
    if (value === 0) return colorScale[0]
    const index = Math.min(
      colorScale.length - 1,
      Math.ceil((value / max) * (colorScale.length - 1))
    )
    return colorScale[index]
  }

  return (
    <div className={cn("flex gap-1.5", className)}>
      {data.map((day, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.03 }}
          className="flex flex-col items-center gap-1"
        >
          <span className="text-[10px] text-muted-foreground uppercase">
            {day.label.slice(0, 1)}
          </span>
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium transition-colors"
            style={{ backgroundColor: getColor(day.value) }}
            title={`${day.label}: ${day.value}h`}
          >
            {day.value > 0 && (
              <span className={cn(
                day.value >= max * 0.5 ? "text-white" : "text-foreground"
              )}>
                {day.value}
              </span>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCTIVITY SCORE - Circular gauge with score
// ─────────────────────────────────────────────────────────────────────────────

interface ProductivityScoreProps {
  score: number
  label?: string
  size?: "sm" | "md" | "lg"
  className?: string
}

export function ProductivityScore({
  score,
  label = "Productivity",
  size = "md",
  className,
}: ProductivityScoreProps) {
  const getColor = () => {
    if (score >= 80) return { ring: "#10b981", bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400" }
    if (score >= 60) return { ring: "#f59e0b", bg: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-400" }
    return { ring: "#ef4444", bg: "bg-red-500/10", text: "text-red-600 dark:text-red-400" }
  }

  const colors = getColor()
  const dimensions = {
    sm: { size: 48, stroke: 4, fontSize: "text-sm" },
    md: { size: 72, stroke: 5, fontSize: "text-xl" },
    lg: { size: 96, stroke: 6, fontSize: "text-2xl" },
  }[size]

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <ProgressRing
        value={score}
        max={100}
        size={dimensions.size}
        strokeWidth={dimensions.stroke}
        color={colors.ring}
        label={<span className={cn(dimensions.fontSize, colors.text)}>{score}</span>}
      />
      <span className="text-xs text-muted-foreground font-medium">{label}</span>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// BURNOUT INDICATOR - Risk assessment visualization
// ─────────────────────────────────────────────────────────────────────────────

interface BurnoutIndicatorProps {
  riskLevel: "low" | "moderate" | "high"
  factors?: string[]
  className?: string
}

export function BurnoutIndicator({
  riskLevel,
  factors = [],
  className,
}: BurnoutIndicatorProps) {
  const config = {
    low: {
      label: "Low Risk",
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      icon: <Zap className="h-4 w-4" />,
    },
    moderate: {
      label: "Moderate",
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      icon: <AlertTriangle className="h-4 w-4" />,
    },
    high: {
      label: "High Risk",
      color: "text-red-600 dark:text-red-400",
      bg: "bg-red-500/10",
      border: "border-red-500/20",
      icon: <AlertTriangle className="h-4 w-4" />,
    },
  }[riskLevel]

  return (
    <div className={cn(
      "rounded-xl p-4 border",
      config.bg,
      config.border,
      className
    )}>
      <div className="flex items-center gap-2 mb-2">
        <span className={config.color}>{config.icon}</span>
        <span className={cn("font-semibold", config.color)}>{config.label}</span>
      </div>
      {factors.length > 0 && (
        <ul className="text-xs text-muted-foreground space-y-1">
          {factors.map((f, i) => (
            <li key={i} className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-current" />
              {f}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TIME COMPARISON - Before/after or period comparison
// ─────────────────────────────────────────────────────────────────────────────

interface TimeComparisonProps {
  current: { label: string; value: number }
  previous: { label: string; value: number }
  formatValue?: (v: number) => string
  className?: string
}

export function TimeComparison({
  current,
  previous,
  formatValue = (v) => `${v}h`,
  className,
}: TimeComparisonProps) {
  const diff = current.value - previous.value
  const percentChange = previous.value > 0 ? (diff / previous.value) * 100 : 0

  return (
    <div className={cn("flex items-center gap-6", className)}>
      <div className="text-center">
        <p className="text-2xl font-bold">{formatValue(current.value)}</p>
        <p className="text-xs text-muted-foreground">{current.label}</p>
      </div>
      <div className={cn(
        "flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium",
        diff >= 0 ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"
      )}>
        {diff >= 0 ? (
          <TrendingUp className="h-4 w-4" />
        ) : (
          <TrendingDown className="h-4 w-4" />
        )}
        {percentChange > 0 ? "+" : ""}{percentChange.toFixed(1)}%
      </div>
      <div className="text-center opacity-60">
        <p className="text-lg font-semibold">{formatValue(previous.value)}</p>
        <p className="text-xs text-muted-foreground">{previous.label}</p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// STAT ROW - Inline stat with icon
// ─────────────────────────────────────────────────────────────────────────────

interface StatRowProps {
  icon: React.ReactNode
  label: string
  value: string | number
  subValue?: string
  trend?: "up" | "down" | "neutral"
  className?: string
}

export function StatRow({
  icon,
  label,
  value,
  subValue,
  trend,
  className,
}: StatRowProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="w-9 h-9 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
      <div className="text-right">
        <p className="font-semibold tabular-nums">{value}</p>
        {subValue && (
          <p className={cn(
            "text-xs",
            trend === "up" && "text-emerald-600",
            trend === "down" && "text-red-600",
            !trend && "text-muted-foreground"
          )}>
            {subValue}
          </p>
        )}
      </div>
    </div>
  )
}
