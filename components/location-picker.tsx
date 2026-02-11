"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MapPin, Check, ChevronDown, Building2, Home, Signal, Navigation, CheckCircle2 } from "lucide-react"
import { calculateDistance, formatDistance } from "@/lib/geo"
import { cn } from "@/lib/utils"

interface Location {
  id: string
  name: string
  code?: string | null
  category?: string
  latitude: number
  longitude: number
  geofenceRadius: number
}

interface LocationPickerProps {
  locations: Location[]
  selectedId: string
  userPosition?: { latitude: number; longitude: number } | null
  onSelect: (locationId: string) => void
  className?: string
}

function getCategoryIcon(category?: string) {
  switch (category) {
    case "HOME":
      return Home
    case "OFFICE":
      return Building2
    default:
      return Building2
  }
}

function getCategoryLabel(category?: string) {
  switch (category) {
    case "HOME":
      return "Home"
    case "OFFICE":
      return "Office"
    default:
      return "Location"
  }
}

export function LocationPicker({
  locations,
  selectedId,
  userPosition,
  onSelect,
  className,
}: LocationPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [locationsWithDistance, setLocationsWithDistance] = useState<
    (Location & { distance?: number; isWithinGeofence?: boolean })[]
  >([])
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (userPosition) {
      const withDistance = locations.map((loc) => {
        const distance = calculateDistance(
          userPosition.latitude,
          userPosition.longitude,
          loc.latitude,
          loc.longitude
        )
        return {
          ...loc,
          distance,
          isWithinGeofence: distance <= Math.max(loc.geofenceRadius, 200),
        }
      })
      withDistance.sort((a, b) => (a.distance || 0) - (b.distance || 0))
      setLocationsWithDistance(withDistance)
    } else {
      setLocationsWithDistance(locations)
    }
  }, [locations, userPosition])

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  const selected = locationsWithDistance.find((l) => l.id === selectedId) || locationsWithDistance[0]
  const SelectedIcon = selected ? getCategoryIcon(selected.category) : Building2

  // Group by on-site / off-site
  const onSite = locationsWithDistance.filter((l) => l.isWithinGeofence)
  const offSite = locationsWithDistance.filter((l) => !l.isWithinGeofence)

  return (
    <div ref={dropdownRef} className={cn("relative", className)}>
      {/* Trigger Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center gap-3 rounded-2xl border transition-all",
          "hover:border-primary/50 p-3.5",
          isOpen
            ? "border-primary bg-primary/5 ring-1 ring-primary/20"
            : selected?.isWithinGeofence
            ? "border-emerald-500/30 bg-emerald-500/5"
            : "border-border bg-card"
        )}
        whileTap={{ scale: 0.99 }}
      >
        {/* Location icon with status */}
        <div
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
            selected?.isWithinGeofence
              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
              : "bg-muted text-muted-foreground"
          )}
        >
          <SelectedIcon className="h-5 w-5" />
        </div>

        {/* Selected info */}
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm truncate">
              {selected?.name || "Select location"}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            {selected?.isWithinGeofence ? (
              <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3 w-3" />
                In range
                {selected.distance !== undefined && (
                  <span className="text-muted-foreground font-normal ml-1">
                    {formatDistance(selected.distance)}
                  </span>
                )}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">
                {selected?.distance !== undefined
                  ? `${formatDistance(selected.distance)} away`
                  : getCategoryLabel(selected?.category)}
              </span>
            )}
          </div>
        </div>

        {/* Chevron */}
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-muted-foreground"
        >
          <ChevronDown className="h-4 w-4" />
        </motion.div>
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={cn(
              "absolute z-50 left-0 right-0 mt-2",
              "bg-card border border-border rounded-2xl shadow-xl",
              "overflow-hidden max-h-[320px] overflow-y-auto no-scrollbar"
            )}
          >
            {/* On-site section */}
            {onSite.length > 0 && (
              <div>
                <div className="px-4 pt-3 pb-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <Navigation className="h-3 w-3" />
                    In Range
                  </p>
                </div>
                {onSite.map((location) => (
                  <LocationOption
                    key={location.id}
                    location={location}
                    isSelected={location.id === selectedId}
                    onSelect={() => {
                      onSelect(location.id)
                      setIsOpen(false)
                    }}
                  />
                ))}
              </div>
            )}

            {/* Divider */}
            {onSite.length > 0 && offSite.length > 0 && (
              <div className="border-t mx-4 my-1" />
            )}

            {/* Off-site section */}
            {offSite.length > 0 && (
              <div>
                <div className="px-4 pt-2 pb-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <MapPin className="h-3 w-3" />
                    Other Locations
                  </p>
                </div>
                {offSite.map((location) => (
                  <LocationOption
                    key={location.id}
                    location={location}
                    isSelected={location.id === selectedId}
                    onSelect={() => {
                      onSelect(location.id)
                      setIsOpen(false)
                    }}
                  />
                ))}
              </div>
            )}

            <div className="h-2" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function LocationOption({
  location,
  isSelected,
  onSelect,
}: {
  location: Location & { distance?: number; isWithinGeofence?: boolean }
  isSelected: boolean
  onSelect: () => void
}) {
  const Icon = getCategoryIcon(location.category)
  const categoryLabel = getCategoryLabel(location.category)

  return (
    <motion.button
      onClick={onSelect}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 transition-colors",
        "hover:bg-muted/50 active:bg-muted",
        isSelected && "bg-primary/5"
      )}
      whileTap={{ scale: 0.98 }}
    >
      {/* Icon */}
      <div
        className={cn(
          "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold",
          isSelected
            ? "bg-primary text-primary-foreground"
            : location.isWithinGeofence
            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
            : "bg-muted text-muted-foreground"
        )}
      >
        {location.code ? (
          <span className="text-[10px]">{location.code}</span>
        ) : (
          <Icon className="h-4 w-4" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center gap-1.5">
          <span className={cn("text-sm font-medium truncate", isSelected && "text-primary")}>
            {location.name}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span>{categoryLabel}</span>
          {location.distance !== undefined && (
            <>
              <span className="text-muted-foreground/40">&middot;</span>
              <span className={location.isWithinGeofence ? "text-emerald-600 dark:text-emerald-400 font-medium" : ""}>
                {formatDistance(location.distance)}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Selected check */}
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0"
        >
          <Check className="h-3.5 w-3.5 text-primary-foreground" />
        </motion.div>
      )}

      {/* In-range indicator for non-selected items */}
      {!isSelected && location.isWithinGeofence && (
        <Signal className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
      )}
    </motion.button>
  )
}
