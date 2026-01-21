"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { RefreshCw, Smartphone, RotateCcw } from "lucide-react"

interface QuickActionsProps {
  onRefresh: () => void
  isRefreshing: boolean
}

export function QuickActions({ onRefresh, isRefreshing }: QuickActionsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Button
        size="lg"
        variant="outline"
        className="h-20 flex flex-col gap-2 bg-transparent"
        onClick={onRefresh}
        disabled={isRefreshing}
      >
        <RefreshCw className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`} />
        <span className="text-xs font-medium">Atualizar</span>
      </Button>

      <Button
        size="lg"
        asChild
        className="h-20 flex flex-col gap-2"
      >
        <Link href="/connect">
          <Smartphone className="w-5 h-5" />
          <span className="text-xs font-medium">Instâncias</span>
        </Link>
      </Button>
    </div>
  )
}
