import { redirect } from "next/navigation"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { SetupWrapper } from "@/components/setup/setup-wrapper"

export default async function SetupPage() {
  const supabase = await getSupabaseServerClient()

  // Check if setup is already completed - use maybeSingle to handle empty table
  const { data: settings } = await supabase
    .from("settings")
    .select("setup_completed")
    .maybeSingle()

  // If setup is already completed, redirect to dashboard
  // unless ALLOW_SETUP env var is set to true
  if (settings?.setup_completed && process.env.ALLOW_SETUP !== "true") {
    redirect("/dashboard")
  }

  // Check if a setup code is required
  const requireCode = !!process.env.SETUP_CODE

  return <SetupWrapper requireCode={requireCode} />
}
