"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Shield, Users, LogOut, User, Palette } from "lucide-react"

interface AdminHeaderProps {
  userName: string
  appName?: string
  logoUrl?: string
}

export function AdminHeader({ userName, appName, logoUrl }: AdminHeaderProps) {
  const router = useRouter()

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/admin" className="flex items-center gap-2">
            {logoUrl ? (
              <img src={logoUrl || "/placeholder.svg"} alt={appName || "Logo"} className="h-8 object-contain" />
            ) : (
              <div className="flex items-center gap-2">
                <Shield className="h-6 w-6 text-primary" />
                <span className="font-bold text-lg">{appName || "Admin"}</span>
              </div>
            )}
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <Link href="/admin">
              <Button variant="ghost" size="sm">
                <Users className="mr-2 h-4 w-4" />
                Usuários
              </Button>
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <span className="hidden sm:inline-block">{userName}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem asChild>
              <Link href="/admin">
                <Users className="mr-2 h-4 w-4" />
                Usuários
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
