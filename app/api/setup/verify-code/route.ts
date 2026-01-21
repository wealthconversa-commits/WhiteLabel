import { NextResponse } from "next/server"
import { rateLimit, getClientIp } from "@/lib/rate-limit"
import { logAudit } from "@/lib/audit-log"

export async function POST(request: Request) {
  const clientIp = getClientIp(request)

  // Rate limit: 5 attempts per minute per IP
  const rateLimitResult = rateLimit(`setup-code:${clientIp}`, {
    maxRequests: 5,
    windowMs: 60000,
  })

  if (!rateLimitResult.success) {
    return NextResponse.json(
      {
        valid: false,
        error: `Too many attempts. Try again in ${Math.ceil(rateLimitResult.resetIn / 1000)} seconds.`,
      },
      { status: 429 }
    )
  }

  try {
    const body = await request.json()
    const { code } = body

    if (!code) {
      return NextResponse.json({ valid: false, error: "Setup code is required" }, { status: 400 })
    }

    const setupCode = process.env.SETUP_CODE

    // If no setup code is configured, allow access
    if (!setupCode) {
      return NextResponse.json({ valid: true })
    }

    // Verify the code
    if (code === setupCode) {
      await logAudit({
        action: "setup_code_verified",
        ipAddress: clientIp,
      })
      return NextResponse.json({ valid: true })
    }

    await logAudit({
      action: "setup_code_failed",
      details: { attempts: 5 - rateLimitResult.remaining },
      ipAddress: clientIp,
    })

    return NextResponse.json({ valid: false, error: "Invalid setup code" }, { status: 401 })
  } catch {
    return NextResponse.json({ valid: false, error: "Invalid request" }, { status: 400 })
  }
}
