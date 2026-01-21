import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth"
import { decrypt } from "@/lib/encryption"

export async function GET() {
  try {
    const supabase = await getSupabaseServerClient()
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user instances
    const { data: instances } = await supabase
      .from("instances")
      .select("id, instance_name, status")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (!instances || instances.length === 0) {
      return NextResponse.json({ instances: [] })
    }

    // Get admin settings to check actual status with Evolution API
    const { data: adminUser } = await supabase
      .from("users")
      .select("id")
      .eq("role", "ADMIN")
      .maybeSingle()

    if (!adminUser || !instances) {
      return NextResponse.json({ instances: instances || [] })
    }

    const { data: settings } = await supabase
      .from("settings")
      .select("evolution_url, evolution_token")
      .eq("user_id", adminUser.id)
      .maybeSingle()

    if (!settings) {
      return NextResponse.json({ instances: instances || [] })
    }

    // Check each instance status with Evolution API
    const evolutionUrl = decrypt(settings.evolution_url)
    const evolutionToken = decrypt(settings.evolution_token)
    const baseUrl = evolutionUrl.replace(/\/+$/, "")

    const updatedInstances = instances.map((instance) => ({
      ...instance,
      status: instance.status || "disconnected",
    }))

    // Update statuses asynchronously without waiting
    Promise.all(
      instances.map(async (instance) => {
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

          let newStatus = "disconnected"

          if (response.ok) {
            const data = await response.json()
            const state = data?.instance?.state || data?.state
            newStatus = state === "open" ? "connected" : "disconnected"
          }

          if (newStatus !== instance.status) {
            await supabase
              .from("instances")
              .update({ status: newStatus })
              .eq("id", instance.id)
          }
        } catch {
          // Silently fail, keep current status
        }
      })
    ).catch(() => {})

    return NextResponse.json({ instances: updatedInstances })
  } catch (error) {
    return NextResponse.json({ instances: [] })
  }
}
