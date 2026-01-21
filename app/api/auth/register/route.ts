import { NextResponse } from "next/server"
import { registerUser, createSession } from "@/lib/auth"
import { rateLimit, getClientIp } from "@/lib/rate-limit"
import { logAudit } from "@/lib/audit-log"

export async function POST(request: Request) {
  const clientIp = getClientIp(request)

  // Rate limit: 3 registration attempts per minute
  const rateLimitResult = rateLimit(`register:${clientIp}`, {
    maxRequests: 3,
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
    const { companyName, responsibleName, email, password } = body

    if (!companyName || !responsibleName || !email || !password) {
      return NextResponse.json(
        { error: "Todos os campos sao obrigatorios" },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "A senha deve ter pelo menos 8 caracteres" },
        { status: 400 }
      )
    }

    const result = await registerUser(email, password, companyName, responsibleName)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    // Create session for the new user
    if (result.user) {
      await createSession(result.user.id)
    }

    await logAudit({
      action: "user_registered",
      details: { 
        email, 
        userId: result.user?.id,
        role: result.user?.role,
        status: result.user?.status,
      },
      ipAddress: clientIp,
    })

    return NextResponse.json({ 
      success: true, 
      user: result.user 
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
