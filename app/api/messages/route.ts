import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin as supabase } from "@/lib/supabase"
import { getAuthUser } from "@/lib/auth"

// GET /api/messages — List messages for a channel
export async function GET(request: NextRequest) {
  const { org, error: authError } = await getAuthUser()
  if (authError) return authError
  if (!org) {
    return NextResponse.json({ error: "No organization found" }, { status: 403 })
  }

  const channelId = request.nextUrl.searchParams.get("channelId")
  if (!channelId) {
    return NextResponse.json({ error: "channelId is required" }, { status: 400 })
  }

  // Verify channel belongs to this org
  const { data: channel } = await supabase
    .from("Channel")
    .select("id, orgId")
    .eq("id", channelId)
    .eq("orgId", org.orgId)
    .single()

  if (!channel) {
    return NextResponse.json({ error: "Channel not found" }, { status: 404 })
  }

  const limit = parseInt(request.nextUrl.searchParams.get("limit") || "50")
  const before = request.nextUrl.searchParams.get("before")

  let query = supabase
    .from("Message")
    .select("*")
    .eq("channelId", channelId)
    .order("createdAt", { ascending: false })
    .limit(limit)

  if (before) {
    query = query.lt("createdAt", before)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json((data || []).reverse())
}

// POST /api/messages — Send a message
export async function POST(request: NextRequest) {
  const { user, org, error: authError } = await getAuthUser()
  if (authError) return authError
  if (!org) {
    return NextResponse.json({ error: "No organization found" }, { status: 403 })
  }

  const body = await request.json()
  const { channelId, content } = body

  if (!channelId || !content?.trim()) {
    return NextResponse.json({ error: "channelId and content are required" }, { status: 400 })
  }

  // Verify channel belongs to this org
  const { data: channel } = await supabase
    .from("Channel")
    .select("id, orgId")
    .eq("id", channelId)
    .eq("orgId", org.orgId)
    .single()

  if (!channel) {
    return NextResponse.json({ error: "Channel not found" }, { status: 404 })
  }

  const { data: message, error } = await supabase
    .from("Message")
    .insert({
      channelId,
      userId: user.id,
      content: content.trim(),
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(message, { status: 201 })
}
