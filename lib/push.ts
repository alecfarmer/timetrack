import { supabaseAdmin as supabase } from "@/lib/supabase"

interface PushPayload {
  title: string
  body: string
  url?: string
  tag?: string
}

/**
 * Send a push notification to a user.
 * Requires VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY env vars.
 * Requires `web-push` as an optional dependency.
 */
export async function sendPushNotification(
  userId: string,
  payload: PushPayload
): Promise<void> {
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY

  if (!vapidPublicKey || !vapidPrivateKey) {
    console.warn("Push notifications not configured: VAPID keys missing")
    return
  }

  // Fetch user's push subscriptions
  const { data: subscriptions } = await supabase
    .from("PushSubscription")
    .select("endpoint, p256dh, auth")
    .eq("userId", userId)

  if (!subscriptions?.length) return

  // Dynamic require web-push (optional dependency)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let webpush: any
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    webpush = require("web-push")
  } catch {
    console.warn("web-push package not installed, skipping push notification")
    return
  }

  webpush.setVapidDetails(
    "mailto:noreply@onsite.app",
    vapidPublicKey,
    vapidPrivateKey
  )

  const message = JSON.stringify(payload)

  const results = await Promise.allSettled(
    subscriptions.map((sub: { endpoint: string; p256dh: string; auth: string }) =>
      webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        message
      )
    )
  )

  // Clean up expired subscriptions (410 Gone)
  for (let i = 0; i < results.length; i++) {
    const result = results[i]
    if (result.status === "rejected") {
      const err = result.reason as { statusCode?: number }
      if (err?.statusCode === 410 || err?.statusCode === 404) {
        await supabase
          .from("PushSubscription")
          .delete()
          .eq("endpoint", subscriptions[i].endpoint)
      }
    }
  }
}
