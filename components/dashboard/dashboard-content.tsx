"use client"

import { useEffect, useState, useCallback } from "react"
import { StatusCard } from "./status-card"
import { QuickActions } from "./quick-actions"
import { useBranding } from "@/components/branding-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, Clock, Zap } from "lucide-react"

type ConnectionStatus = "connected" | "disconnected" | "connecting" | "loading"

interface StatusData {
  status: ConnectionStatus
  instanceName: string | null
}

export function DashboardContent() {
  const { branding, isLoading } = useBranding()
  const [statusData, setStatusData] = useState<StatusData>({
    status: "loading",
    instanceName: null,
  })
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [userName, setUserName] = useState<string>("")

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => setUserName(data.user?.responsible_name || ""))
      .catch(() => setUserName(""))
  }, [])

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/status")
      if (response.ok) {
        const data = await response.json()
        setStatusData({
          status: data.status,
          instanceName: data.instanceName,
        })
      } else {
        setStatusData({
          status: "disconnected",
          instanceName: null,
        })
      }
    } catch {
      setStatusData({
        status: "disconnected",
        instanceName: null,
      })
    }
  }, [])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchStatus()
    setIsRefreshing(false)
  }

  useEffect(() => {
    fetchStatus()

    // Poll status every 30 seconds
    const interval = setInterval(fetchStatus, 30000)
    return () => clearInterval(interval)
  }, [fetchStatus])

  return (
    <div className="p-4 md:p-8 space-y-4 md:space-y-8 max-w-screen-sm md:max-w-none mx-auto">
      {/* Header - Simplified */}
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold text-balance">
          Bem-vindo, {userName}
        </h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Monitore sua conexão WhatsApp
        </p>
      </div>

      {/* Quick Actions */}
      <QuickActions onRefresh={handleRefresh} isRefreshing={isRefreshing} />

      {/* Status Card */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Status</h2>
        <StatusCard />
      </div>

      {/* Stats Cards - Mobile Friendly */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Informações</h2>
        <div className="grid grid-cols-1 gap-3">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Conexão</p>
                  <p className="text-lg font-bold capitalize">
                    {statusData.status === "connected" ? "Conectado" : 
                     statusData.status === "disconnected" ? "Desconectado" :
                     statusData.status === "connecting" ? "Conectando" : "Carregando"}
                  </p>
                </div>
                <Activity className="w-5 h-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Status da API</p>
                  <p className="text-lg font-bold">Online</p>
                </div>
                <Zap className="w-5 h-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
