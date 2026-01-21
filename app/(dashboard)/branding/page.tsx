import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { BrandingForm } from "@/components/branding/branding-form"

export default async function BrandingPage() {
  // Get current user
  const user = await getCurrentUser()

  // Only admins can access branding
  if (!user || user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  return <BrandingForm />
}
