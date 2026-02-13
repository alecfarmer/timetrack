import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin as supabase } from "@/lib/supabase"
import { getAuthUser } from "@/lib/auth"

// GET /api/messages/channels — List channels for the org
export async function GET() {
  const { org, error: authError } = await getAuthUser()
  if (authError) return authError
  if (!org) {
    return NextResponse.json({ error: "No organization found" }, { status: 403 })
  }

  const { data, error } = await supabase
    .from("Channel")
    .select("*")
    .eq("orgId", org.orgId)
    .order("createdAt", { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data || [])
}

// POST /api/messages/channels — Create a channel
export async function POST(request: NextRequest) {
  const { user, org, error: authError } = await getAuthUser()
  if (authError) return authError
  if (!org) {
    return NextResponse.json({ error: "No organization found" }, { status: 403 })
  }

  const body = await request.json()
  const { name, type } = body

  if (!name?.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 })
  }

  const { data: channel, error } = await supabase
    .from("Channel")
    .insert({
      orgId: org.orgId,
      name: name.trim(),
      type: type || "team",
      createdBy: user.id,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(channel, { status: 201 })
}
