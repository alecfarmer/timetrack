import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin as supabase } from "@/lib/supabase"
import { getAuthUser } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import { startOfDay, endOfDay } from "date-fns"
import { toZonedTime } from "date-fns-tz"
import { getRequestTimezone } from "@/lib/validations"
import { z } from "zod"

// Schema for creating a new entry
const createEntrySchema = z.object({
  userId: z.string().uuid(),
  type: z.enum(["CLOCK_IN", "CLOCK_OUT", "BREAK_START", "BREAK_END"]),
  locationId: z.string().uuid(),
  timestamp: z.string().datetime(),
  reason: z.string().min(1, "Reason is required"),
  notes: z.string().optional(),
})

// Schema for updating an entry
const updateEntrySchema = z.object({
  entryId: z.string().min(1),
  timestamp: z.string().datetime().optional(),
  type: z.enum(["CLOCK_IN", "CLOCK_OUT", "BREAK_START", "BREAK_END"]).optional(),
  locationId: z.string().min(1).optional(),
  notes: z.string().optional(),
  reason: z.string().min(1, "Reason is required"),
})

// Schema for deleting entries
const deleteEntriesSchema = z.object({
  entryIds: z.array(z.string().min(1)).min(1),
  reason: z.string().min(1, "Reason is required"),
})

// Schema for bulk time shift
const bulkShiftSchema = z.object({
  entryIds: z.array(z.string().min(1)).min(1),
  shiftMinutes: z.number().int(),
  reason: z.string().min(1, "Reason is required"),
})

// GET /api/admin/entries - Get entries for a specific user
export async function GET(request: NextRequest) {
  try {
    const { user, org, error: authError } = await getAuthUser()
    if (authError) return authError

    // Check admin role
    const { data: membership } = await supabase
      .from("Membership")
      .select("role")
      .eq("userId", user!.id)
      .eq("orgId", org?.orgId)
      .single()

    if (membership?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("userId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const type = searchParams.get("type")
    const locationId = searchParams.get("locationId")

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    // Verify the user belongs to the same org
    const { data: targetMembership } = await supabase
      .from("Membership")
      .select("id")
      .eq("userId", userId)
      .eq("orgId", org?.orgId)
      .single()

    if (!targetMembership) {
      return NextResponse.json({ error: "User not found in organization" }, { status: 404 })
    }

    let query = supabase
      .from("Entry")
      .select(`
        *,
        location:Location (id, name, code, category)
      `)
      .eq("userId", userId)
      .order("timestampServer", { ascending: false })

    if (startDate) {
      const start = toZonedTime(new Date(startDate), getRequestTimezone(request))
      query = query.gte("timestampServer", startOfDay(start).toISOString())
    }

    if (endDate) {
      const end = toZonedTime(new Date(endDate), getRequestTimezone(request))
      query = query.lte("timestampServer", endOfDay(end).toISOString())
    }

    if (type && type !== "ALL") {
      query = query.eq("type", type)
    }

    if (locationId) {
      query = query.eq("locationId", locationId)
    }

    const { data: entries, error } = await query

    if (error) {
      console.error("Error fetching entries:", error)
      return NextResponse.json({ error: "Failed to fetch entries" }, { status: 500 })
    }

    // Get user info
    const { data: userInfo } = await supabase
      .from("Membership")
      .select("userId, role, firstName, lastName")
      .eq("userId", userId)
      .eq("orgId", org?.orgId)
      .single()

    // Get user email from auth
    const { data: authUser } = await supabase.auth.admin.getUserById(userId)

    // Get correction history for these entries
    const entryIds = entries?.map(e => e.id) || []
    const { data: corrections } = entryIds.length > 0
      ? await supabase
          .from("EntryCorrection")
          .select("*")
          .in("entryId", entryIds)
          .order("createdAt", { ascending: false })
      : { data: [] }

    const displayName = [userInfo?.firstName, userInfo?.lastName].filter(Boolean).join(" ") || null

    return NextResponse.json({
      entries: entries || [],
      user: {
        id: userId,
        email: authUser?.user?.email || "Unknown",
        role: userInfo?.role || "MEMBER",
        displayName,
      },
      corrections: corrections || [],
    })
  } catch (error) {
    console.error("Error in admin entries GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/admin/entries - Create a new entry for a user (admin)
export async function POST(request: NextRequest) {
  try {
    const { user, org, error: authError } = await getAuthUser()
    if (authError) return authError

    // Check admin role
    const { data: membership } = await supabase
      .from("Membership")
      .select("role")
      .eq("userId", user!.id)
      .eq("orgId", org?.orgId)
      .single()

    if (membership?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json()
    const parsed = createEntrySchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const { userId, type, locationId, timestamp, reason, notes } = parsed.data

    // Verify the user belongs to the same org
    const { data: targetMembership } = await supabase
      .from("Membership")
      .select("id")
      .eq("userId", userId)
      .eq("orgId", org?.orgId)
      .single()

    if (!targetMembership) {
      return NextResponse.json({ error: "User not found in organization" }, { status: 404 })
    }

    // Verify location belongs to org
    const { data: location } = await supabase
      .from("Location")
      .select("id")
      .eq("id", locationId)
      .eq("orgId", org?.orgId)
      .single()

    if (!location) {
      return NextResponse.json({ error: "Location not found" }, { status: 404 })
    }

    // Create the entry
    const { data: entry, error: entryError } = await supabase
      .from("Entry")
      .insert({
        type,
        locationId,
        userId,
        timestampClient: new Date(timestamp).toISOString(),
        timestampServer: new Date(timestamp).toISOString(),
        notes: notes || `Admin created: ${reason}`,
      })
      .select(`
        *,
        location:Location (id, name, code, category)
      `)
      .single()

    if (entryError) {
      console.error("Error creating entry:", entryError)
      return NextResponse.json({ error: "Failed to create entry" }, { status: 500 })
    }

    // Log audit event
    await logAudit({
      orgId: org!.orgId,
      userId: user!.id,
      action: "ENTRY_CREATED",
      entityType: "Entry",
      entityId: entry.id,
      details: {
        targetUserId: userId,
        type,
        timestamp,
        reason,
      },
    })

    return NextResponse.json(entry, { status: 201 })
  } catch (error) {
    console.error("Error in admin entries POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH /api/admin/entries - Update an entry
export async function PATCH(request: NextRequest) {
  try {
    const { user, org, error: authError } = await getAuthUser()
    if (authError) return authError

    // Check admin role
    const { data: membership } = await supabase
      .from("Membership")
      .select("role")
      .eq("userId", user!.id)
      .eq("orgId", org?.orgId)
      .single()

    if (membership?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json()

    // Check if this is a bulk shift operation
    if (body.shiftMinutes !== undefined) {
      const parsed = bulkShiftSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
      }

      const { entryIds, shiftMinutes, reason } = parsed.data

      // Get all entries
      const { data: entries } = await supabase
        .from("Entry")
        .select("*")
        .in("id", entryIds)

      if (!entries || entries.length === 0) {
        return NextResponse.json({ error: "No entries found" }, { status: 404 })
      }

      // Update each entry
      for (const entry of entries) {
        const oldTimestamp = new Date(entry.timestampServer)
        const newTimestamp = new Date(oldTimestamp.getTime() + shiftMinutes * 60000)

        // Create correction record
        await supabase.from("EntryCorrection").insert({
          entryId: entry.id,
          correctedBy: user!.id,
          oldTimestamp: entry.timestampServer,
          newTimestamp: newTimestamp.toISOString(),
          reason,
          status: "APPROVED",
        })

        // Update entry
        await supabase
          .from("Entry")
          .update({
            timestampServer: newTimestamp.toISOString(),
            timestampClient: newTimestamp.toISOString(),
          })
          .eq("id", entry.id)
      }

      // Log audit event
      await logAudit({
        orgId: org!.orgId,
        userId: user!.id,
        action: "ENTRIES_BULK_SHIFTED",
        entityType: "Entry",
        entityId: entryIds[0],
        details: {
          entryIds,
          shiftMinutes,
          reason,
        },
      })

      return NextResponse.json({ success: true, updated: entries.length })
    }

    // Single entry update
    const parsed = updateEntrySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const { entryId, timestamp, type, locationId, notes, reason } = parsed.data

    // Get existing entry
    const { data: existingEntry } = await supabase
      .from("Entry")
      .select("*")
      .eq("id", entryId)
      .single()

    if (!existingEntry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 })
    }

    // Verify entry belongs to a user in the same org
    const { data: targetMembership } = await supabase
      .from("Membership")
      .select("id")
      .eq("userId", existingEntry.userId)
      .eq("orgId", org?.orgId)
      .single()

    if (!targetMembership) {
      return NextResponse.json({ error: "Entry not found in organization" }, { status: 404 })
    }

    // Build update object
    const updates: Record<string, unknown> = {}
    if (timestamp) {
      updates.timestampServer = new Date(timestamp).toISOString()
      updates.timestampClient = new Date(timestamp).toISOString()
    }
    if (type) updates.type = type
    if (locationId) updates.locationId = locationId
    if (notes !== undefined) updates.notes = notes

    // Create correction record
    await supabase.from("EntryCorrection").insert({
      entryId,
      correctedBy: user!.id,
      oldTimestamp: existingEntry.timestampServer,
      newTimestamp: timestamp ? new Date(timestamp).toISOString() : existingEntry.timestampServer,
      oldType: existingEntry.type,
      newType: type || existingEntry.type,
      reason,
      status: "APPROVED",
    })

    // Update entry
    const { data: updatedEntry, error: updateError } = await supabase
      .from("Entry")
      .update(updates)
      .eq("id", entryId)
      .select(`
        *,
        location:Location (id, name, code, category)
      `)
      .single()

    if (updateError) {
      console.error("Error updating entry:", updateError)
      return NextResponse.json({ error: "Failed to update entry" }, { status: 500 })
    }

    // Log audit event
    await logAudit({
      orgId: org!.orgId,
      userId: user!.id,
      action: "ENTRY_UPDATED",
      entityType: "Entry",
      entityId: entryId,
      details: {
        targetUserId: existingEntry.userId,
        changes: updates,
        reason,
      },
    })

    return NextResponse.json(updatedEntry)
  } catch (error) {
    console.error("Error in admin entries PATCH:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/admin/entries - Delete entries
export async function DELETE(request: NextRequest) {
  try {
    const { user, org, error: authError } = await getAuthUser()
    if (authError) return authError

    // Check admin role
    const { data: membership } = await supabase
      .from("Membership")
      .select("role")
      .eq("userId", user!.id)
      .eq("orgId", org?.orgId)
      .single()

    if (membership?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json()
    const parsed = deleteEntriesSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const { entryIds, reason } = parsed.data

    // Get entries to verify they belong to org
    const { data: entries } = await supabase
      .from("Entry")
      .select("id, userId, type, timestampServer")
      .in("id", entryIds)

    if (!entries || entries.length === 0) {
      return NextResponse.json({ error: "No entries found" }, { status: 404 })
    }

    // Verify all entries belong to users in the same org
    for (const entry of entries) {
      const { data: targetMembership } = await supabase
        .from("Membership")
        .select("id")
        .eq("userId", entry.userId)
        .eq("orgId", org?.orgId)
        .single()

      if (!targetMembership) {
        return NextResponse.json({ error: "Some entries not found in organization" }, { status: 404 })
      }
    }

    // Create correction records for deletion
    for (const entry of entries) {
      await supabase.from("EntryCorrection").insert({
        entryId: entry.id,
        correctedBy: user!.id,
        oldTimestamp: entry.timestampServer,
        oldType: entry.type,
        reason: `DELETED: ${reason}`,
        status: "APPROVED",
      })
    }

    // Delete entries
    const { error: deleteError } = await supabase
      .from("Entry")
      .delete()
      .in("id", entryIds)

    if (deleteError) {
      console.error("Error deleting entries:", deleteError)
      return NextResponse.json({ error: "Failed to delete entries" }, { status: 500 })
    }

    // Log audit event
    await logAudit({
      orgId: org!.orgId,
      userId: user!.id,
      action: "ENTRIES_DELETED",
      entityType: "Entry",
      entityId: entryIds[0],
      details: {
        entryIds,
        reason,
        deletedCount: entries.length,
      },
    })

    return NextResponse.json({ success: true, deleted: entries.length })
  } catch (error) {
    console.error("Error in admin entries DELETE:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
