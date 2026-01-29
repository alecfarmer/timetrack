// IndexedDB-based offline queue for clock in/out actions
const DB_NAME = "onsite-offline"
const DB_VERSION = 1
const STORE_NAME = "pending-entries"

interface PendingEntry {
  id: string
  type: "CLOCK_IN" | "CLOCK_OUT"
  locationId: string
  timestampClient: string
  gpsLatitude: number | null
  gpsLongitude: number | null
  gpsAccuracy: number | null
  createdAt: string
  retries: number
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" })
      }
    }
  })
}

export async function queueOfflineEntry(entry: Omit<PendingEntry, "id" | "createdAt" | "retries">): Promise<string> {
  const db = await openDB()
  const id = `offline_${Date.now()}_${Math.random().toString(36).slice(2)}`
  const record: PendingEntry = {
    ...entry,
    id,
    createdAt: new Date().toISOString(),
    retries: 0,
  }

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite")
    const store = tx.objectStore(STORE_NAME)
    const request = store.add(record)
    request.onsuccess = () => resolve(id)
    request.onerror = () => reject(request.error)
  })
}

export async function getPendingEntries(): Promise<PendingEntry[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly")
    const store = tx.objectStore(STORE_NAME)
    const request = store.getAll()
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function removePendingEntry(id: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite")
    const store = tx.objectStore(STORE_NAME)
    const request = store.delete(id)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export async function syncPendingEntries(): Promise<{ synced: number; failed: number }> {
  const entries = await getPendingEntries()
  let synced = 0
  let failed = 0

  // Sort by timestamp to maintain order
  entries.sort((a, b) => new Date(a.timestampClient).getTime() - new Date(b.timestampClient).getTime())

  for (const entry of entries) {
    try {
      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: entry.type,
          locationId: entry.locationId,
          timestampClient: entry.timestampClient,
          gpsLatitude: entry.gpsLatitude,
          gpsLongitude: entry.gpsLongitude,
          gpsAccuracy: entry.gpsAccuracy,
          notes: "[Synced from offline]",
        }),
      })

      if (res.ok) {
        await removePendingEntry(entry.id)
        synced++
      } else {
        failed++
      }
    } catch {
      failed++
    }
  }

  return { synced, failed }
}

export async function getPendingCount(): Promise<number> {
  const entries = await getPendingEntries()
  return entries.length
}
