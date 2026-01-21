import React from "react"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { AdminHeader } from "@/components/admin/admin-header"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  // Check if user is logged in and is admin
  if (!user) {
    redirect("/login")
  }

  if (user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  if (user.status !== "APPROVED") {
    redirect("/pending")
  }

  // Get branding
  const supabase = await getSupabaseServerClient()
  const { data: branding } = await supabase
    .from("branding")
    .select("*")
    .maybeSingle()

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader
        userName={user.responsible_name}
        appName={branding?.app_name}
        logoUrl={branding?.logo_url}
      />
      <main className="container py-6">{children}</main>
    </div>
  )
}
