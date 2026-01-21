import React from "react"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Get branding for public pages
  const supabase = await getSupabaseServerClient()
  const { data: branding } = await supabase
    .from("branding")
    .select("*")
    .maybeSingle()

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center bg-background p-4 md:p-8"
      style={{
        ["--primary" as string]: branding?.primary_color ? branding.primary_color : undefined,
        ["--secondary" as string]: branding?.secondary_color ? branding.secondary_color : undefined,
      }}
    >
      <div className="w-full max-w-sm md:max-w-md">
        {branding?.logo_url && (
          <div className="flex justify-center mb-6 md:mb-8">
            <img 
              src={branding.logo_url || "/placeholder.svg"} 
              alt={branding.app_name || "Logo"} 
              className="h-10 md:h-12 object-contain"
            />
          </div>
        )}
        {branding?.app_name && !branding?.logo_url && (
          <h1 className="text-xl md:text-2xl font-bold text-center mb-6 md:mb-8">
            {branding.app_name}
          </h1>
        )}
        <div className="space-y-4">
          {children}
        </div>
      </div>
    </div>
  )
}
