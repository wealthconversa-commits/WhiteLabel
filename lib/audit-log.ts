import { getSupabaseServerClient } from "@/lib/supabase/server"

export type AuditAction =
  | "setup_started"
  | "setup_completed"
  | "credentials_updated"
  | "connection_test"
  | "instance_created"
  | "instance_deleted"
  | "whatsapp_connected"
  | "whatsapp_disconnected"
  | "qr_code_generated"
  | "branding_updated"
  | "setup_code_verified"
  | "setup_code_failed"

interface AuditLogEntry {
  action: AuditAction
  details?: Record<string, unknown>
  ipAddress?: string
}

export async function logAudit(entry: AuditLogEntry): Promise<void> {
  try {
    const supabase = await getSupabaseServerClient()

    await supabase.from("audit_logs").insert({
      action: entry.action,
      details: entry.details || {},
      ip_address: entry.ipAddress || "unknown",
    })
  } catch (error) {
    // Log to console but don't throw - audit logging should never break the app
    console.error("[Audit] Failed to log:", error)
  }
}
