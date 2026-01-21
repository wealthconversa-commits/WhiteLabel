import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { decrypt } from "@/lib/encryption"
import { logAudit } from "@/lib/audit-log"
import { rateLimit, getClientIp } from "@/lib/rate-limit"
import { getCurrentUser } from "@/lib/auth"

export async function POST(request: Request) {
  const clientIp = getClientIp(request)

  // Rate limit: 20 requests per minute (QR codes may need frequent refresh)
  const rateLimitResult = rateLimit(`connect:${clientIp}`, {
    maxRequests: 20,
    windowMs: 60000,
  })

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: `Muitas requisicoes. Tente novamente em ${Math.ceil(rateLimitResult.resetIn / 1000)} segundos.` },
      { status: 429 }
    )
  }

  try {
    const supabase = await getSupabaseServerClient()
    
    // Get current user
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: "Usuario nao autenticado" },
        { status: 401 }
      )
    }

    // Get admin settings (Evolution API credentials are stored only in admin settings)
    const { data: adminUser } = await supabase
      .from("users")
      .select("id")
      .eq("role", "ADMIN")
      .maybeSingle()

    if (!adminUser) {
      return NextResponse.json(
        { error: "Configuracoes de admin nao encontradas" },
        { status: 400 }
      )
    }

    const { data: settings } = await supabase
      .from("settings")
      .select("evolution_url, evolution_token, instance_name")
      .eq("user_id", adminUser.id)
      .maybeSingle()

    if (!settings) {
      return NextResponse.json(
        { error: "Configuracoes nao encontradas. Complete o setup primeiro." },
        { status: 400 }
      )
    }

    // Get user's current instance
    const { data: instances } = await supabase
      .from("instances")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)

    if (!instances || instances.length === 0) {
      return NextResponse.json(
        { error: "Nenhuma instancia encontrada. Crie uma instancia primeiro." },
        { status: 400 }
      )
    }

    const instance = instances[0]
    const instanceName = instance.instance_name

    // Decrypt credentials
    const evolutionUrl = decrypt(settings.evolution_url)
    const evolutionToken = decrypt(settings.evolution_token)
    const baseUrl = evolutionUrl.replace(/\/+$/, "")

    // Request QR code from Evolution API
    const response = await fetch(
      `${baseUrl}/instance/connect/${instanceName}`,
      {
        method: "GET",
        headers: {
          "apikey": evolutionToken,
          "Content-Type": "application/json",
        },
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error("[v0] Evolution API error:", errorData)
      return NextResponse.json(
        { error: errorData.message || "Falha ao gerar QR code" },
        { status: response.status }
      )
    }

    const data = await response.json()

    // The QR code can come in different formats depending on Evolution API version
    let qrCode = null
    
    if (data.base64) {
      qrCode = data.base64.startsWith("data:image") 
        ? data.base64 
        : `data:image/png;base64,${data.base64}`
    } else if (data.qrcode?.base64) {
      qrCode = data.qrcode.base64.startsWith("data:image")
        ? data.qrcode.base64
        : `data:image/png;base64,${data.qrcode.base64}`
    } else if (data.code) {
      // If only a code is returned, not a base64 image
      qrCode = data.code
    }

    if (!qrCode) {
      // Check if already connected
      if (data.instance?.state === "open") {
        return NextResponse.json({
          status: "connected",
          message: "WhatsApp ja esta conectado",
        })
      }

      return NextResponse.json(
        { error: "Nenhum QR code recebido da API" },
        { status: 500 }
      )
    }

    // Log the action
    await logAudit({
      action: "qr_code_generated",
      details: { instanceName },
      ipAddress: clientIp,
      userId: user.id,
    })

    return NextResponse.json({
      qrCode,
      instanceName,
    })
  } catch (error) {
    console.error("[v0] Connect error:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
