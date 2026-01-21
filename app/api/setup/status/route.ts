import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await getSupabaseServerClient()

    const { data: settings } = await supabase
      .from("settings")
      .select("setup_completed")
      .maybeSingle()

    return NextResponse.json({
      configured: settings?.setup_completed || false,
    })
  } catch (error) {
    console.error("Setup status error:", error)
    return NextResponse.json({ configured: false })
  }
}
