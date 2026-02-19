"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ThemeToggle } from "@/components/theme-toggle"
import { NotificationCenter } from "@/components/notification-center"
import { RefreshButton } from "@/components/pull-to-refresh"
import { useAuth } from "@/contexts/auth-context"
import { useOrgRouter } from "@/components/org-link"
import {
  MapPin,
  Search,
  MoreHorizontal,
  AlertCircle,
  Plus,
  Building2,
  Home,
  Briefcase,
  Loader2,
  Edit3,
  Trash2,
  Star,
  Map,
  Navigation,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Location {
  id: string
  name: string
  code: string | null
  category: string
  address: string | null
  latitude: number | null
  longitude: number | null
  geofenceRadius: number
  isDefault: boolean
  userId: string | null
  orgId: string
  createdAt: string
}

interface AddressSuggestion {
  display_name: string
  lat: string
  lon: string
}

const categoryIcons: Record<string, typeof Building2> = {
  OFFICE: Building2,
  HOME: Home,
  CLIENT: Briefcase,
  OTHER: MapPin,
}

const categoryLabels: Record<string, string> = {
  OFFICE: "Office",
  HOME: "Home",
  CLIENT: "Client Site",
  OTHER: "Other",
}

export default function LocationsPage() {
  const { org, isAdmin, loading: authLoading } = useAuth()
  const router = useOrgRouter()

  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)

  // Form state
  const [formName, setFormName] = useState("")
  const [formCode, setFormCode] = useState("")
  const [formCategory, setFormCategory] = useState<string>("OFFICE")
  const [formAddress, setFormAddress] = useState("")
  const [formLatitude, setFormLatitude] = useState<number | null>(null)
  const [formLongitude, setFormLongitude] = useState<number | null>(null)
  const [formGeofenceRadius, setFormGeofenceRadius] = useState(50)
  const [formIsDefault, setFormIsDefault] = useState(false)
  const [formLoading, setFormLoading] = useState(false)

  // Address autocomplete
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [searchingAddress, setSearchingAddress] = useState(false)

  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")

  const fetchLocations = useCallback(async () => {
    try {
      const res = await fetch("/api/locations")
      if (res.ok) {
        const data = await res.json()
        // Filter to only show shared locations (admin-created)
        setLocations(data.filter((loc: Location) => loc.userId === null))
      }
    } catch (err) {
      console.error("Error fetching locations:", err)
      setError("Failed to load locations")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push("/")
      return
    }
    if (!authLoading && isAdmin) {
      fetchLocations()
    }
  }, [authLoading, isAdmin, router, fetchLocations])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchLocations()
    setRefreshing(false)
  }

  const resetForm = () => {
    setFormName("")
    setFormCode("")
    setFormCategory("OFFICE")
    setFormAddress("")
    setFormLatitude(null)
    setFormLongitude(null)
    setFormGeofenceRadius(50)
    setFormIsDefault(false)
    setEditingLocation(null)
    setAddressSuggestions([])
    setShowSuggestions(false)
  }

  const handleOpenDialog = (location?: Location) => {
    if (location) {
      setEditingLocation(location)
      setFormName(location.name)
      setFormCode(location.code || "")
      setFormCategory(location.category)
      setFormAddress(location.address || "")
      setFormLatitude(location.latitude)
      setFormLongitude(location.longitude)
      setFormGeofenceRadius(location.geofenceRadius)
      setFormIsDefault(location.isDefault)
    } else {
      resetForm()
    }
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    resetForm()
  }

  const searchAddress = useCallback(async (query: string) => {
    if (query.length < 3) {
      setAddressSuggestions([])
      return
    }

    setSearchingAddress(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`,
        { headers: { "User-Agent": "OnSite TimeTrack" } }
      )
      if (res.ok) {
        const data = await res.json()
        setAddressSuggestions(data)
        setShowSuggestions(true)
      }
    } catch (err) {
      console.error("Address search error:", err)
    } finally {
      setSearchingAddress(false)
    }
  }, [])

  const handleAddressChange = (value: string) => {
    setFormAddress(value)
    // Debounce the search
    const timer = setTimeout(() => searchAddress(value), 300)
    return () => clearTimeout(timer)
  }

  const handleSelectAddress = (suggestion: AddressSuggestion) => {
    setFormAddress(suggestion.display_name)
    setFormLatitude(parseFloat(suggestion.lat))
    setFormLongitude(parseFloat(suggestion.lon))
    setShowSuggestions(false)
    setAddressSuggestions([])
  }

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser")
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormLatitude(position.coords.latitude)
        setFormLongitude(position.coords.longitude)
      },
      (err) => {
        setError(`Failed to get location: ${err.message}`)
      }
    )
  }

  const handleSubmit = async () => {
    if (!formName.trim()) {
      setError("Location name is required")
      return
    }

    setFormLoading(true)
    setError(null)

    try {
      if (editingLocation) {
        // Update existing location
        const res = await fetch("/api/locations", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingLocation.id,
            name: formName.trim(),
            code: formCode.trim() || null,
            address: formAddress.trim() || null,
            latitude: formLatitude,
            longitude: formLongitude,
            geofenceRadius: formGeofenceRadius,
          }),
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || "Failed to update location")
        }
      } else {
        // Create new location
        const res = await fetch("/api/locations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formName.trim(),
            code: formCode.trim() || null,
            category: formCategory,
            address: formAddress.trim() || null,
            latitude: formLatitude,
            longitude: formLongitude,
            geofenceRadius: formGeofenceRadius,
            isDefault: formIsDefault,
          }),
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || "Failed to create location")
        }
      }

      await fetchLocations()
      handleCloseDialog()
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this location? This action cannot be undone.")) return

    try {
      const res = await fetch(`/api/locations?id=${id}`, { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to delete location")
      }
      await fetchLocations()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete location")
    }
  }

  const filteredLocations = useMemo(() => {
    return locations.filter((location) => {
      const matchesSearch =
        searchQuery === "" ||
        location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        location.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        location.address?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesCategory =
        categoryFilter === "all" || location.category === categoryFilter

      return matchesSearch && matchesCategory
    })
  }, [locations, searchQuery, categoryFilter])

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          </div>
          <p className="text-muted-foreground font-medium">Loading locations...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <motion.div
      className="flex flex-col min-h-screen bg-background"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Premium Dark Hero Header */}
      <div className="hidden lg:block relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/20 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent" />

        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
            backgroundSize: "32px 32px",
          }}
        />

        <header className="relative z-10 safe-area-pt">
          <div className="flex items-center justify-between px-4 h-14 max-w-6xl mx-auto lg:px-8">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
                <MapPin className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white">Locations</h1>
                {org && <p className="text-xs text-white/60">{org.orgName}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleOpenDialog()}
                className="gap-2 text-white/70 hover:text-white hover:bg-white/10"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Location</span>
              </Button>
              <RefreshButton
                onRefresh={handleRefresh}
                refreshing={refreshing}
                className="text-white/70 hover:text-white hover:bg-white/10"
              />
              <ThemeToggle />
              <NotificationCenter />
            </div>
          </div>
        </header>

        {/* Stats Cards in Hero */}
        <div className="relative z-10 px-4 pt-4 pb-6 max-w-6xl mx-auto lg:px-8">
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-white/10 rounded-xl p-4 border border-white/10 text-center">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center mx-auto mb-2">
                <MapPin className="h-5 w-5 text-blue-400" />
              </div>
              <p className="text-2xl font-bold text-white">{locations.length}</p>
              <p className="text-xs text-white/60 mt-0.5">Total</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4 border border-white/10 text-center">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-2">
                <Building2 className="h-5 w-5 text-emerald-400" />
              </div>
              <p className="text-2xl font-bold text-white">
                {locations.filter((l) => l.category === "OFFICE").length}
              </p>
              <p className="text-xs text-white/60 mt-0.5">Offices</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4 border border-white/10 text-center">
              <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center mx-auto mb-2">
                <Briefcase className="h-5 w-5 text-violet-400" />
              </div>
              <p className="text-2xl font-bold text-white">
                {locations.filter((l) => l.category === "CLIENT").length}
              </p>
              <p className="text-xs text-white/60 mt-0.5">Client Sites</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4 border border-white/10 text-center">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center mx-auto mb-2">
                <Star className="h-5 w-5 text-amber-400" />
              </div>
              <p className="text-2xl font-bold text-white">
                {locations.filter((l) => l.isDefault).length}
              </p>
              <p className="text-xs text-white/60 mt-0.5">Default</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 pb-24 lg:pb-8 pt-6">
        <div className="max-w-6xl mx-auto px-4 lg:px-8 space-y-6">
          {/* Error Alert */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20"
              >
                <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
                <p className="text-sm text-destructive flex-1">{error}</p>
                <Button variant="ghost" size="sm" onClick={() => setError(null)}>
                  Dismiss
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search locations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="flex gap-2">
                  <Select
                    value={categoryFilter}
                    onValueChange={(v) => setCategoryFilter(v)}
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="OFFICE">Office</SelectItem>
                      <SelectItem value="CLIENT">Client Site</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Locations List */}
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredLocations.length > 0 ? (
                filteredLocations.map((location) => {
                  const CategoryIcon = categoryIcons[location.category] || MapPin

                  return (
                    <motion.div
                      key={location.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <div className="flex items-center gap-4 p-4 rounded-xl border bg-card hover:bg-accent/50 transition-colors">
                        {/* Icon */}
                        <div
                          className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center",
                            location.isDefault
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          <CategoryIcon className="h-5 w-5" />
                        </div>

                        {/* Location info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate">{location.name}</p>
                            {location.code && (
                              <Badge variant="secondary" className="text-[10px] px-1.5">
                                {location.code}
                              </Badge>
                            )}
                            {location.isDefault && (
                              <Badge className="text-[10px] px-1.5 bg-amber-500 text-white border-0">
                                Default
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-[10px] px-1.5">
                              {categoryLabels[location.category] || location.category}
                            </Badge>
                          </div>
                          {location.address && (
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              {location.address}
                            </p>
                          )}
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            {location.latitude && location.longitude && (
                              <span className="flex items-center gap-1">
                                <Navigation className="h-3 w-3" />
                                {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Map className="h-3 w-3" />
                              {location.geofenceRadius}m radius
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleOpenDialog(location)}>
                              <Edit3 className="h-4 w-4 mr-2" />
                              Edit Location
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => handleDelete(location.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Location
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </motion.div>
                  )
                })
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <MapPin className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium mb-1">No locations found</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {searchQuery || categoryFilter !== "all"
                      ? "Try adjusting your search or filters"
                      : "Add your first location to get started"}
                  </p>
                  {!searchQuery && categoryFilter === "all" && (
                    <Button onClick={() => handleOpenDialog()}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Location
                    </Button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Add/Edit Location Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => !open && handleCloseDialog()}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingLocation ? "Edit Location" : "Add New Location"}
            </DialogTitle>
            <DialogDescription>
              {editingLocation
                ? "Update the location details below."
                : "Create a new shared location for your organization."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name *</label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g., Main Office"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Code</label>
                <Input
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  placeholder="e.g., HQ"
                />
              </div>
            </div>

            {!editingLocation && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select value={formCategory} onValueChange={setFormCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OFFICE">Office</SelectItem>
                    <SelectItem value="CLIENT">Client Site</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2 relative">
              <label className="text-sm font-medium">Address</label>
              <div className="relative">
                <Input
                  value={formAddress}
                  onChange={(e) => handleAddressChange(e.target.value)}
                  placeholder="Start typing to search..."
                  onFocus={() => addressSuggestions.length > 0 && setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                />
                {searchingAddress && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              {showSuggestions && addressSuggestions.length > 0 && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg max-h-48 overflow-y-auto">
                  {addressSuggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
                      onClick={() => handleSelectAddress(suggestion)}
                    >
                      {suggestion.display_name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Coordinates</label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleGetCurrentLocation}
                  className="text-xs h-7"
                >
                  <Navigation className="h-3 w-3 mr-1" />
                  Use Current
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="number"
                  step="any"
                  value={formLatitude ?? ""}
                  onChange={(e) =>
                    setFormLatitude(e.target.value ? parseFloat(e.target.value) : null)
                  }
                  placeholder="Latitude"
                />
                <Input
                  type="number"
                  step="any"
                  value={formLongitude ?? ""}
                  onChange={(e) =>
                    setFormLongitude(e.target.value ? parseFloat(e.target.value) : null)
                  }
                  placeholder="Longitude"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Geofence Radius</label>
                <span className="text-sm text-muted-foreground">{formGeofenceRadius}m</span>
              </div>
              <Slider
                value={[formGeofenceRadius]}
                onValueChange={([value]) => setFormGeofenceRadius(value)}
                min={10}
                max={500}
                step={10}
              />
              <p className="text-xs text-muted-foreground">
                Employees must be within this radius to clock in at this location.
              </p>
            </div>

            {!editingLocation && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={formIsDefault}
                  onChange={(e) => setFormIsDefault(e.target.checked)}
                  className="rounded border-input"
                />
                <label htmlFor="isDefault" className="text-sm">
                  Set as default location
                </label>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={formLoading || !formName.trim()}>
                {formLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {editingLocation ? "Save Changes" : "Create Location"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
