"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Save, CheckCircle, AlertCircle, Key, Globe } from "lucide-react"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function AdminSettingsPage() {
  const { data: settingsData } = useSWR("/api/setup/status", fetcher)
  
  const [evolutionUrl, setEvolutionUrl] = useState("")
  const [evolutionToken, setEvolutionToken] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  async function handleTestConnection() {
    if (!evolutionUrl || !evolutionToken) {
      setMessage({ type: "error", text: "Preencha a URL e o Token" })
      return
    }

    setIsTesting(true)
    setMessage(null)

    try {
      const response = await fetch("/api/setup/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ evolutionUrl, evolutionToken }),
      })

      const data = await response.json()

      if (data.connected) {
        setMessage({ type: "success", text: "Conexão estabelecida com sucesso!" })
      } else {
        setMessage({ type: "error", text: data.error || "Falha na conexão" })
      }
    } catch {
      setMessage({ type: "error", text: "Erro ao testar conexão" })
    } finally {
      setIsTesting(false)
    }
  }

  async function handleSave() {
    if (!evolutionUrl || !evolutionToken) {
      setMessage({ type: "error", text: "Preencha a URL e o Token" })
      return
    }

    setIsLoading(true)
    setMessage(null)

    try {
      const response = await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ evolutionUrl, evolutionToken }),
      })

      const data = await response.json()

      if (data.success) {
        setMessage({ type: "success", text: "Configurações salvas com sucesso!" })
        setEvolutionUrl("")
        setEvolutionToken("")
      } else {
        setMessage({ type: "error", text: data.error || "Erro ao salvar" })
      }
    } catch {
      setMessage({ type: "error", text: "Erro ao salvar configurações" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground mt-1">
          Configure as credenciais da API Evolution
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>API Evolution</CardTitle>
          <CardDescription>
            Atualize as credenciais de conexão com a API Evolution.
            As credenciais atuais não são exibidas por segurança.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {message && (
            <Alert variant={message.type === "error" ? "destructive" : "default"}>
              {message.type === "success" ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="evolutionUrl">URL da API Evolution</Label>
            <div className="relative">
              <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="evolutionUrl"
                type="url"
                placeholder="https://sua-api-evolution.com"
                value={evolutionUrl}
                onChange={(e) => setEvolutionUrl(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="evolutionToken">Token da API</Label>
            <div className="relative">
              <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="evolutionToken"
                type="password"
                placeholder="Novo token da API"
                value={evolutionToken}
                onChange={(e) => setEvolutionToken(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleTestConnection}
              disabled={isTesting || isLoading}
            >
              {isTesting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testando...
                </>
              ) : (
                "Testar Conexão"
              )}
            </Button>

            <Button onClick={handleSave} disabled={isLoading || isTesting}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {settingsData?.configured && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            A API Evolution já está configurada. Preencha os campos acima apenas se desejar atualizar as credenciais.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
