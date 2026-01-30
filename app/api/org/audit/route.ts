import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { supabaseAdmin as supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
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

  const { searchParams } = req.nextUrl;
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") ?? "50", 10) || 50, 1), 200);
  const offset = Math.max(parseInt(searchParams.get("offset") ?? "0", 10) || 0, 0);
  const action = searchParams.get("action");
  const entityType = searchParams.get("entityType");

  let query = supabase
    .from("AuditLog")
    .select("*", { count: "exact" })
    .eq("orgId", org.orgId)
    .order("createdAt", { ascending: false })
    .range(offset, offset + limit - 1);

  if (action) {
    query = query.eq("action", action);
  }

  if (entityType) {
    query = query.eq("entityType", entityType);
  }

  const { data: entries, count, error } = await query;

  if (error) {
    console.error("Failed to fetch audit log entries:", error);
    return NextResponse.json(
      { error: "Failed to fetch audit log entries" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    entries: entries ?? [],
    total: count ?? 0,
    limit,
    offset,
  });
}
