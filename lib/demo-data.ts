// Shared demo data for when database isn't available
// This module provides in-memory storage for demo mode

export interface DemoEntry {
  id: string
  type: "CLOCK_IN" | "CLOCK_OUT"
  locationId: string
  timestampServer: Date
  timestampClient: Date
  gpsLatitude: number | null
  gpsLongitude: number | null
  gpsAccuracy: number | null
  notes: string | null
  location: { id: string; name: string; code: string | null }
}

// In-memory storage for demo entries
export const demoEntries: DemoEntry[] = []

// Locations
export const DEMO_LOCATIONS: Record<string, { id: string; name: string; code: string | null }> = {
  "us0": { id: "us0", name: "Michelin US0", code: "US0" },
}

export const DEMO_LOCATIONS_LIST = [
  {
    id: "us0",
    name: "Michelin US0",
    code: "US0",
    category: "PLANT",
    address: "1401 Antioch Church Rd, Greenville, SC",
    latitude: 34.8526,
    longitude: -82.394,
    geofenceRadius: 300,
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

export function addDemoEntry(entry: DemoEntry) {
  demoEntries.unshift(entry)
}

export function getDemoEntriesForToday(todayStart: Date, todayEnd: Date): DemoEntry[] {
  return demoEntries.filter(
    (e) => e.timestampServer >= todayStart && e.timestampServer <= todayEnd
  )
}
