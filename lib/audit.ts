import { supabaseAdmin as supabase } from "@/lib/supabase";

export async function logAudit(params: {
  orgId: string;
  userId: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: Record<string, unknown>;
}) {
  try {
    const { error } = await supabase.from("AuditLog").insert({
      orgId: params.orgId,
      userId: params.userId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId ?? null,
      details: params.details ?? null,
    });

    if (error) {
      console.error("Failed to write audit log entry:", error);
    }
  } catch (err) {
    console.error("Unexpected error writing audit log entry:", err);
  }
}
