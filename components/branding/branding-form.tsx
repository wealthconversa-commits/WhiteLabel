"use client"

import React from "react"

import { useState, useEffect } from "react"
import { useBranding } from "@/components/branding-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle2, Palette, Type, ImageIcon, MessageSquare } from "lucide-react"

export function BrandingForm() {
  const { branding, refetch } = useBranding()
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    appName: "",
    logoUrl: "",
    primaryColor: "#25D366",
    secondaryColor: "#DCF8C6",
  })

  useEffect(() => {
    if (branding) {
      setFormData({
        appName: branding.app_name || "",
        logoUrl: branding.logo_url || "",
        primaryColor: branding.primary_color || "#25D366",
        secondaryColor: branding.secondary_color || "#DCF8C6",
      })
    }
  }, [branding])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch("/api/branding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setSuccess(true)
        await refetch()
        setTimeout(() => setSuccess(false), 3000)
      } else {
        const data = await response.json()
        setError(data.error || "Failed to update branding")
      }
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container py-8">
      <div className="grid gap-6 lg:grid-cols-2 max-w-5xl">
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Type className="w-5 h-5 text-muted-foreground" />
                <CardTitle className="text-lg">Nome da Aplicacao</CardTitle>
              </div>
              <CardDescription>
                O nome exibido no cabecalho e na aba do navegador
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                value={formData.appName}
                onChange={(e) => setFormData({ ...formData, appName: e.target.value })}
                placeholder="WhatsApp Manager"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-muted-foreground" />
                <CardTitle className="text-lg">URL da Logo</CardTitle>
              </div>
              <CardDescription>
                URL da logo da sua empresa (opcional)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                type="url"
                value={formData.logoUrl}
                onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                placeholder="https://exemplo.com/logo.png"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-muted-foreground" />
                <CardTitle className="text-lg">Cores</CardTitle>
              </div>
              <CardDescription>
                Escolha as cores da sua marca
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Cor Primaria</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={formData.primaryColor.startsWith("#") ? formData.primaryColor : "#25D366"}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    className="w-12 h-10 rounded border border-input cursor-pointer"
                  />
                  <Input
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Cor Secundaria</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={formData.secondaryColor.startsWith("#") ? formData.secondaryColor : "#DCF8C6"}
                    onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                    className="w-12 h-12 rounded border border-input cursor-pointer"
                  />
                  <Input
                    value={formData.secondaryColor}
                    onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <AlertDescription>Personalizacao atualizada com sucesso!</AlertDescription>
            </Alert>
          )}

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Salvar Alteracoes
          </Button>
        </form>

        {/* Preview */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Visualizacao</CardTitle>
              <CardDescription>
                Veja como sua personalizacao ficara
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Header Preview */}
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-background border-b p-4 flex items-center gap-3">
                  <div 
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-white"
                    style={{ backgroundColor: formData.primaryColor.startsWith("#") ? formData.primaryColor : "#25D366" }}
                  >
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <span className="font-semibold">{formData.appName || "WhatsApp Manager"}</span>
                </div>

                {/* Content Preview */}
                <div className="p-4 bg-muted/30 min-h-[200px]">
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <div 
                          className="px-4 py-2 rounded-lg text-white text-sm font-medium"
                          style={{ backgroundColor: formData.primaryColor.startsWith("#") ? formData.primaryColor : "#25D366" }}
                        >
                          Botao Primario
                        </div>
                        <div 
                          className="px-4 py-2 rounded-lg text-sm font-medium border"
                          style={{ 
                            backgroundColor: formData.secondaryColor.startsWith("#") ? formData.secondaryColor : "#DCF8C6",
                            borderColor: formData.primaryColor.startsWith("#") ? formData.primaryColor : "#25D366",
                          }}
                        >
                          Botao Secundario
                        </div>
                      </div>

                      <div className="p-4 rounded-lg bg-background border">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                            style={{ backgroundColor: formData.primaryColor.startsWith("#") ? formData.primaryColor : "#25D366" }}
                          >
                            {(formData.appName || "W").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium">Cartao de Exemplo</p>
                            <p className="text-sm text-muted-foreground">
                              Isso mostra como suas cores ficam
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
