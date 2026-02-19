import { z } from "zod"

// ─── Entry Schemas ───────────────────────────────────────────────
export const createEntrySchema = z.object({
  type: z.enum(["CLOCK_IN", "CLOCK_OUT", "BREAK_START", "BREAK_END"]),
  locationId: z.string().min(1, "locationId is required"),
  timestampClient: z.string().datetime().optional(),
  gpsLatitude: z.number().min(-90).max(90).nullable().optional(),
  gpsLongitude: z.number().min(-180).max(180).nullable().optional(),
  gpsAccuracy: z.number().min(0).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
  photoUrl: z.string().max(500000).nullable().optional(),
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
export const calloutPriorityEnum = z.enum(["P1", "P2", "P3", "P4", "P5"])
export type CalloutPriority = z.infer<typeof calloutPriorityEnum>

export const createCalloutSchema = z.object({
  incidentNumber: z.string().min(1).max(100),
  locationId: z.string().min(1),
  priority: calloutPriorityEnum.default("P3"),
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
export const leaveTypeEnum = z.enum([
  "PTO", "SICK", "HOLIDAY", "PERSONAL", "BEREAVEMENT", "JURY_DUTY", "OTHER",
  "COMP",    // Compensatory time off (earned from P1 callouts)
  "TRAVEL",  // Business travel (weekend = auto-grant comp day)
])
export type LeaveType = z.infer<typeof leaveTypeEnum>

export const createLeaveSchema = z.object({
  type: leaveTypeEnum,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
})

// ─── Leave Policy Schemas ────────────────────────────────────────
export const leavePolicySchema = z.object({
  annualPtoDays: z.number().int().min(0).max(365).optional(),
  maxCarryoverDays: z.number().int().min(0).max(365).optional(),
  leaveYearStartMonth: z.number().int().min(1).max(12).optional(),
  leaveYearStartDay: z.number().int().min(1).max(31).optional(),
})

export const leaveAllowanceOverrideSchema = z.object({
  userId: z.string().min(1),
  annualPtoDays: z.number().int().min(0).max(365),
  effectiveYear: z.number().int().min(2000).max(2100).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
})

// ─── Helper: extract timezone from request ──────────────────────
const FALLBACK_TIMEZONE = process.env.DEFAULT_TIMEZONE || "America/New_York"

const IANA_TZ_RE = /^[A-Za-z_]+\/[A-Za-z_\/]+$/

export function getRequestTimezone(request: { headers: { get(name: string): string | null } }): string {
  const tz = request.headers.get("x-timezone")
  if (tz && IANA_TZ_RE.test(tz)) return tz
  return FALLBACK_TIMEZONE
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
