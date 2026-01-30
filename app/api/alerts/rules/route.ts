import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";

export async function GET() {
  const { org, error: authError } = await getAuthUser();
  if (authError) return authError;
  if (!org) {
    return NextResponse.json({ error: "No organization found" }, { status: 403 });
  }

  if (org.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Admin access required" },
      { status: 403 }
    );
  }

  const { data: rules, error } = await supabase
    .from("AlertRule")
    .select("*")
    .eq("orgId", org.orgId);

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch alert rules" },
      { status: 500 }
    );
  }

  return NextResponse.json(rules ?? []);
}

export async function PATCH(req: NextRequest) {
  const { org, error: authError } = await getAuthUser();
  if (authError) return authError;
  if (!org) {
    return NextResponse.json({ error: "No organization found" }, { status: 403 });
  }

  if (org.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Admin access required" },
      { status: 403 }
    );
  }

  let body: { ruleId?: string; isActive?: boolean; config?: object };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { ruleId, isActive, config } = body;

  if (!ruleId) {
    return NextResponse.json(
      { error: "ruleId is required" },
      { status: 400 }
    );
  }

  if (isActive === undefined && config === undefined) {
    return NextResponse.json(
      { error: "Provide isActive or config to update" },
      { status: 400 }
    );
  }

  // Build the update payload with only provided fields
  const updatePayload: Record<string, unknown> = {};
  if (isActive !== undefined) {
    updatePayload.isActive = isActive;
  }
  if (config !== undefined) {
    updatePayload.config = config;
  }

  const { data: updatedRule, error } = await supabase
    .from("AlertRule")
    .update(updatePayload)
    .eq("id", ruleId)
    .eq("orgId", org.orgId)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Failed to update alert rule" },
      { status: 500 }
    );
  }

  return NextResponse.json(updatedRule);
}
