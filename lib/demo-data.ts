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
  "us0": { id: "us0", name: "US0", code: "US0" },
  "hna": { id: "hna", name: "HNA", code: "HNA" },
  "us2": { id: "us2", name: "US2", code: "US2" },
  "spa": { id: "spa", name: "SPA", code: "SPA" },
  "lxt": { id: "lxt", name: "LXT", code: "LXT" },
}

export const DEMO_LOCATIONS_LIST = [
  {
    id: "us0",
    name: "US0",
    code: "US0",
    category: "PLANT",
    address: "1401 Antioch Church Rd, Greenville, SC 29605",
    latitude: 34.8526,
    longitude: -82.394,
    geofenceRadius: 50, // ~164 feet
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "hna",
    name: "HNA",
    code: "HNA",
    category: "OFFICE",
    address: "1 Parkway S, Greenville, SC 29615",
    latitude: 34.8447,
    longitude: -82.3987,
    geofenceRadius: 50, // ~164 feet
    isDefault: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "us2",
    name: "US2",
    code: "US2",
    category: "PLANT",
    address: "6301 US-76, Pendleton, SC 29670",
    latitude: 34.6518,
    longitude: -82.7836,
    geofenceRadius: 50, // ~164 feet
    isDefault: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "spa",
    name: "SPA",
    code: "SPA",
    category: "PLANT",
    address: "1000 International Dr, Spartanburg, SC 29303",
    latitude: 34.9285,
    longitude: -81.9571,
    geofenceRadius: 50, // ~164 feet
    isDefault: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "lxt",
    name: "LXT",
    code: "LXT",
    category: "PLANT",
    address: "2420 Two Notch Rd, Lexington, SC 29072",
    latitude: 33.9812,
    longitude: -81.2365,
    geofenceRadius: 50, // ~164 feet
    isDefault: false,
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
