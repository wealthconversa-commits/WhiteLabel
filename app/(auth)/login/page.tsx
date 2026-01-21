import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { LoginForm } from "@/components/auth/login-form"

export default async function LoginPage() {
  const user = await getCurrentUser()

  // If already logged in, redirect based on status/role
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

  return <LoginForm />
}
