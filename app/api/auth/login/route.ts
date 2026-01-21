import { NextResponse } from "next/server"
import { loginUser } from "@/lib/auth"
import { rateLimit, getClientIp } from "@/lib/rate-limit"
import { logAudit } from "@/lib/audit-log"

export async function POST(request: Request) {
  const clientIp = getClientIp(request)

  // Rate limit: 5 login attempts per minute
  const rateLimitResult = rateLimit(`login:${clientIp}`, {
    maxRequests: 5,
    windowMs: 60000,
  })

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: `Muitas tentativas. Tente novamente em ${Math.ceil(rateLimitResult.resetIn / 1000)} segundos.` },
      { status: 429 }
    )
  }

  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email e senha são obrigatórios" },
        { status: 400 }
      )
    }

    const result = await loginUser(email, password)

    if (!result.success) {
      await logAudit({
        action: "login_failed",
        details: { email },
        ipAddress: clientIp,
      })

      return NextResponse.json(
        { error: result.error },
        { status: 401 }
      )
    }

    await logAudit({
      action: "login_success",
      details: { email, userId: result.user?.id },
      ipAddress: clientIp,
    })

    return NextResponse.json({ 
      success: true, 
      user: result.user 
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
