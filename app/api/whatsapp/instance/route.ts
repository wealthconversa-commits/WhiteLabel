import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { decrypt } from "@/lib/encryption"
import { logAudit } from "@/lib/audit-log"
import { rateLimit, getClientIp } from "@/lib/rate-limit"
import { getCurrentUser } from "@/lib/auth"

// Create a new WhatsApp instance
export async function POST(request: Request) {
  const clientIp = getClientIp(request)

  // Rate limit: 10 requests per minute
  const rateLimitResult = rateLimit(`instance:${clientIp}`, {
    maxRequests: 10,
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
      .select("id, evolution_url, evolution_token, instance_name")
      .eq("user_id", adminUser.id)
      .maybeSingle()

    if (!settings) {
      return NextResponse.json(
        { error: "Configuracoes nao encontradas. Complete o setup primeiro." },
        { status: 400 }
      )
    }

    // Check if user already has 2 instances
    const { data: userInstances } = await supabase
      .from("instances")
      .select("id")
      .eq("user_id", user.id)

    if (userInstances && userInstances.length >= 2) {
      return NextResponse.json(
        { error: "Voce pode criar no maximo 2 instancias" },
        { status: 400 }
      )
    }

    // Decrypt credentials
    const evolutionUrl = decrypt(settings.evolution_url)
    const evolutionToken = decrypt(settings.evolution_token)
    const baseUrl = evolutionUrl.replace(/\/+$/, "")

    // Generate a unique instance name using user's company name
    // Remove spaces and special characters, convert to lowercase
    const userPrefix = (user.company_name || user.responsible_name || "user")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .substring(0, 20) // Limit to 20 chars
    
    const instanceName = `${userPrefix}_${Date.now()}`

    // Create instance in Evolution API
    const response = await fetch(`${baseUrl}/instance/create`, {
      method: "POST",
      headers: {
        "apikey": evolutionToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        instanceName,
        qrcode: true,
        integration: "WHATSAPP-BAILEYS",
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error("Evolution API error:", errorData)
      return NextResponse.json(
        { error: errorData.message || "Failed to create instance" },
        { status: response.status }
      )
    }

    const data = await response.json()

    // Save instance info to database in the new instances table
    const { data: newInstance, error: insertError } = await supabase
      .from("instances")
      .insert({
        user_id: user.id,
        instance_name: instanceName,
        instance_id: data.instance?.instanceId || data.hash || instanceName,
        display_name: instanceName,
        status: "created",
      })
      .select()
      .single()

    if (insertError) {
      console.error("[v0] Failed to save instance info:", insertError)
      return NextResponse.json(
        { error: "Falha ao salvar instancia no banco de dados" },
        { status: 500 }
      )
    }

    // Log the action
    await logAudit({
      action: "instance_created",
      details: { instanceName },
      ipAddress: clientIp,
    })

    return NextResponse.json({
      success: true,
      instanceName,
      instanceId: data.instance?.instanceId || data.hash,
    })
  } catch (error) {
    console.error("Create instance error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// List instances for current user
export async function GET() {
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

    // Get all instances for this user
    const { data: instances, error } = await supabase
      .from("instances")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Failed to fetch instances:", error)
      return NextResponse.json(
        { error: "Falha ao recuperar instancias" },
        { status: 500 }
      )
    }

    return NextResponse.json({ instances: instances || [] })
  } catch (error) {
    console.error("[v0] List instances error:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
export async function DELETE(request: Request) {
  const clientIp = getClientIp(request)

  // Rate limit: 5 requests per minute
  const rateLimitResult = rateLimit(`instance-delete:${clientIp}`, {
    maxRequests: 5,
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

    // Get instance ID from query params
    const url = new URL(request.url)
    const instanceId = url.searchParams.get("id")

    if (!instanceId) {
      return NextResponse.json(
        { error: "ID da instancia nao fornecido" },
        { status: 400 }
      )
    }

    // Get instance from database - verify it belongs to current user
    const { data: instance, error: fetchError } = await supabase
      .from("instances")
      .select("*")
      .eq("id", instanceId)
      .eq("user_id", user.id)
      .maybeSingle()

    if (fetchError || !instance) {
      return NextResponse.json(
        { error: "Instancia nao encontrada" },
        { status: 404 }
      )
    }

    // Get admin settings (Evolution API credentials are stored only in admin settings)
    const { data: adminUser } = await supabase
      .from("users")
      .select("id")
      .eq("role", "ADMIN")
      .maybeSingle()

    let settings
    if (adminUser) {
      const { data: adminSettings } = await supabase
        .from("settings")
        .select("evolution_url, evolution_token")
        .eq("user_id", adminUser.id)
        .maybeSingle()
      settings = adminSettings
    }

    if (settings) {
      // Decrypt credentials
      const evolutionUrl = decrypt(settings.evolution_url)
      const evolutionToken = decrypt(settings.evolution_token)
      const baseUrl = evolutionUrl.replace(/\/+$/, "")

      // Delete instance in Evolution API (fire and forget)
      fetch(
        `${baseUrl}/instance/delete/${instance.instance_name}`,
        {
          method: "DELETE",
          headers: {
            "apikey": evolutionToken,
            "Content-Type": "application/json",
          },
        }
      ).catch(() => {})
    }

    // Delete from database immediately
    const { error: deleteError } = await supabase
      .from("instances")
      .delete()
      .eq("id", instanceId)
      .eq("user_id", user.id)

    if (deleteError) {
      console.error("[v0] Failed to delete instance:", deleteError)
      return NextResponse.json(
        { error: "Falha ao deletar instancia" },
        { status: 500 }
      )
    }

    // Log the action
    await logAudit({
      action: "instance_deleted",
      details: { instanceName: instance.instance_name },
      ipAddress: clientIp,
      userId: user.id,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Delete instance error:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
