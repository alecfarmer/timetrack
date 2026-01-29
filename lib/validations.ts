import { z } from "zod"

// ─── Entry Schemas ───────────────────────────────────────────────
export const createEntrySchema = z.object({
  type: z.enum(["CLOCK_IN", "CLOCK_OUT"]),
  locationId: z.string().min(1, "locationId is required"),
  timestampClient: z.string().datetime().optional(),
  gpsLatitude: z.number().min(-90).max(90).nullable().optional(),
  gpsLongitude: z.number().min(-180).max(180).nullable().optional(),
  gpsAccuracy: z.number().min(0).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
})

// ─── Location Schemas ────────────────────────────────────────────
export const createLocationSchema = z.object({
  name: z.string().min(1).max(100),
  code: z.string().max(20).nullable().optional(),
  category: z.enum(["PLANT", "OFFICE", "HOME", "OTHER"]),
  address: z.string().max(500).nullable().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  geofenceRadius: z.number().min(10).max(5000).default(50),
  isDefault: z.boolean().default(false),
})

export const updateLocationSchema = z.object({
  id: z.string().min(1, "id is required"),
  name: z.string().min(1).max(100).optional(),
  code: z.string().max(20).nullable().optional(),
  address: z.string().max(500).nullable().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  geofenceRadius: z.number().min(10).max(5000).optional(),
})

// ─── Callout Schemas ─────────────────────────────────────────────
export const createCalloutSchema = z.object({
  incidentNumber: z.string().min(1).max(100),
  locationId: z.string().min(1),
  timeReceived: z.string().datetime(),
  timeStarted: z.string().datetime().nullable().optional(),
  timeEnded: z.string().datetime().nullable().optional(),
  gpsLatitude: z.number().min(-90).max(90).nullable().optional(),
  gpsLongitude: z.number().min(-180).max(180).nullable().optional(),
  gpsAccuracy: z.number().min(0).nullable().optional(),
  description: z.string().max(2000).nullable().optional(),
  resolution: z.string().max(2000).nullable().optional(),
})

// ─── Leave Schemas ───────────────────────────────────────────────
export const createLeaveSchema = z.object({
  type: z.enum(["PTO", "SICK", "HOLIDAY", "PERSONAL", "BEREAVEMENT", "JURY_DUTY", "OTHER"]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
})

// ─── Onboarding Schema ──────────────────────────────────────────
export const onboardingSchema = z.object({
  wfhAddress: z.string().max(500).optional(),
  wfhLatitude: z.number().min(-90).max(90).optional(),
  wfhLongitude: z.number().min(-180).max(180).optional(),
})

// ─── Helper: extract timezone from request ──────────────────────
const FALLBACK_TIMEZONE = process.env.DEFAULT_TIMEZONE || "America/New_York"

export function getRequestTimezone(request: { headers: { get(name: string): string | null } }): string {
  return request.headers.get("x-timezone") || FALLBACK_TIMEZONE
}

// ─── Helper: validate request body ──────────────────────────────
export function validateBody<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data)
  if (!result.success) {
    const messages = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")
    return { success: false, error: messages }
  }
  return { success: true, data: result.data }
}
