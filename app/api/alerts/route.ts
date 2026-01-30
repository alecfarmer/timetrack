import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { user, error: authError } = await getAuthUser();
  if (authError) return authError;

  const { searchParams } = req.nextUrl;
  const unreadOnly = searchParams.get("unreadOnly") === "true";
  const limit = Math.min(
    Math.max(parseInt(searchParams.get("limit") ?? "20", 10) || 20, 1),
    100
  );
  const offset = Math.max(
    parseInt(searchParams.get("offset") ?? "0", 10) || 0,
    0
  );

  // Build the main query
  let query = supabase
    .from("AlertNotification")
    .select("*", { count: "exact" })
    .eq("targetUserId", user.id)
    .order("createdAt", { ascending: false })
    .range(offset, offset + limit - 1);

  if (unreadOnly) {
    query = query.eq("isRead", false);
  }

  const { data: notifications, count: total, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }

  // Separate count of unread notifications
  const { count: unreadCount, error: unreadError } = await supabase
    .from("AlertNotification")
    .select("*", { count: "exact", head: true })
    .eq("targetUserId", user.id)
    .eq("isRead", false);

  if (unreadError) {
    return NextResponse.json(
      { error: "Failed to count unread notifications" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    notifications: notifications ?? [],
    unreadCount: unreadCount ?? 0,
    total: total ?? 0,
  });
}

export async function PATCH(req: NextRequest) {
  const { user, error: authError } = await getAuthUser();
  if (authError) return authError;

  let body: { notificationIds?: string[]; markAllRead?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { notificationIds, markAllRead } = body;

  if (!markAllRead && (!Array.isArray(notificationIds) || notificationIds.length === 0)) {
    return NextResponse.json(
      { error: "Provide notificationIds array or set markAllRead to true" },
      { status: 400 }
    );
  }

  let updateQuery;

  if (markAllRead) {
    // Mark all unread notifications as read for this user
    updateQuery = supabase
      .from("AlertNotification")
      .update({ isRead: true })
      .eq("targetUserId", user.id)
      .eq("isRead", false)
      .select("id");
  } else {
    // Mark specific notifications as read, scoped to this user
    updateQuery = supabase
      .from("AlertNotification")
      .update({ isRead: true })
      .eq("targetUserId", user.id)
      .in("id", notificationIds!)
      .select("id");
  }

  const { data, error } = await updateQuery;

  if (error) {
    return NextResponse.json(
      { error: "Failed to update notifications" },
      { status: 500 }
    );
  }

  return NextResponse.json({ updated: data?.length ?? 0 });
}
