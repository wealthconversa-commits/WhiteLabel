import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"

export default async function Home() {
  const user = await getCurrentUser()

  // If logged in, redirect based on role and status
  if (user) {
    if (user.status === "PENDING") {
      redirect("/pending")
    } else if (user.status === "APPROVED") {
      if (user.role === "ADMIN") {
        redirect("/admin")
      } else {
        redirect("/dashboard")
      }
    }
  }

  // Not logged in, redirect to login
  redirect("/login")
}
