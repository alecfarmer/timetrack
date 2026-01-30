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

const MAX_RETRIES = 5
const STALE_ENTRY_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

async function updateEntryRetries(id: string, retries: number): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite")
    const store = tx.objectStore(STORE_NAME)
    const getReq = store.get(id)
    getReq.onsuccess = () => {
      const record = getReq.result
      if (record) {
        record.retries = retries
        store.put(record)
      }
      resolve()
    }
    getReq.onerror = () => reject(getReq.error)
  })
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function syncPendingEntries(): Promise<{ synced: number; failed: number; dropped: number }> {
  const entries = await getPendingEntries()
  let synced = 0
  let failed = 0
  let dropped = 0
  const now = Date.now()

  // Sort by timestamp to maintain order
  entries.sort((a, b) => new Date(a.timestampClient).getTime() - new Date(b.timestampClient).getTime())

  for (const entry of entries) {
    // Drop stale entries older than 7 days
    const age = now - new Date(entry.createdAt).getTime()
    if (age > STALE_ENTRY_MS) {
      await removePendingEntry(entry.id)
      dropped++
      continue
    }

    // Drop entries that exceeded max retries
    if (entry.retries >= MAX_RETRIES) {
      await removePendingEntry(entry.id)
      dropped++
      continue
    }

    // Stop syncing if we went offline mid-loop
    if (!navigator.onLine) {
      failed += entries.length - synced - dropped - failed
      break
    }

    // Exponential backoff: wait before retrying (skip delay on first attempt)
    if (entry.retries > 0) {
      const backoffMs = Math.min(Math.pow(2, entry.retries) * 1000, 16000)
      await delay(backoffMs)
    }

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
      } else if (res.status === 429) {
        // Rate limited — retry later
        await updateEntryRetries(entry.id, entry.retries + 1)
        failed++
      } else if (res.status >= 400 && res.status < 500) {
        // Client error — won't succeed on retry, drop it
        await removePendingEntry(entry.id)
        dropped++
      } else {
        await updateEntryRetries(entry.id, entry.retries + 1)
        failed++
      }
    } catch {
      await updateEntryRetries(entry.id, entry.retries + 1)
      failed++
    }
  }

  return { synced, failed, dropped }
}

export async function getPendingCount(): Promise<number> {
  const entries = await getPendingEntries()
  return entries.length
}
