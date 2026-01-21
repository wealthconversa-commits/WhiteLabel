"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, LogOut, RefreshCw } from "lucide-react"
import { useState } from "react"

interface PendingApprovalProps {
  userName: string
}

export function PendingApproval({ userName }: PendingApprovalProps) {
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(false)

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
  }

  async function checkStatus() {
    setIsChecking(true)
    try {
      const response = await fetch("/api/auth/me")
      const data = await response.json()

      if (data.user?.status === "APPROVED") {
        if (data.user.role === "ADMIN") {
          router.push("/admin")
        } else {
          router.push("/dashboard")
        }
      }
    } catch {
      // Ignore errors
    } finally {
      setIsChecking(false)
    }
  }

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
          <Clock className="h-8 w-8 text-amber-600" />
        </div>
        <div className="space-y-1">
          <CardTitle className="text-2xl font-bold">Aguardando Aprovação</CardTitle>
          <CardDescription>
            Olá, {userName}!
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="text-center space-y-4">
        <p className="text-muted-foreground">
          Sua conta foi criada com sucesso e está aguardando aprovação do administrador.
        </p>
        <p className="text-muted-foreground">
          Você receberá acesso assim que sua conta for aprovada. Por favor, aguarde.
        </p>

        <div className="pt-4 border-t">
          <Button
            variant="outline"
            onClick={checkStatus}
            disabled={isChecking}
            className="w-full bg-transparent"
          >
            {isChecking ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Verificando...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Verificar status
              </>
            )}
          </Button>
        </div>
      </CardContent>

      <CardFooter>
        <Button variant="ghost" onClick={handleLogout} className="w-full">
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </Button>
      </CardFooter>
    </Card>
  )
}
