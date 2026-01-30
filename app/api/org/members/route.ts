import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { getAuthUser } from "@/lib/auth"
import { validateBody } from "@/lib/validations"
import { z } from "zod"

const updateMemberSchema = z.object({
  memberId: z.string().min(1),
  role: z.enum(["ADMIN", "MEMBER"]),
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

    // For admin: also fetch today's status for each member
    if (org.role === "ADMIN") {
      const today = new Date().toISOString().split("T")[0]
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
      const now = new Date()
      const dayOfWeek = now.getDay()
      const monday = new Date(now)
      monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7))
      const weekStart = monday.toISOString().split("T")[0]

      const { data: weekWorkDays } = await supabase
        .from("WorkDay")
        .select("userId, date, totalMinutes, location:Location(category)")
        .in("userId", memberIds)
        .gte("date", weekStart)
        .lte("date", today)

      // Fetch latest entry for each member to determine clock-in status
      const memberStatuses = await Promise.all(
        memberIds.map(async (userId) => {
          const { data: latestEntry } = await supabase
            .from("Entry")
            .select("type, timestampServer, location:Location(code, name)")
            .eq("userId", userId)
            .order("timestampServer", { ascending: false })
            .limit(1)
            .single()

          return { userId, latestEntry }
        })
      )

      const enrichedMembers = (members || []).map((member) => {
        const todayWork = (todayWorkDays || []).filter((wd) => wd.userId === member.userId)
        const weekWork = (weekWorkDays || []).filter((wd) => wd.userId === member.userId)
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

        return {
          ...member,
          isClockedIn,
          todayMinutes,
          todayLocation: todayLocName,
          weekDaysWorked: uniqueOfficeDays,
          lastActivity: latestEntry?.timestampServer || null,
        }
      })

      return NextResponse.json(enrichedMembers)
    }

    // Non-admin: return basic member list
    return NextResponse.json(members || [])
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

    const { memberId, role } = validation.data

    // Can't change own role
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
      return NextResponse.json({ error: "Cannot change your own role" }, { status: 400 })
    }

    const { data: updated, error } = await supabase
      .from("Membership")
      .update({ role })
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
