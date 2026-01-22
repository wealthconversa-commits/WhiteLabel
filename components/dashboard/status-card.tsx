"use client"

import { useEffect, useState } from "react"
import { useBranding } from "@/components/branding-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle, Loader2, Smartphone } from "lucide-react"

interface Instance {
  id: string
  instance_name: string
  status: string
}

export function StatusCard() {
  const { branding } = useBranding()
  const [instances, setInstances] = useState<Instance[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchInstances = async () => {
      try {
        const response = await fetch("/api/whatsapp/instances")
        if (response.ok) {
          const data = await response.json()
          setInstances(data.instances || [])
        }
      } catch {
        setInstances([])
      } finally {
        setLoading(false)
      }
    }

    fetchInstances()
    const interval = setInterval(fetchInstances, 5000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Status do {branding?.app_name || "WhatsApp"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-4">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Status do {branding?.app_name || "WhatsApp"}</CardTitle>
          <CardDescription>{instances.length} instancia(s) criada(s)</CardDescription>
        </CardHeader>
      <CardContent className="space-y-3">
        {instances.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma instancia criada. Crie uma em Conectar.</p>
        ) : (
          instances.map((instance) => (
            <div key={instance.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
              <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center">
                {instance.status === "connected" ? (
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                ) : (
                  <XCircle className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{instance.instance_name}</p>
              </div>
              <Badge variant={instance.status === "connected" ? "default" : "secondary"}>
                {instance.status === "connected" ? "Conectado" : "Desconectado"}
              </Badge>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
