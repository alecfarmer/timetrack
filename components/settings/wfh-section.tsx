"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Home,
  Navigation,
  Loader2,
  Check,
  Pencil,
  Search,
  MapPin,
} from "lucide-react"

interface WfhLocation {
  id: string
  address: string | null
  latitude: number
  longitude: number
  geofenceRadius: number
}

export function WfhSection() {
  const [wfhLocation, setWfhLocation] = useState<WfhLocation | null>(null)
  const [wfhLoading, setWfhLoading] = useState(true)
  const [wfhEditing, setWfhEditing] = useState(false)
  const [wfhAddress, setWfhAddress] = useState("")
  const [wfhLat, setWfhLat] = useState("")
  const [wfhLng, setWfhLng] = useState("")
  const [wfhSaving, setWfhSaving] = useState(false)
  const [wfhDetecting, setWfhDetecting] = useState(false)
  const [wfhGeocoding, setWfhGeocoding] = useState(false)
  const [wfhError, setWfhError] = useState<string | null>(null)
  const [wfhSuccess, setWfhSuccess] = useState(false)

  useEffect(() => {
    const fetchWfh = async () => {
      try {
        const res = await fetch("/api/locations")
        if (res.ok) {
          const locations = await res.json()
          const wfh = locations.find((l: { category: string }) => l.category === "HOME")
          if (wfh) {
            setWfhLocation(wfh)
            setWfhAddress(wfh.address || "")
            setWfhLat(wfh.latitude.toString())
            setWfhLng(wfh.longitude.toString())
          }
        }
      } catch {
        // silently fail
      }
      setWfhLoading(false)
    }
    fetchWfh()
  }, [])

  const detectHomeLocation = () => {
    setWfhDetecting(true)
    setWfhError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setWfhLat(pos.coords.latitude.toFixed(6))
        setWfhLng(pos.coords.longitude.toFixed(6))
        setWfhDetecting(false)
      },
      () => {
        setWfhError("Could not detect location. Enter coordinates manually.")
        setWfhDetecting(false)
      },
      { enableHighAccuracy: true, timeout: 15000 }
    )
  }

  const geocodeAddress = async () => {
    if (!wfhAddress.trim() || wfhAddress.trim().length < 3) {
      setWfhError("Enter a valid address to look up")
      return
    }
    setWfhGeocoding(true)
    setWfhError(null)
    try {
      const res = await fetch(`/api/geocode?address=${encodeURIComponent(wfhAddress.trim())}`)
      const data = await res.json()
      if (!res.ok) {
        setWfhError(data.error || "Could not find address")
      } else {
        setWfhLat(data.latitude.toFixed(6))
        setWfhLng(data.longitude.toFixed(6))
      }
    } catch {
      setWfhError("Failed to look up address")
    }
    setWfhGeocoding(false)
  }

  const handleWfhSave = async () => {
    if (!wfhLat || !wfhLng) {
      setWfhError("Latitude and longitude are required")
      return
    }
    setWfhSaving(true)
    setWfhError(null)
    try {
      if (wfhLocation) {
        const res = await fetch("/api/locations", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: wfhLocation.id,
            address: wfhAddress,
            latitude: parseFloat(wfhLat),
            longitude: parseFloat(wfhLng),
          }),
        })
        if (!res.ok) throw new Error("Failed to update")
        const updated = await res.json()
        setWfhLocation(updated)
      } else {
        const res = await fetch("/api/locations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "WFH",
            code: "WFH",
            category: "HOME",
            address: wfhAddress,
            latitude: parseFloat(wfhLat),
            longitude: parseFloat(wfhLng),
            geofenceRadius: 200,
            isDefault: false,
          }),
        })
        if (!res.ok) throw new Error("Failed to create")
        const created = await res.json()
        setWfhLocation(created)
      }
      setWfhEditing(false)
      setWfhSuccess(true)
      setTimeout(() => setWfhSuccess(false), 3000)
    } catch {
      setWfhError("Failed to save WFH location")
    }
    setWfhSaving(false)
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Home className="h-5 w-5 text-primary" />
          Work From Home
        </CardTitle>
        <CardDescription>Set your home address for WFH clock-ins</CardDescription>
      </CardHeader>
      <CardContent>
        {wfhLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading...
          </div>
        ) : wfhEditing ? (
          <div className="space-y-3">
            <div>
              <Label htmlFor="settingsWfhAddress" className="text-sm">Home Address</Label>
              <div className="flex gap-2 mt-1.5">
                <Input
                  id="settingsWfhAddress"
                  placeholder="123 Main St, City, State ZIP"
                  value={wfhAddress}
                  onChange={(e) => setWfhAddress(e.target.value)}
                  className="flex-1"
                  onKeyDown={(e) => e.key === "Enter" && geocodeAddress()}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={geocodeAddress}
                  disabled={wfhGeocoding || !wfhAddress.trim()}
                  className="flex-shrink-0"
                  title="Look up coordinates from address"
                >
                  {wfhGeocoding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Enter address and click search to auto-fill coordinates</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="settingsWfhLat" className="text-sm">Latitude</Label>
                <Input id="settingsWfhLat" type="number" step="any" placeholder="34.7373" value={wfhLat} onChange={(e) => setWfhLat(e.target.value)} className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="settingsWfhLng" className="text-sm">Longitude</Label>
                <Input id="settingsWfhLng" type="number" step="any" placeholder="-82.2543" value={wfhLng} onChange={(e) => setWfhLng(e.target.value)} className="mt-1.5" />
              </div>
            </div>
            <Button variant="outline" className="w-full gap-2" onClick={detectHomeLocation} disabled={wfhDetecting}>
              {wfhDetecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
              {wfhDetecting ? "Detecting..." : "Use My Current Location"}
            </Button>
            {wfhError && <p className="text-sm text-destructive">{wfhError}</p>}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setWfhEditing(false)}>Cancel</Button>
              <Button className="flex-1 gap-2" onClick={handleWfhSave} disabled={wfhSaving}>
                {wfhSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                {wfhSaving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        ) : wfhLocation ? (
          <div className="space-y-3">
            <div className="flex items-start justify-between bg-muted/50 rounded-xl p-4">
              <div>
                <p className="font-medium text-sm">Home Office</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {wfhLocation.address || `${wfhLocation.latitude.toFixed(4)}, ${wfhLocation.longitude.toFixed(4)}`}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Geofence: {wfhLocation.geofenceRadius}m radius</p>
              </div>
              <Button variant="ghost" size="icon" className="rounded-lg" onClick={() => setWfhEditing(true)}>
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
            {wfhSuccess && (
              <div className="flex items-center gap-2 text-sm text-success">
                <Check className="h-4 w-4" />
                WFH location updated
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-xl bg-muted mx-auto mb-3 flex items-center justify-center">
                <Home className="h-6 w-6 text-muted-foreground/40" />
              </div>
              <p className="text-sm text-muted-foreground">No home location set</p>
              <p className="text-xs text-muted-foreground/60 mt-0.5">Add your home address to clock in when working from home</p>
            </div>
            <Button className="w-full rounded-xl gap-2" onClick={() => setWfhEditing(true)}>
              <MapPin className="h-4 w-4" />
              Set Up WFH Location
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
