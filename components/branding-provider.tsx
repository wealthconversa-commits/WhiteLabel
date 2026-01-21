"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import type { Branding } from "@/lib/types"

interface BrandingContextType {
  branding: Branding | null
  isLoading: boolean
  refetch: () => Promise<void>
}

const BrandingContext = createContext<BrandingContextType>({
  branding: null,
  isLoading: true,
  refetch: async () => {},
})

export function useBranding() {
  return useContext(BrandingContext)
}

export function BrandingProvider({ children }: { children: ReactNode }) {
  const [branding, setBranding] = useState<Branding | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchBranding = async () => {
    try {
      const response = await fetch("/api/branding")
      if (response.ok) {
        const data = await response.json()
        setBranding(data)
        applyBrandingStyles(data)
      }
    } catch (error) {
      console.error("Failed to fetch branding:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const applyBrandingStyles = (brandingData: Branding) => {
    if (!brandingData) return

    const root = document.documentElement

    if (brandingData.primary_color) {
      root.style.setProperty("--primary", brandingData.primary_color)
      root.style.setProperty("--ring", brandingData.primary_color)
      root.style.setProperty("--sidebar-primary", brandingData.primary_color)
    }

    if (brandingData.secondary_color) {
      root.style.setProperty("--secondary", brandingData.secondary_color)
      root.style.setProperty("--accent", brandingData.secondary_color)
    }
  }

  useEffect(() => {
    fetchBranding()
  }, [])

  return (
    <BrandingContext.Provider value={{ branding, isLoading, refetch: fetchBranding }}>
      {children}
    </BrandingContext.Provider>
  )
}
