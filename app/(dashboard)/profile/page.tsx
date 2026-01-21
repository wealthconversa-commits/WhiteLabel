"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LogOut, User, Mail } from "lucide-react"

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        setUser(data.user)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
  }

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <div className="h-32 bg-muted rounded-lg animate-pulse" />
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-balance">Meu Perfil</h1>
        <p className="text-sm text-muted-foreground">Informações da sua conta</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Informações Pessoais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Nome</p>
            <p className="font-medium text-lg">{user?.responsible_name || "Usuário"}</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <div className="flex items-center gap-2 mt-1">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <p className="font-medium break-all">{user?.email}</p>
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Empresa</p>
            <p className="font-medium">{user?.company_name || "-"}</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary mt-1">
              {user?.status === "APPROVED" ? "Ativo" : user?.status}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Segurança</CardTitle>
          <CardDescription>Gerencie suas permissões</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Função: <span className="font-medium text-foreground">Operador</span>
          </p>
        </CardContent>
      </Card>

      <Button
        onClick={handleLogout}
        variant="destructive"
        size="lg"
        className="w-full"
      >
        <LogOut className="w-4 h-4 mr-2" />
        Sair
      </Button>

      <p className="text-xs text-muted-foreground text-center py-4">
        Versão 1.0.0 • Mobile-First
      </p>
    </div>
  )
}
