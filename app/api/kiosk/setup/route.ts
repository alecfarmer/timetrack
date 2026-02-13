import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin as supabase } from "@/lib/supabase"
import { getAuthUser } from "@/lib/auth"
import { randomBytes } from "crypto"

// GET /api/kiosk/setup — List active kiosk sessions for the org
export async function GET() {
  const { org, error: authError } = await getAuthUser()
  if (authError) return authError
  if (!org || org.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 })
  }

  const { data, error } = await supabase
    .from("KioskSession")
    .select(`
      *,
      location:Location (id, name, address)
    `)
    .eq("orgId", org.orgId)
    .eq("isActive", true)
    .order("createdAt", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data || [])
}

// POST /api/kiosk/setup — Create a new kiosk session
export async function POST(request: NextRequest) {
  const { org, error: authError } = await getAuthUser()
  if (authError) return authError
  if (!org || org.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 })
  }

  const body = await request.json()
  const { locationId } = body

  if (!locationId) {
    return NextResponse.json({ error: "locationId is required" }, { status: 400 })
  }

  // Verify location belongs to this org
  const { data: location } = await supabase
    .from("Location")
    .select("id, orgId")
    .eq("id", locationId)
    .eq("orgId", org.orgId)
    .single()

  if (!location) {
    return NextResponse.json({ error: "Location not found" }, { status: 404 })
  }

  // Generate a unique token
  const token = randomBytes(32).toString("hex")

  const { data: session, error } = await supabase
    .from("KioskSession")
    .insert({
      orgId: org.orgId,
      locationId,
      token,
      isActive: true,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(session, { status: 201 })
}

// DELETE /api/kiosk/setup — Deactivate a kiosk session
export async function DELETE(request: NextRequest) {
  const { org, error: authError } = await getAuthUser()
  if (authError) return authError
  if (!org || org.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 })
  }

  const id = request.nextUrl.searchParams.get("id")
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 })
  }

  const { error } = await supabase
    .from("KioskSession")
    .update({ isActive: false })
    .eq("id", id)
    .eq("orgId", org.orgId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ deactivated: true })
}
