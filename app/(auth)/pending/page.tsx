import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { PendingApproval } from "@/components/auth/pending-approval"

export default async function PendingPage() {
  const user = await getCurrentUser()

  // If not logged in, redirect to login
  if (!user) {
    redirect("/login")
  }

  // If approved, redirect to appropriate dashboard
  if (user.status === "APPROVED") {
    if (user.role === "ADMIN") {
      redirect("/admin")
    } else {
      redirect("/dashboard")
    }
  }

  // If suspended, redirect to login with error
  if (user.status === "SUSPENDED") {
    redirect("/login")
  }

  return <PendingApproval userName={user.responsible_name} />
}
