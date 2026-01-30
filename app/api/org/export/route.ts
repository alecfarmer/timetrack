import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin as supabase } from "@/lib/supabase"
import { getAuthUser } from "@/lib/auth"

// GET /api/org/export - Export team compliance data as CSV (admin only)
export async function GET(request: NextRequest) {
  try {
    const { user, org, error: authError } = await getAuthUser()
    if (authError) return authError

    if (!org || org.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    // Default to current week (Mon-Sun)
    const now = new Date()
    const dayOfWeek = now.getDay()
    const monday = new Date(now)
    monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7))
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)

    const from = startDate || monday.toISOString().split("T")[0]
    const to = endDate || sunday.toISOString().split("T")[0]

    // Fetch members
    const { data: members } = await supabase
      .from("Membership")
      .select("userId, role")
      .eq("orgId", org.orgId)

    if (!members || members.length === 0) {
      return new NextResponse("No members found", { status: 404 })
    }

    const memberIds = members.map((m) => m.userId)

    // Fetch emails
    const emailMap: Record<string, string> = {}
    const { data: authData } = await supabase.auth.admin.listUsers({ perPage: 1000 })
    if (authData?.users) {
      for (const u of authData.users) {
        if (memberIds.includes(u.id)) {
          emailMap[u.id] = u.email || u.id
        }
      }
    }

    // Fetch workdays in range
    const { data: workDays } = await supabase
      .from("WorkDay")
      .select("userId, date, totalMinutes, location:Location(code, name, category)")
      .in("userId", memberIds)
      .gte("date", from)
      .lte("date", to)
      .order("date", { ascending: true })

    // Fetch policy
    const { data: policy } = await supabase
      .from("PolicyConfig")
      .select("requiredDaysPerWeek")
      .eq("orgId", org.orgId)
      .eq("isActive", true)
      .order("effectiveDate", { ascending: false })
      .limit(1)
      .single()

    const requiredDays = policy?.requiredDaysPerWeek ?? 3

    // Build CSV
    const rows: string[] = []
    rows.push("Email,Role,Date,Location,Category,Minutes,Hours")

    for (const wd of workDays || []) {
      const email = emailMap[wd.userId] || wd.userId
      const member = members.find((m) => m.userId === wd.userId)
      const loc = Array.isArray(wd.location) ? wd.location[0] : wd.location
      const locName = loc?.name || loc?.code || "Unknown"
      const category = loc?.category || "UNKNOWN"
      const minutes = wd.totalMinutes || 0
      const hours = (minutes / 60).toFixed(1)
      rows.push(`"${email}","${member?.role || "MEMBER"}","${wd.date}","${locName}","${category}",${minutes},${hours}`)
    }

    // Add summary section
    rows.push("")
    rows.push("--- Summary ---")
    rows.push(`"Date Range","${from} to ${to}"`)
    rows.push(`"Required Days/Week",${requiredDays}`)
    rows.push("")
    rows.push("Email,Role,Total Days,Office Days,Total Minutes,Total Hours,Compliant")

    for (const member of members) {
      const email = emailMap[member.userId] || member.userId
      const memberDays = (workDays || []).filter((wd) => wd.userId === member.userId)
      const totalDays = new Set(memberDays.map((wd) => wd.date)).size
      const officeDays = new Set(
        memberDays
          .filter((wd) => {
            const loc = Array.isArray(wd.location) ? wd.location[0] : wd.location
            return loc?.category !== "HOME"
          })
          .map((wd) => wd.date)
      ).size
      const totalMinutes = memberDays.reduce((sum, wd) => sum + (wd.totalMinutes || 0), 0)
      const totalHours = (totalMinutes / 60).toFixed(1)
      const compliant = officeDays >= requiredDays ? "Yes" : "No"
      rows.push(`"${email}","${member.role}",${totalDays},${officeDays},${totalMinutes},${totalHours},"${compliant}"`)
    }

    const csv = rows.join("\n")

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="compliance-${from}-to-${to}.csv"`,
      },
    })
  } catch (error) {
    console.error("Error exporting compliance:", error)
    return NextResponse.json({ error: "Failed to export" }, { status: 500 })
  }
}
