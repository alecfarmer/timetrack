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

// Demo locations
export const DEMO_LOCATIONS: Record<string, { id: string; name: string; code: string | null }> = {
  "demo-1": { id: "demo-1", name: "Main Office", code: "HQ" },
  "demo-2": { id: "demo-2", name: "Downtown Branch", code: "DT1" },
  "demo-3": { id: "demo-3", name: "Warehouse", code: "WH1" },
}

export const DEMO_LOCATIONS_LIST = [
  {
    id: "demo-1",
    name: "Main Office",
    code: "HQ",
    category: "OFFICE",
    address: "123 Business Park, Suite 100",
    latitude: 40.7128,
    longitude: -74.006,
    geofenceRadius: 200,
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "demo-2",
    name: "Downtown Branch",
    code: "DT1",
    category: "OFFICE",
    address: "456 Main Street",
    latitude: 40.7580,
    longitude: -73.9855,
    geofenceRadius: 150,
    isDefault: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "demo-3",
    name: "Warehouse",
    code: "WH1",
    category: "PLANT",
    address: "789 Industrial Blvd",
    latitude: 40.6892,
    longitude: -74.0445,
    geofenceRadius: 300,
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
