import { NextResponse } from "next/server"
import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabase/server"
import { getCurrentUser, isAdmin } from "@/lib/auth"
import { logAudit } from "@/lib/audit-log"
import { getClientIp } from "@/lib/rate-limit"

// Get all users
export async function GET() {
  try {
    const admin = await getCurrentUser()

    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Acesso não autorizado" },
        { status: 403 }
      )
    }

    const supabase = await getSupabaseServerClient()
    const { data: users, error } = await supabase
      .from("users")
      .select("id, email, company_name, responsible_name, role, status, created_at")
      .order("created_at", { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({ users })
  } catch (error) {
    console.error("Get users error:", error)
    return NextResponse.json(
      { error: "Erro ao buscar usuários" },
      { status: 500 }
    )
  }
}

// Update user status or role
export async function PATCH(request: Request) {
  const clientIp = getClientIp(request)

  try {
    const admin = await getCurrentUser()

    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Acesso não autorizado" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { userId, action, role } = body

    if (!userId || !action) {
      return NextResponse.json(
        { error: "userId e action são obrigatórios" },
        { status: 400 }
      )
    }

    // Prevent admin from modifying their own account
    if (userId === admin.id) {
      return NextResponse.json(
        { error: "Você não pode modificar sua própria conta" },
        { status: 400 }
      )
    }

    // Use SERVICE ROLE client for admin write operations
    const supabase = await getSupabaseServiceClient()
    let updateData: Record<string, string> = {}

    switch (action) {
      case "approve":
        updateData = { status: "APPROVED" }
        break
      case "suspend":
        updateData = { status: "SUSPENDED" }
        break
      case "reactivate":
        updateData = { status: "APPROVED" }
        break
      case "change_role":
        if (!role || !["ADMIN", "USER"].includes(role)) {
          return NextResponse.json(
            { error: "Role inválido" },
            { status: 400 }
          )
        }
        updateData = { role }
        break
      default:
        return NextResponse.json(
          { error: "Ação inválida" },
          { status: 400 }
        )
    }

    const { data: updatedUser, error } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", userId)
      .select("id, email, company_name, responsible_name, role, status")
      .single()

    if (error) {
      throw error
    }

    await logAudit({
      action: `user_${action}`,
      details: {
        adminId: admin.id,
        adminEmail: admin.email,
        targetUserId: userId,
        targetUserEmail: updatedUser.email,
        newStatus: updatedUser.status,
        newRole: updatedUser.role,
      },
      ipAddress: clientIp,
    })

    return NextResponse.json({ success: true, user: updatedUser })
  } catch (error) {
    console.error("Update user error:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar usuário" },
      { status: 500 }
    )
  }
}

// Delete user
export async function DELETE(request: Request) {
  const clientIp = getClientIp(request)

  try {
    const admin = await getCurrentUser()

    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Acesso não autorizado" },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json(
        { error: "userId é obrigatório" },
        { status: 400 }
      )
    }

    // Prevent admin from deleting their own account
    if (userId === admin.id) {
      return NextResponse.json(
        { error: "Você não pode excluir sua própria conta" },
        { status: 400 }
      )
    }

    const supabase = await getSupabaseServerClient()

    // Get user info before deleting
    const { data: user } = await supabase
      .from("users")
      .select("email")
      .eq("id", userId)
      .single()

    // Delete all instances for this user
    console.log("[v0] Deleting instances for user:", userId)
    const { error: instancesError } = await supabase
      .from("instances")
      .delete()
      .eq("user_id", userId)

    if (instancesError) {
      console.error("[v0] Error deleting instances:", instancesError)
    }

    // Delete user settings
    console.log("[v0] Deleting settings for user:", userId)
    const { error: settingsError } = await supabase
      .from("settings")
      .delete()
      .eq("user_id", userId)

    if (settingsError) {
      console.error("[v0] Error deleting settings:", settingsError)
    }

    // Delete user branding
    console.log("[v0] Deleting branding for user:", userId)
    const { error: brandingError } = await supabase
      .from("branding")
      .delete()
      .eq("user_id", userId)

    if (brandingError) {
      console.error("[v0] Error deleting branding:", brandingError)
    }

    // Delete user audit logs
    console.log("[v0] Deleting audit logs for user:", userId)
    await supabase.from("audit_logs").delete().eq("user_id", userId)

    // Delete user sessions
    console.log("[v0] Deleting sessions for user:", userId)
    await supabase.from("sessions").delete().eq("user_id", userId)

    // Delete user
    console.log("[v0] Deleting user:", userId)
    const { error: userError } = await supabase
      .from("users")
      .delete()
      .eq("id", userId)

    if (userError) {
      console.error("[v0] Error deleting user:", userError)
      throw userError
    }

    console.log("[v0] User deleted successfully with all related data")

    await logAudit({
      action: "user_deleted",
      details: {
        adminId: admin.id,
        adminEmail: admin.email,
        deletedUserId: userId,
        deletedUserEmail: user?.email,
        timestamp: new Date().toISOString(),
      },
      ipAddress: clientIp,
      userId: admin.id,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete user error:", error)
    return NextResponse.json(
      { error: "Erro ao excluir usuário" },
      { status: 500 }
    )
  }
}
