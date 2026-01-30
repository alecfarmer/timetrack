import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin as supabase } from "@/lib/supabase"
import { getAuthUser } from "@/lib/auth"

// GET /api/shifts - List shifts for the org
export async function GET() {
  const { org, error: authError } = await getAuthUser()
  if (authError) return authError
  if (!org) {
    return NextResponse.json({ error: "No organization found" }, { status: 403 })
  }

  const { data: shifts, error } = await supabase
    .from("Shift")
    .select("*")
    .eq("orgId", org.orgId)
    .order("startTime", { ascending: true })

  if (error) {
    return NextResponse.json({ error: "Failed to fetch shifts" }, { status: 500 })
  }

  return NextResponse.json(shifts || [])
}

// POST /api/shifts - Create a new shift (admin only)
export async function POST(request: NextRequest) {
  const { org, error: authError } = await getAuthUser()
  if (authError) return authError
  if (!org || org.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 })
  }

  const body = await request.json()
  const { name, startTime, endTime, daysOfWeek, color } = body

  if (!name || !startTime || !endTime) {
    return NextResponse.json(
      { error: "name, startTime, and endTime are required" },
      { status: 400 }
    )
  }

  const { data: shift, error } = await supabase
    .from("Shift")
    .insert({
      orgId: org.orgId,
      name,
      startTime,
      endTime,
      daysOfWeek: daysOfWeek || [1, 2, 3, 4, 5],
      color: color || "#3b82f6",
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: "Failed to create shift" }, { status: 500 })
  }

  return NextResponse.json(shift, { status: 201 })
}

// PATCH /api/shifts - Update a shift (admin only)
export async function PATCH(request: NextRequest) {
  const { org, error: authError } = await getAuthUser()
  if (authError) return authError
  if (!org || org.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 })
  }

  const body = await request.json()
  const { id, ...updates } = body

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 })
  }

  const allowedFields = ["name", "startTime", "endTime", "daysOfWeek", "color", "isActive"]
  const updateData: Record<string, unknown> = { updatedAt: new Date().toISOString() }
  for (const key of allowedFields) {
    if (updates[key] !== undefined) {
      updateData[key] = updates[key]
    }
  }

  const { data: shift, error } = await supabase
    .from("Shift")
    .update(updateData)
    .eq("id", id)
    .eq("orgId", org.orgId)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: "Failed to update shift" }, { status: 500 })
  }

  return NextResponse.json(shift)
}

// DELETE /api/shifts - Delete a shift (admin only)
export async function DELETE(request: NextRequest) {
  const { org, error: authError } = await getAuthUser()
  if (authError) return authError
  if (!org || org.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 })
  }

  const { searchParams } = request.nextUrl
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 })
  }

  const { error } = await supabase
    .from("Shift")
    .delete()
    .eq("id", id)
    .eq("orgId", org.orgId)

  if (error) {
    return NextResponse.json({ error: "Failed to delete shift" }, { status: 500 })
  }

  return NextResponse.json({ deleted: true })
}
