"use client"

import { createBrowserClient } from "@supabase/ssr"

// Singleton pattern: client instance persists for entire app lifetime
let browserClient: ReturnType<typeof createBrowserClient> | undefined

// Factory function - called only once
function createClient() {
  if (browserClient) {
    return browserClient
  }

  // Suppress Supabase GoTrueClient warning about multiple instances
  // This is expected behavior in SSR context with hydration
  const originalWarn = console.warn
  console.warn = (...args: any[]) => {
    const message = args[0]?.toString?.() || ""
    if (message.includes("Multiple GoTrueClient instances")) {
      return
    }
    originalWarn(...args)
  }

  browserClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Restore original console.warn
  console.warn = originalWarn

  return browserClient
}

// Export singleton instance
export const supabase = createClient()
