"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"

interface QRCodeDisplayProps {
  qrCode: string | null
  isLoading: boolean
  onRefresh: () => void
}

export function QRCodeDisplay({ qrCode, isLoading, onRefresh }: QRCodeDisplayProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex flex-col items-center gap-4">
          <div className="w-64 h-64 rounded-lg bg-white flex items-center justify-center border-2 border-dashed border-border relative overflow-hidden">
            {isLoading ? (
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="text-sm">Gerando QR Code...</span>
              </div>
            ) : qrCode ? (
              <Image
                src={qrCode || "/placeholder.svg"}
                alt="QR Code do WhatsApp"
                width={240}
                height={240}
                className="w-60 h-60 object-contain"
              />
            ) : (
              <div className="flex flex-col items-center gap-3 text-muted-foreground p-4 text-center">
                <span className="text-sm">Clique no botao abaixo para gerar um QR code</span>
              </div>
            )}
          </div>

          <Button
            variant="outline"
            onClick={onRefresh}
            disabled={isLoading}
            className="gap-2 bg-transparent"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            {qrCode ? "Atualizar QR Code" : "Gerar QR Code"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
