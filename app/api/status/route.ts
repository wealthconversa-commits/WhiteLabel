import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { decrypt } from "@/lib/encryption"
import { getCurrentUser } from "@/lib/auth"

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

    // Get first active instance for this user
    const { data: instances, error: instancesError } = await supabase
      .from("instances")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)

    if (instancesError || !instances || instances.length === 0) {
      return NextResponse.json({
        status: "disconnected",
        instanceName: null,
        instanceId: null,
        hasInstance: false,
      })
    }

    const instance = instances[0]

    // If no instance name exists yet
    if (!instance.instance_name) {
      return NextResponse.json({
        status: "disconnected",
        instanceName: null,
        instanceId: null,
        hasInstance: false,
      })
    }

    // Get admin settings to access Evolution API credentials
    const { data: adminUser } = await supabase
      .from("users")
      .select("id")
      .eq("role", "ADMIN")
      .maybeSingle()

    if (!adminUser) {
      return NextResponse.json({
        status: "disconnected",
        instanceName: null,
        hasInstance: false,
      })
    }

    const { data: settings } = await supabase
      .from("settings")
      .select("evolution_url, evolution_token")
      .eq("user_id", adminUser.id)
      .maybeSingle()

    if (!settings) {
      return NextResponse.json({
        status: "disconnected",
        instanceName: instance.instance_name,
        hasInstance: true,
      })
    }

    // Decrypt credentials
    const evolutionUrl = decrypt(settings.evolution_url)
    const evolutionToken = decrypt(settings.evolution_token)
    const baseUrl = evolutionUrl.replace(/\/+$/, "")

    // Check connection state with Evolution API
    try {
      const response = await fetch(
        `${baseUrl}/instance/connectionState/${instance.instance_name}`,
        {
          method: "GET",
          headers: {
            "apikey": evolutionToken,
            "Content-Type": "application/json",
          },
        }
      )

      // If instance doesn't exist in Evolution API (404), mark as disconnected
      if (response.status === 404) {
        return NextResponse.json({
          status: "disconnected",
          instanceName: instance.instance_name,
          instanceId: instance.id,
          hasInstance: true,
        })
      }

      if (response.ok) {
        const data = await response.json()
        const state = data?.instance?.state || data?.state

        return NextResponse.json({
          status: state === "open" ? "connected" : state === "connecting" ? "conectando" : "disconnected",
          instanceName: instance.instance_name,
          instanceId: instance.id,
          hasInstance: true,
        })
      }

      // Handle other non-ok responses
      console.log("[v0] Evolution API returned non-ok status:", response.status)
      return NextResponse.json({
        status: "disconnected",
        instanceName: instance.instance_name,
        instanceId: instance.id,
        hasInstance: true,
      })
    } catch (fetchError) {
      console.error("[v0] Evolution API fetch error:", fetchError)
      return NextResponse.json({
        status: "disconnected",
        instanceName: instance.instance_name,
        instanceId: instance.id,
        hasInstance: true,
      })
    }
  } catch (error) {
    console.error("[v0] Status check error:", error)
    return NextResponse.json(
      { status: "disconnected", instanceName: null, hasInstance: false },
      { status: 500 }
    )
  }
}
