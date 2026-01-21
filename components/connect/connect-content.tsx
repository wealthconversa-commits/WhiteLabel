"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { QRCodeDisplay } from "./qr-code-display"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Smartphone, Loader2, AlertCircle, Trash2, ChevronRight } from "lucide-react"

type ConnectionStatus = "connected" | "disconnected" | "connecting" | "loading"

interface Instance {
  id: string
  instance_name: string
  status: string
}

export function ConnectContent() {
  const router = useRouter()
  const [instances, setInstances] = useState<Instance[]>([])
  const [selectedInstance, setSelectedInstance] = useState<Instance | null>(null)
  const [status, setStatus] = useState<ConnectionStatus>("loading")
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasInstance, setHasInstance] = useState(false)

  const fetchInstances = useCallback(async () => {
    try {
      const response = await fetch("/api/whatsapp/instances")
      if (response.ok) {
        const data = await response.json()
        setInstances(data.instances || [])
      }
    } catch {
      setInstances([])
    }
  }, [])

  useEffect(() => {
    fetchInstances()
    const interval = setInterval(fetchInstances, 5000)
    return () => clearInterval(interval)
  }, [fetchInstances])

  useEffect(() => {
    if (selectedInstance) {
      setStatus(selectedInstance.status === "connected" ? "connected" : "disconnected")
    }
  }, [selectedInstance])

  const handleCreateInstance = async () => {
    setIsCreating(true)
    setError(null)

    try {
      const response = await fetch("/api/whatsapp/instance", {
        method: "POST",
      })

      const data = await response.json()

      if (response.ok) {
        await fetchInstances()
      } else {
        setError(data.error || "Failed to create instance")
      }
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setIsCreating(false)
    }
  }

  const handleGenerateQRCode = async () => {
    if (!selectedInstance) return
    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch("/api/whatsapp/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instanceId: selectedInstance.id }),
      })

      const data = await response.json()

      if (response.ok && data.qrCode) {
        setQrCode(data.qrCode)
        setStatus("connecting")
      } else {
        setError(data.error || "Failed to generate QR code")
      }
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDeleteInstance = async (instanceId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta instancia?")) {
      return
    }

    setIsDeleting(true)
    setError(null)

    try {
      const response = await fetch(`/api/whatsapp/instance?id=${instanceId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        await fetchInstances()
        setQrCode(null)
        setStatus("disconnected")
      } else {
        const data = await response.json()
        setError(data.error || "Failed to delete instance")
      }
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="p-4 md:p-8 space-y-4 md:space-y-6 max-w-screen-sm md:max-w-none mx-auto pb-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold">Gerenciar Instâncias</h1>
        <p className="text-sm md:text-base text-muted-foreground">{instances.length}/2 instâncias criadas</p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Instances List */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Suas Instâncias</h2>
        {instances.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <Smartphone className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-sm text-muted-foreground">Nenhuma instância criada</p>
              <Button 
                onClick={handleCreateInstance} 
                disabled={isCreating} 
                size="lg"
                className="w-full mt-4"
              >
                {isCreating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Criar Primeira Instância
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {instances.map((instance) => (
              <Card
                key={instance.id}
                className={`cursor-pointer transition ${
                  selectedInstance?.id === instance.id
                    ? "border-primary bg-primary/5"
                    : "hover:bg-muted"
                }`}
                onClick={() => setSelectedInstance(instance)}
              >
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-base">{instance.instance_name}</p>
                      <Badge 
                        variant={instance.status === "connected" ? "default" : "secondary"} 
                        className="mt-2 text-xs"
                      >
                        {instance.status === "connected" ? "🟢 Conectado" : "🔴 Desconectado"}
                      </Badge>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))}

            {instances.length < 2 && (
              <Button 
                onClick={handleCreateInstance} 
                disabled={isCreating}
                size="lg"
                className="w-full"
              >
                {isCreating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Adicionar Instância
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Selected Instance Details */}
      {selectedInstance && (
        <div className="space-y-4">
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Conectar</h2>

            {status === "connected" ? (
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <CheckCircle2 className="w-12 h-12 text-primary" />
                    <div>
                      <p className="font-semibold text-lg">Conectado!</p>
                      <p className="text-sm text-muted-foreground mt-1">{selectedInstance.instance_name}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                {qrCode && <QRCodeDisplay qrCode={qrCode} isLoading={isGenerating} onRefresh={handleGenerateQRCode} />}
                <Button 
                  onClick={handleGenerateQRCode} 
                  disabled={isGenerating} 
                  size="lg"
                  className="w-full"
                >
                  {isGenerating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {isGenerating ? "Gerando..." : "Gerar QR Code"}
                </Button>
              </>
            )}

            {status === "connecting" && (
              <Alert>
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertTitle>Conectando...</AlertTitle>
                <AlertDescription>Escaneie o QR code com o WhatsApp</AlertDescription>
              </Alert>
            )}
          </div>

          <div className="mt-6 pt-6 border-t">
            <ol className="space-y-3">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center">
                  1
                </span>
                <div>
                  <p className="font-medium">Abra o WhatsApp</p>
                  <p className="text-sm text-muted-foreground">
                    Abra o WhatsApp no seu dispositivo móvel
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center">
                  2
                </span>
                <div>
                  <p className="font-medium">Acesse Dispositivos Conectados</p>
                  <p className="text-sm text-muted-foreground">
                    Toque em Menu ou Configurações e selecione Dispositivos Conectados
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center">
                  3
                </span>
                <div>
                  <p className="font-medium">Conectar um Dispositivo</p>
                  <p className="text-sm text-muted-foreground">
                    Toque em Conectar um Dispositivo
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center">
                  4
                </span>
                <div>
                  <p className="font-medium">Escaneie o QR Code</p>
                  <p className="text-sm text-muted-foreground">
                    Aponte a câmera do seu celular para o QR code exibido aqui
                  </p>
                </div>
              </li>
            </ol>
          </div>

          {status === "connected" && (
            <Button
              variant="destructive"
              size="lg"
              onClick={() => handleDeleteInstance(selectedInstance.id)}
              disabled={isDeleting}
              className="w-full"
            >
              {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Trash2 className="w-4 h-4 mr-2" />
              Desconectar
            </Button>
          )}

          {status !== "connected" && (
            <Button
              variant="destructive"
              size="lg"
              onClick={() => handleDeleteInstance(selectedInstance.id)}
              disabled={isDeleting}
              className="w-full"
            >
              {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir Instância
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
