import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const { user, org, error: authError } = await getAuthUser();
  if (authError) return authError;
  if (!org) {
    return NextResponse.json({ error: "No organization found" }, { status: 403 });
  }

  const { searchParams } = request.nextUrl;
  const status = searchParams.get("status");
  const userId = searchParams.get("userId");

  const isAdmin = org.role === "ADMIN";

  let query = supabase
    .from("TimesheetSubmission")
    .select("*")
    .eq("orgId", org.orgId)
    .order("weekStart", { ascending: false });

  if (isAdmin) {
    // Admins can optionally filter by userId
    if (userId) {
      query = query.eq("userId", userId);
    }
  } else {
    // Regular members only see their own timesheets
    query = query.eq("userId", user.id);
  }

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const { user, org, error: authError } = await getAuthUser();
  if (authError) return authError;
  if (!org) {
    return NextResponse.json({ error: "No organization found" }, { status: 403 });
  }

  const body = await request.json();
  const { weekStart } = body;

  if (!weekStart) {
    return NextResponse.json(
      { error: "weekStart is required (YYYY-MM-DD)" },
      { status: 400 }
    );
  }

  // Validate that weekStart is a Monday
  const startDate = new Date(weekStart + "T00:00:00Z");
  if (startDate.getUTCDay() !== 1) {
    return NextResponse.json(
      { error: "weekStart must be a Monday" },
      { status: 400 }
    );
  }

  // Calculate weekEnd (weekStart + 6 days = Sunday)
  const endDate = new Date(startDate);
  endDate.setUTCDate(endDate.getUTCDate() + 6);
  const weekEnd = endDate.toISOString().split("T")[0];

  // Fetch WorkDay records for the user in this week range to compute totals
  const { data: workDays, error: workDayError } = await supabase
    .from("WorkDay")
    .select("*")
    .eq("userId", user.id)
    .gte("date", weekStart)
    .lte("date", weekEnd);

  if (workDayError) {
    return NextResponse.json(
      { error: workDayError.message },
      { status: 500 }
    );
  }

  const totalMinutes = (workDays ?? []).reduce(
    (sum: number, day: { totalMinutes?: number }) =>
      sum + (day.totalMinutes ?? 0),
    0
  );
  const totalDays = (workDays ?? []).length;

  // Insert the timesheet submission
  const { data: submission, error: insertError } = await supabase
    .from("TimesheetSubmission")
    .insert({
      userId: user.id,
      orgId: org.orgId,
      weekStart,
      weekEnd,
      status: "PENDING",
      totalMinutes,
      totalDays,
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json(
      { error: insertError.message },
      { status: 500 }
    );
  }

  return NextResponse.json(submission, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const { user, org, error: authError } = await getAuthUser();
  if (authError) return authError;
  if (!org) {
    return NextResponse.json({ error: "No organization found" }, { status: 403 });
  }

  if (org.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Only admins can approve or reject timesheets" },
      { status: 403 }
    );
  }

  const body = await request.json();
  const { submissionId, action, notes } = body;

  if (!submissionId || !action) {
    return NextResponse.json(
      { error: "submissionId and action are required" },
      { status: 400 }
    );
  }

  if (action !== "APPROVED" && action !== "REJECTED") {
    return NextResponse.json(
      { error: 'action must be "APPROVED" or "REJECTED"' },
      { status: 400 }
    );
  }

  const { data: submission, error: updateError } = await supabase
    .from("TimesheetSubmission")
    .update({
      status: action,
      reviewedBy: user.id,
      reviewedAt: new Date().toISOString(),
      reviewNotes: notes ?? null,
    })
    .eq("id", submissionId)
    .eq("orgId", org.orgId)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json(
      { error: updateError.message },
      { status: 500 }
    );
  }

  return NextResponse.json(submission);
}
