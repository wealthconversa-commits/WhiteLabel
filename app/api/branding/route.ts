import { NextResponse } from "next/server"
import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth"

export async function GET() {
  try {
    // Get current user
    const user = await getCurrentUser()
    if (!user) {
      // Return default branding if not authenticated
      return NextResponse.json({
        id: null,
        logo_url: null,
        primary_color: "oklch(0.55 0.18 145)",
        secondary_color: "oklch(0.96 0.01 145)",
        app_name: "WhatsApp",
      })
    }

    let branding = null
    let error = null

    // Try using SERVICE ROLE client first (bypasses RLS if available)
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const supabaseService = getSupabaseServiceClient()
      const result = await supabaseService
        .from("branding")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle()
      
      branding = result.data
      error = result.error
    } else {
      // Fallback: use regular server client
      const supabaseRegular = await getSupabaseServerClient()
      const result = await supabaseRegular
        .from("branding")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle()
      
      branding = result.data
      error = result.error
    }

    if (error) {
      console.error("[v0] Branding GET error:", error)
    }

    if (!branding) {
      // Return default branding if none exists
      return NextResponse.json({
        id: null,
        logo_url: null,
        primary_color: "oklch(0.55 0.18 145)",
        secondary_color: "oklch(0.96 0.01 145)",
        app_name: "WhatsApp",
      })
    }

    return NextResponse.json(branding)
  } catch (error) {
    console.error("[v0] Get branding error:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { appName, logoUrl, primaryColor, secondaryColor } = body

    // Get current user using custom auth (cookie → sessions → users)
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: "Usuario nao autenticado" },
        { status: 401 }
      )
    }

    // Only ADMIN can update branding
    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Permissao negada. Apenas administradores podem alterar o branding." },
        { status: 403 }
      )
    }

    // Use SERVICE ROLE client for write operations (bypasses RLS)
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("[v0] SUPABASE_SERVICE_ROLE_KEY not configured")
      return NextResponse.json(
        { error: "Configuracao do servidor incompleta" },
        { status: 500 }
      )
    }

    const supabase = getSupabaseServiceClient()

    // Check if branding exists for this user
    const { data: existingBranding } = await supabase
      .from("branding")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle()

    const brandingData = {
      user_id: user.id,
      app_name: appName || "WhatsApp Manager",
      logo_url: logoUrl || null,
      primary_color: primaryColor || "oklch(0.55 0.18 145)",
      secondary_color: secondaryColor || "oklch(0.96 0.01 145)",
      updated_at: new Date().toISOString(),
    }

    if (existingBranding) {
      const { error } = await supabase
        .from("branding")
        .update(brandingData)
        .eq("user_id", user.id)

      if (error) {
        console.error("[v0] Branding update error:", error)
        return NextResponse.json(
          { error: "Falha ao atualizar personalizacao" },
          { status: 500 }
        )
      }
    } else {
      const { error } = await supabase
        .from("branding")
        .insert(brandingData)

      if (error) {
        console.error("[v0] Branding insert error:", error)
        return NextResponse.json(
          { error: "Falha ao salvar personalizacao" },
          { status: 500 }
        )
      }
    }

    // Log the action
    await supabase.from("audit_logs").insert({
      action: "branding_updated",
      user_id: user.id,
      details: { 
        appName,
        timestamp: new Date().toISOString() 
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Update branding error:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
