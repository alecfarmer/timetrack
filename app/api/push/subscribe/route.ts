import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin as supabase } from "@/lib/supabase"
import { getAuthUser } from "@/lib/auth"

// POST /api/push/subscribe - Register push subscription
export async function POST(request: NextRequest) {
  const { user, error: authError } = await getAuthUser()
  if (authError) return authError

  const body = await request.json()
  const { subscription } = body

  if (!subscription?.endpoint) {
    return NextResponse.json({ error: "Invalid push subscription" }, { status: 400 })
  }

  // Upsert the subscription keyed by endpoint
  const { error } = await supabase
    .from("PushSubscription")
    .upsert(
      {
        userId: user!.id,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys?.p256dh || null,
        auth: subscription.keys?.auth || null,
        updatedAt: new Date().toISOString(),
      },
      { onConflict: "endpoint" }
    )

  if (error) {
    console.error("Push subscribe error:", error)
    return NextResponse.json({ error: "Failed to save subscription" }, { status: 500 })
  }

  return NextResponse.json({ subscribed: true })
}

// DELETE /api/push/subscribe - Unsubscribe
export async function DELETE(request: NextRequest) {
  const { user, error: authError } = await getAuthUser()
  if (authError) return authError

  const endpoint = request.nextUrl.searchParams.get("endpoint")
  if (!endpoint) {
    return NextResponse.json({ error: "endpoint is required" }, { status: 400 })
  }

  await supabase
    .from("PushSubscription")
    .delete()
    .eq("userId", user!.id)
    .eq("endpoint", endpoint)

  return NextResponse.json({ unsubscribed: true })
}
