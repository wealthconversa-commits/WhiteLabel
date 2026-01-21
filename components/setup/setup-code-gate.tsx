"use client"

import React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, Loader2, XCircle } from "lucide-react"

interface SetupCodeGateProps {
  onVerified: () => void
  requireCode: boolean
}

export function SetupCodeGate({ onVerified, requireCode }: SetupCodeGateProps) {
  const [code, setCode] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [attempts, setAttempts] = useState(0)

  // If no code is required, auto-verify
  if (!requireCode) {
    onVerified()
    return null
  }

  const handleVerify = async () => {
    if (attempts >= 5) {
      setError("Too many attempts. Please try again later.")
      return
    }

    setIsVerifying(true)
    setError(null)

    try {
      const response = await fetch("/api/setup/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      })

      const data = await response.json()

      if (response.ok && data.valid) {
        onVerified()
      } else {
        setAttempts((prev) => prev + 1)
        setError(data.error || "Invalid setup code. Please try again.")
      }
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setIsVerifying(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && code.trim()) {
      handleVerify()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Setup Protection</CardTitle>
          <CardDescription>
            Enter the setup code to access the configuration wizard.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="setupCode">Setup Code</Label>
            <Input
              id="setupCode"
              type="password"
              placeholder="Enter your setup code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={attempts >= 5}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleVerify}
            disabled={!code.trim() || isVerifying || attempts >= 5}
            className="w-full"
          >
            {isVerifying && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Verify Code
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            The setup code is defined in your environment variables (SETUP_CODE).
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
