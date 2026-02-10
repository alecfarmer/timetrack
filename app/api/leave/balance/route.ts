import { NextRequest, NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { calculatePtoBalance } from "@/lib/leave-balance"

// GET /api/leave/balance?userId=xxx (optional, admin only)
export async function GET(request: NextRequest) {
  try {
    const { user, org, error: authError } = await getAuthUser()
    if (authError) return authError

    if (!org) {
      return NextResponse.json({ error: "No organization found" }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const targetUserId = searchParams.get("userId")

    // If requesting another user's balance, must be admin
    if (targetUserId && targetUserId !== user!.id) {
      if (org.role !== "ADMIN") {
        return NextResponse.json({ error: "Admin access required" }, { status: 403 })
      }
    }

    const userId = targetUserId || user!.id
    const balance = await calculatePtoBalance(userId, org.orgId)

    return NextResponse.json(balance)
  } catch (error) {
    console.error("Error fetching PTO balance:", error)
    return NextResponse.json({ error: "Failed to fetch PTO balance" }, { status: 500 })
  }
}
