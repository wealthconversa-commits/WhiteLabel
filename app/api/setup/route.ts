import { NextResponse } from "next/server"
import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabase/server"
import { encrypt } from "@/lib/encryption"
import { rateLimit, getClientIp } from "@/lib/rate-limit"
import { logAudit } from "@/lib/audit-log"
import { hashPassword } from "@/lib/auth"

export async function POST(request: Request) {
  const clientIp = getClientIp(request)

  // Rate limit: 5 requests per minute per IP
  const rateLimitResult = rateLimit(`setup:${clientIp}`, {
    maxRequests: 5,
    windowMs: 60000,
  })

  if (!rateLimitResult.success) {
    return NextResponse.json(
      {
        error: `Muitas requisicoes. Tente novamente em ${Math.ceil(rateLimitResult.resetIn / 1000)} segundos.`,
      },
      { status: 429 }
    )
  }

  try {
    const body = await request.json()
    const { 
      adminCompanyName,
      adminResponsibleName, 
      adminEmail, 
      adminPassword,
      evolutionUrl, 
      evolutionToken, 
      appName, 
      primaryColor, 
      secondaryColor 
    } = body

    // Validate admin credentials
    if (!adminCompanyName || !adminResponsibleName || !adminEmail || !adminPassword) {
      return NextResponse.json(
        { error: "Credenciais do administrador sao obrigatorias" },
        { status: 400 }
      )
    }

    if (adminPassword.length < 8) {
      return NextResponse.json(
        { error: "A senha deve ter pelo menos 8 caracteres" },
        { status: 400 }
      )
    }

    if (!evolutionUrl || !evolutionToken) {
      return NextResponse.json(
        { error: "URL e token da Evolution sao obrigatorios" },
        { status: 400 }
      )
    }

    // Use SERVICE ROLE for initial setup (creating admin, settings, branding)
    const supabase = await getSupabaseServiceClient()

    // Check if admin already exists
    const { data: existingAdmin, error: adminCheckError } = await supabase
      .from("users")
      .select("id")
      .eq("role", "ADMIN")
      .maybeSingle()

    console.log("[v0] Admin check result:", { existingAdmin, adminCheckError })

    const adminName = adminResponsibleName; // Declare adminName variable

    if (!existingAdmin) {
      // Create admin user
      const passwordHash = await hashPassword(adminPassword)
      
      console.log("[v0] Creating new admin user:", { email: adminEmail, company: adminCompanyName })
      
      const { data: newAdmin, error: userError } = await supabase
        .from("users")
        .insert({
          company_name: adminCompanyName,
          responsible_name: adminResponsibleName,
          email: adminEmail.toLowerCase(),
          password_hash: passwordHash,
          role: "ADMIN",
          status: "APPROVED",
        })
        .select()
        .single()

      console.log("[v0] Admin creation result:", { newAdmin, userError })

      if (userError) {
        console.error("[v0] Admin creation error:", userError)
        if (userError.code === "23505") {
          return NextResponse.json(
            { error: "Este email ja esta em uso" },
            { status: 400 }
          )
        }
        return NextResponse.json(
          { error: "Falha ao criar conta de administrador: " + userError.message },
          { status: 500 }
        )
      }
    } else {
      console.log("[v0] Admin already exists, skipping creation")
    }

    // Get the admin user for settings association
    const { data: adminUser } = await supabase
      .from("users")
      .select("id")
      .eq("role", "ADMIN")
      .maybeSingle()

    console.log("[v0] Admin user found:", { adminUser })

    if (!adminUser) {
      console.error("[v0] No admin user found after creation or check")
      return NextResponse.json(
        { error: "Falha ao encontrar usuario admin" },
        { status: 500 }
      )
    }

    // Encrypt credentials before storing
    const encryptedUrl = encrypt(evolutionUrl)
    const encryptedToken = encrypt(evolutionToken)

    console.log("[v0] Credentials encrypted")

    // Check if settings already exist for admin user
    const { data: existingSettings } = await supabase
      .from("settings")
      .select("id")
      .eq("user_id", adminUser.id)
      .maybeSingle()

    console.log("[v0] Existing settings check:", { existingSettings })

    if (existingSettings) {
      // Update existing settings
      const { error: settingsError } = await supabase
        .from("settings")
        .update({
          evolution_url: encryptedUrl,
          evolution_token: encryptedToken,
          setup_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingSettings.id)

      console.log("[v0] Settings update result:", { settingsError })

      if (settingsError) {
        console.error("[v0] Settings update error:", settingsError)
        return NextResponse.json(
          { error: "Falha ao atualizar configuracoes: " + settingsError.message },
          { status: 500 }
        )
      }
    } else {
      // Insert new settings for admin user
      const { error: settingsError } = await supabase
        .from("settings")
        .insert({
          user_id: adminUser.id,
          evolution_url: encryptedUrl,
          evolution_token: encryptedToken,
          setup_completed: true,
        })

      console.log("[v0] Settings insert result:", { settingsError })

      if (settingsError) {
        console.error("[v0] Settings insert error:", settingsError)
        return NextResponse.json(
          { error: "Falha ao salvar configuracoes: " + settingsError.message },
          { status: 500 }
        )
      }
    }

    // Check if branding exists for admin user
    const { data: existingBranding } = await supabase
      .from("branding")
      .select("id")
      .eq("user_id", adminUser.id)
      .maybeSingle()

    console.log("[v0] Existing branding check:", { existingBranding })

    if (existingBranding) {
      // Update existing branding
      const { error: brandingError } = await supabase
        .from("branding")
        .update({
          app_name: appName || "WhatsApp Manager",
          primary_color: primaryColor || "oklch(0.55 0.18 145)",
          secondary_color: secondaryColor || "oklch(0.96 0.01 145)",
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingBranding.id)

      console.log("[v0] Branding update result:", { brandingError })

      if (brandingError) {
        console.error("[v0] Branding update error:", brandingError)
      }
    } else {
      // Insert new branding for admin user
      const { error: brandingError } = await supabase
        .from("branding")
        .insert({
          user_id: adminUser.id,
          app_name: appName || "WhatsApp Manager",
          primary_color: primaryColor || "oklch(0.55 0.18 145)",
          secondary_color: secondaryColor || "oklch(0.96 0.01 145)",
        })

      console.log("[v0] Branding insert result:", { brandingError })

      if (brandingError) {
        console.error("[v0] Branding insert error:", brandingError)
      }
    }

    // Log the setup action using audit logger
    console.log("[v0] Logging audit action")
    await logAudit({
      action: existingSettings ? "credentials_updated" : "setup_completed",
      details: { timestamp: new Date().toISOString() },
      ipAddress: clientIp,
      userId: adminUser.id,
    })

    console.log("[v0] Setup completed successfully")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Setup error:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    )
  }
}
