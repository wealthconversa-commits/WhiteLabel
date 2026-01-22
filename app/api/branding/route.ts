import { NextResponse } from "next/server"
import { getSupabaseServiceClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth"

/**
 * GET /api/branding
 * 
 * Retrieves the branding config for the authenticated user.
 * 
 * Uses SERVICE_ROLE client to read branding bypassing RLS.
 * If SERVICE_ROLE_KEY is not configured, returns default branding.
 * 
 * Flow:
 * 1. Get current user (via custom auth: cookie → sessions → users)
 * 2. Read branding from database
 * 3. Return branding or default
 */
export async function GET() {
  try {
    // Validate user exists and is authenticated
    const user = await getCurrentUser()
    
    // If not authenticated, return default branding
    if (!user) {
      return NextResponse.json({
        id: null,
        logo_url: null,
        primary_color: "oklch(0.55 0.18 145)",
        secondary_color: "oklch(0.96 0.01 145)",
        app_name: "WhatsApp",
      })
    }

    // Require SERVICE_ROLE_KEY for reading branding
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("[v0] SUPABASE_SERVICE_ROLE_KEY not configured for GET /api/branding")
      return NextResponse.json(
        { error: "Server configuration incomplete" },
        { status: 500 }
      )
    }

    // Use SERVICE_ROLE client to bypass RLS
    const supabase = getSupabaseServiceClient()

    // Read user's branding
    const { data: branding, error } = await supabase
      .from("branding")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()

    if (error) {
      console.error("[v0] Branding GET query error:", error)
      return NextResponse.json(
        { error: "Failed to fetch branding" },
        { status: 500 }
      )
    }

    // Return branding if exists, otherwise return default
    if (!branding) {
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
    console.error("[v0] GET /api/branding error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/branding
 * 
 * Updates the branding config. Only ADMIN role can update.
 * 
 * Uses SERVICE_ROLE client to write to branding bypassing RLS.
 * 
 * Flow:
 * 1. Validate user is authenticated (custom auth)
 * 2. Validate user has ADMIN role
 * 3. Validate SERVICE_ROLE_KEY is configured
 * 4. INSERT or UPDATE branding
 * 5. Log the action
 */
export async function PUT(request: Request) {
  try {
    // Parse request body
    const body = await request.json()
    const { appName, logoUrl, primaryColor, secondaryColor } = body

    // Step 1: Validate user is authenticated via custom auth
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      )
    }

    // Step 2: Validate user is ADMIN
    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Permission denied. Only administrators can update branding." },
        { status: 403 }
      )
    }

    // Step 3: Validate SERVICE_ROLE_KEY is configured
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("[v0] SUPABASE_SERVICE_ROLE_KEY not configured")
      return NextResponse.json(
        { error: "Server configuration incomplete" },
        { status: 500 }
      )
    }

    // Step 4: Use SERVICE_ROLE client for write operations (bypasses RLS)
    const supabase = getSupabaseServiceClient()

    // Check if branding already exists for this user
    const { data: existingBranding, error: checkError } = await supabase
      .from("branding")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle()

    if (checkError) {
      console.error("[v0] Branding check query error:", checkError)
      return NextResponse.json(
        { error: "Failed to check existing branding" },
        { status: 500 }
      )
    }

    // Prepare branding data
    const brandingData = {
      user_id: user.id,
      app_name: appName || "WhatsApp",
      logo_url: logoUrl || null,
      primary_color: primaryColor || "oklch(0.55 0.18 145)",
      secondary_color: secondaryColor || "oklch(0.96 0.01 145)",
      updated_at: new Date().toISOString(),
    }

    let writeError = null

    // INSERT or UPDATE
    if (existingBranding) {
      const result = await supabase
        .from("branding")
        .update(brandingData)
        .eq("user_id", user.id)

      writeError = result.error
    } else {
      const result = await supabase
        .from("branding")
        .insert(brandingData)

      writeError = result.error
    }

    if (writeError) {
      console.error("[v0] Branding write error:", writeError)
      return NextResponse.json(
        { error: "Failed to save branding" },
        { status: 500 }
      )
    }

    // Step 5: Log the action for audit trail
    await supabase.from("audit_logs").insert({
      action: "branding_updated",
      user_id: user.id,
      details: {
        app_name: appName,
        timestamp: new Date().toISOString(),
      },
    }).catch((error) => {
      // Log error but don't fail the request if audit log fails
      console.error("[v0] Failed to insert audit log:", error)
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] PUT /api/branding error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
