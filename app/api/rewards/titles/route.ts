import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin as supabase } from "@/lib/supabase"
import { getAuthUser } from "@/lib/auth"
import { z } from "zod"
import { validateBody } from "@/lib/validations"

const setTitleSchema = z.object({
  titleId: z.string().nullable(),
})

// GET /api/rewards/titles — List all titles with unlock status
export async function GET(request: NextRequest) {
  try {
    const { user, org, error: authError } = await getAuthUser()
    if (authError) return authError
    if (!org) return NextResponse.json({ error: "Org not found" }, { status: 403 })

    const [titlesResult, profileResult] = await Promise.all([
      supabase
        .from("Title")
        .select("*")
        .eq("orgId", org.orgId)
        .order("sortOrder", { ascending: true }),

      supabase
        .from("RewardsProfile")
        .select("level, titleId")
        .eq("userId", user!.id)
        .eq("orgId", org.orgId)
        .single(),
    ])

    const userLevel = profileResult.data?.level || 1
    const activeTitleId = profileResult.data?.titleId || null

    const titles = (titlesResult.data || []).map((title) => {
      const criteria = title.unlockCriteria as Record<string, unknown>
      let unlocked = false

      if (criteria.type === "level") {
        unlocked = userLevel >= (criteria.level as number)
      }
      // badge_set titles would need separate check

      return {
        ...title,
        unlocked,
        isActive: title.id === activeTitleId,
      }
    })

    return NextResponse.json({ titles })
  } catch (error) {
    console.error("Titles error:", error)
    return NextResponse.json({ error: "Failed to fetch titles" }, { status: 500 })
  }
}

// POST /api/rewards/titles — Set active title
export async function POST(request: NextRequest) {
  try {
    const { user, org, error: authError } = await getAuthUser()
    if (authError) return authError
    if (!org) return NextResponse.json({ error: "Org not found" }, { status: 403 })

    const body = await request.json()
    const validation = validateBody(setTitleSchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const { titleId } = validation.data

    // Verify title is unlocked if not null
    if (titleId) {
      const { data: title } = await supabase
        .from("Title")
        .select("unlockCriteria")
        .eq("id", titleId)
        .eq("orgId", org.orgId)
        .single()

      if (!title) return NextResponse.json({ error: "Title not found" }, { status: 404 })

      const { data: profile } = await supabase
        .from("RewardsProfile")
        .select("level")
        .eq("userId", user!.id)
        .eq("orgId", org.orgId)
        .single()

      const criteria = title.unlockCriteria as Record<string, unknown>
      if (criteria.type === "level" && (profile?.level || 1) < (criteria.level as number)) {
        return NextResponse.json({ error: "Title not yet unlocked" }, { status: 400 })
      }
    }

    await supabase
      .from("RewardsProfile")
      .update({ titleId, updatedAt: new Date().toISOString() })
      .eq("userId", user!.id)
      .eq("orgId", org.orgId)

    return NextResponse.json({ success: true, titleId })
  } catch (error) {
    console.error("Set title error:", error)
    return NextResponse.json({ error: "Failed to set title" }, { status: 500 })
  }
}
