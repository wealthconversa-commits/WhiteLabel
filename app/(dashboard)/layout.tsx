import React from "react"
import { redirect } from "next/navigation"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth"
import { BrandingProvider } from "@/components/branding-provider"
import { UserHeader } from "@/components/user-header"
import { BottomNav } from "@/components/bottom-nav"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Check authentication
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  // Redirect pending users
  if (user.status === "PENDING") {
    redirect("/pending")
  }

  // Redirect suspended users
  if (user.status === "SUSPENDED") {
    redirect("/login")
  }

  // Redirect admins to admin panel
  if (user.role === "ADMIN") {
    redirect("/admin")
  }

  const supabase = await getSupabaseServerClient()

  // Only check setup for admin users - regular users should have access immediately
  if (user.role === "ADMIN") {
    // Check if setup is completed for admin
    const { data: settings } = await supabase
      .from("settings")
      .select("setup_completed")
      .eq("user_id", user.id)
      .maybeSingle()

    // If setup is not completed, show message
    if (!settings?.setup_completed) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Sistema em Configuração</h1>
            <p className="text-muted-foreground">
              O administrador ainda está configurando o sistema. Por favor, tente novamente mais tarde.
            </p>
          </div>
        </div>
      )
    }
  }

  // Get branding from admin (global theme) for all regular users
  const { data: adminUser } = await supabase
    .from("users")
    .select("id")
    .eq("role", "ADMIN")
    .maybeSingle()

  let branding = null
  if (adminUser) {
    const { data: adminBranding } = await supabase
      .from("branding")
      .select("*")
      .eq("user_id", adminUser.id)
      .maybeSingle()
    branding = adminBranding
  }

  return (
    <BrandingProvider>
      <div className="min-h-screen flex flex-col bg-background">
        <UserHeader 
          userName={user.responsible_name}
          appName={branding?.app_name}
          logoUrl={branding?.logo_url}
        />
        <main className="flex-1 pb-24 md:pb-0 overflow-y-auto max-w-screen-sm mx-auto w-full">
          {children}
        </main>
        <BottomNav />
      </div>
    </BrandingProvider>
  )
}
