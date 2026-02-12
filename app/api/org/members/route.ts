import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin as supabase } from "@/lib/supabase"
import { getAuthUser } from "@/lib/auth"
import { validateBody, getRequestTimezone } from "@/lib/validations"
import { z } from "zod"
import { toZonedTime } from "date-fns-tz"
import { startOfDay, format } from "date-fns"

const updateMemberSchema = z.object({
  memberId: z.string().min(1),
  role: z.enum(["ADMIN", "MEMBER"]).optional(),
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
})

// GET /api/org/members - List org members with their stats
export async function GET(request: NextRequest) {
  try {
    const { user, org, error: authError } = await getAuthUser()
    if (authError) return authError

    if (!org) {
      return NextResponse.json({ error: "No organization found" }, { status: 403 })
    }

    const { data: members, error } = await supabase
      .from("Membership")
      .select("*")
      .eq("orgId", org.orgId)
      .order("createdAt", { ascending: true })

    if (error) {
      return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 })
    }

    // Get org owner
    const { data: orgData } = await supabase
      .from("Organization")
      .select("createdBy")
      .eq("id", org.orgId)
      .single()

    const ownerId = orgData?.createdBy || null

    // Look up emails for all members via auth admin API
    const memberIds = (members || []).map((m) => m.userId)
    const emailMap: Record<string, string> = {}
    if (memberIds.length > 0) {
      const { data: authData } = await supabase.auth.admin.listUsers({ perPage: 1000 })
      if (authData?.users) {
        for (const u of authData.users) {
          if (memberIds.includes(u.id)) {
            emailMap[u.id] = u.email || u.id
          }
        }
      }
    }

    // For admin: also fetch today's status for each member
    if (org.role === "ADMIN") {
      const tz = getRequestTimezone(request)
      const zonedNow = toZonedTime(new Date(), tz)
      const today = format(startOfDay(zonedNow), "yyyy-MM-dd")
      const memberIds = (members || []).map((m) => m.userId)

      // Fetch today's workdays for all members
      const { data: todayWorkDays } = await supabase
        .from("WorkDay")
        .select(`
          userId,
          totalMinutes,
          location:Location (code, name, category)
        `)
        .in("userId", memberIds)
        .eq("date", today)

      // Fetch this week's workdays for compliance
      const dayOfWeek = zonedNow.getDay()
      const monday = new Date(zonedNow)
      monday.setDate(zonedNow.getDate() - ((dayOfWeek + 6) % 7))
      const weekStart = format(startOfDay(monday), "yyyy-MM-dd")

      const { data: weekWorkDays } = await supabase
        .from("WorkDay")
        .select("userId, date, totalMinutes, location:Location(category)")
        .in("userId", memberIds)
        .gte("date", weekStart)
        .lte("date", today)

      // Fetch recent entries for all members in one batch query
      const { data: recentEntries } = await supabase
        .from("Entry")
        .select("userId, type, timestampServer, location:Location(code, name)")
        .in("userId", memberIds)
        .order("timestampServer", { ascending: false })
        .limit(Math.max(200, memberIds.length * 10))

      // Extract latest entry per member
      const latestEntryMap = new Map<string, NonNullable<typeof recentEntries>[number]>()
      for (const entry of recentEntries || []) {
        if (!latestEntryMap.has(entry.userId)) {
          latestEntryMap.set(entry.userId, entry)
        }
      }

      const memberStatuses = memberIds.map((userId: string) => ({
        userId,
        latestEntry: latestEntryMap.get(userId) || null,
      }))

      const enrichedMembers = (members || []).map((member) => {
        const todayWork = (todayWorkDays || []).filter((wd: { userId: string }) => wd.userId === member.userId)
        const weekWork = (weekWorkDays || []).filter((wd: { userId: string }) => wd.userId === member.userId)
        const status = memberStatuses.find((s) => s.userId === member.userId)

        // Count unique in-office days this week
        const uniqueOfficeDays = new Set(
          weekWork
            .filter((wd) => {
              const loc = Array.isArray(wd.location) ? wd.location[0] : wd.location
              return loc?.category !== "HOME"
            })
            .map((wd) => wd.date)
        ).size

        const todayMinutes = todayWork.reduce((sum, wd) => sum + (wd.totalMinutes || 0), 0)
        const todayLocation = todayWork[0]?.location
        const todayLocName = todayLocation
          ? (Array.isArray(todayLocation) ? todayLocation[0] : todayLocation)?.code || "On-site"
          : null

        const latestEntry = status?.latestEntry
        const isClockedIn = latestEntry?.type === "CLOCK_IN"

        const displayName = [member.firstName, member.lastName].filter(Boolean).join(" ") || null

        return {
          ...member,
          email: emailMap[member.userId] || null,
          displayName,
          isOwner: member.userId === ownerId,
          isClockedIn,
          clockedInSince: isClockedIn ? latestEntry?.timestampServer || null : null,
          todayMinutes,
          todayLocation: todayLocName,
          weekDaysWorked: uniqueOfficeDays,
          lastActivity: latestEntry?.timestampServer || null,
        }
      })

      return NextResponse.json(enrichedMembers)
    }

    // Non-admin: return basic member list with emails
    const basicMembers = (members || []).map((m) => ({
      ...m,
      email: emailMap[m.userId] || null,
      displayName: [m.firstName, m.lastName].filter(Boolean).join(" ") || null,
      isOwner: m.userId === ownerId,
    }))
    return NextResponse.json(basicMembers)
  } catch (error) {
    console.error("Error fetching members:", error)
    return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 })
  }
}

// PATCH /api/org/members - Update a member's role (admin only)
export async function PATCH(request: NextRequest) {
  try {
    const { user, org, error: authError } = await getAuthUser()
    if (authError) return authError

    if (!org || org.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const validation = validateBody(updateMemberSchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const { memberId, role, firstName, lastName } = validation.data

    // Verify member exists in this org
    const { data: target } = await supabase
      .from("Membership")
      .select("userId")
      .eq("id", memberId)
      .eq("orgId", org.orgId)
      .single()

    if (!target) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    // Can't change own role (but can update names)
    if (role && target.userId === user!.id) {
      return NextResponse.json({ error: "Cannot change your own role" }, { status: 400 })
    }

    // Prevent demoting the org owner
    if (role && role !== "ADMIN") {
      const { data: orgData } = await supabase
        .from("Organization")
        .select("createdBy")
        .eq("id", org.orgId)
        .single()

      if (orgData?.createdBy === target.userId) {
        return NextResponse.json({ error: "Cannot demote the organization owner" }, { status: 400 })
      }
    }

    const updateData: Record<string, unknown> = {}
    if (role !== undefined) updateData.role = role
    if (firstName !== undefined) updateData.firstName = firstName
    if (lastName !== undefined) updateData.lastName = lastName

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    const { data: updated, error } = await supabase
      .from("Membership")
      .update(updateData)
      .eq("id", memberId)
      .eq("orgId", org.orgId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: "Failed to update member" }, { status: 500 })
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error updating member:", error)
    return NextResponse.json({ error: "Failed to update member" }, { status: 500 })
  }
}

// DELETE /api/org/members - Remove a member (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const { user, org, error: authError } = await getAuthUser()
    if (authError) return authError

    if (!org || org.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const memberId = request.nextUrl.searchParams.get("id")
    if (!memberId) {
      return NextResponse.json({ error: "Missing member id" }, { status: 400 })
    }

    // Can't remove yourself
    const { data: target } = await supabase
      .from("Membership")
      .select("userId")
      .eq("id", memberId)
      .eq("orgId", org.orgId)
      .single()

    if (!target) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    if (target.userId === user!.id) {
      return NextResponse.json({ error: "Cannot remove yourself" }, { status: 400 })
    }

    // Prevent removing the org owner
    const { data: orgData } = await supabase
      .from("Organization")
      .select("createdBy")
      .eq("id", org.orgId)
      .single()

    if (orgData?.createdBy === target.userId) {
      return NextResponse.json({ error: "Cannot remove the organization owner" }, { status: 400 })
    }

    const { error } = await supabase
      .from("Membership")
      .delete()
      .eq("id", memberId)
      .eq("orgId", org.orgId)

    if (error) {
      return NextResponse.json({ error: "Failed to remove member" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error removing member:", error)
    return NextResponse.json({ error: "Failed to remove member" }, { status: 500 })
  }
}
