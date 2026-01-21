"use client"

import { useState } from "react"
import { SetupCodeGate } from "./setup-code-gate"
import { SetupForm } from "./setup-form"

interface SetupWrapperProps {
  requireCode: boolean
}

export function SetupWrapper({ requireCode }: SetupWrapperProps) {
  const [isVerified, setIsVerified] = useState(!requireCode)

  if (!isVerified) {
    return <SetupCodeGate requireCode={requireCode} onVerified={() => setIsVerified(true)} />
  }

  return <SetupForm />
}
