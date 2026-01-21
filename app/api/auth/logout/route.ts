import { NextResponse } from "next/server"
import { deleteSession, getCurrentUser } from "@/lib/auth"
import { logAudit } from "@/lib/audit-log"
import { getClientIp } from "@/lib/rate-limit"

export async function POST(request: Request) {
  const clientIp = getClientIp(request)

  try {
    const user = await getCurrentUser()

    await deleteSession()

    if (user) {
      await logAudit({
        action: "logout",
        details: { userId: user.id, email: user.email },
        ipAddress: clientIp,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json(
      { error: "Erro ao fazer logout" },
      { status: 500 }
    )
  }
}
