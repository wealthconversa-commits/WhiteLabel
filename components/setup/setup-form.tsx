"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle2, XCircle, Eye, EyeOff, Server, Palette, UserCog } from "lucide-react"

type Step = "admin" | "credentials" | "branding" | "complete"

export function SetupForm() {
  const router = useRouter()
  const [step, setStep] = useState<Step>("admin")
  const [isLoading, setIsLoading] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [showToken, setShowToken] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    // Admin credentials
    adminCompanyName: "",
    adminResponsibleName: "",
    adminEmail: "",
    adminPassword: "",
    adminPasswordConfirm: "",
    // Evolution API
    evolutionUrl: "",
    evolutionToken: "",
    // Branding
    appName: "WhatsApp Manager",
    primaryColor: "#25D366",
    secondaryColor: "#DCF8C6",
  })

  const handleTestConnection = async () => {
    setIsTesting(true)
    setTestResult(null)
    setError(null)

    try {
      const response = await fetch("/api/setup/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          evolutionUrl: formData.evolutionUrl,
          evolutionToken: formData.evolutionToken,
        }),
      })

      const data = await response.json()

      if (response.ok && data.connected) {
        setTestResult({ success: true, message: "Conexao bem-sucedida! A API Evolution esta acessivel." })
      } else {
        setTestResult({ success: false, message: data.error || "Falha ao conectar com a API Evolution." })
      }
    } catch {
      setTestResult({ success: false, message: "Erro de rede. Verifique a URL e tente novamente." })
    } finally {
      setIsTesting(false)
    }
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setStep("complete")
        setTimeout(() => {
          router.push("/login")
        }, 2000)
      } else {
        setError(data.error || "Falha ao salvar configuracao.")
      }
    } catch {
      setError("Erro de rede. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  const isAdminValid = 
    formData.adminCompanyName.trim() !== "" && 
    formData.adminResponsibleName.trim() !== "" && 
    formData.adminEmail.trim() !== "" && 
    formData.adminPassword.length >= 8 &&
    formData.adminPassword === formData.adminPasswordConfirm

  const isCredentialsValid = formData.evolutionUrl.trim() !== "" && formData.evolutionToken.trim() !== ""

  const getStepNumber = (s: Step) => {
    const steps: Step[] = ["admin", "credentials", "branding", "complete"]
    return steps.indexOf(s) + 1
  }

  const isStepComplete = (s: Step) => {
    const currentIndex = getStepNumber(step)
    const targetIndex = getStepNumber(s)
    return targetIndex < currentIndex
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg">
        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {/* Admin Step */}
          <div className={`flex items-center gap-2 ${step === "admin" ? "text-primary" : "text-muted-foreground"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step === "admin" ? "bg-primary text-primary-foreground" : 
              isStepComplete("admin") ? "bg-primary text-primary-foreground" : 
              "bg-muted text-muted-foreground"
            }`}>
              {isStepComplete("admin") ? <CheckCircle2 className="w-5 h-5" /> : "1"}
            </div>
            <span className="text-sm font-medium hidden sm:inline">Admin</span>
          </div>
          <div className="w-8 h-px bg-border" />
          
          {/* Credentials Step */}
          <div className={`flex items-center gap-2 ${step === "credentials" ? "text-primary" : "text-muted-foreground"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step === "credentials" ? "bg-primary text-primary-foreground" : 
              isStepComplete("credentials") ? "bg-primary text-primary-foreground" : 
              "bg-muted text-muted-foreground"
            }`}>
              {isStepComplete("credentials") ? <CheckCircle2 className="w-5 h-5" /> : "2"}
            </div>
            <span className="text-sm font-medium hidden sm:inline">API</span>
          </div>
          <div className="w-8 h-px bg-border" />
          
          {/* Branding Step */}
          <div className={`flex items-center gap-2 ${step === "branding" ? "text-primary" : "text-muted-foreground"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step === "branding" ? "bg-primary text-primary-foreground" : 
              isStepComplete("branding") ? "bg-primary text-primary-foreground" : 
              "bg-muted text-muted-foreground"
            }`}>
              {isStepComplete("branding") ? <CheckCircle2 className="w-5 h-5" /> : "3"}
            </div>
            <span className="text-sm font-medium hidden sm:inline">Branding</span>
          </div>
          <div className="w-8 h-px bg-border" />
          
          {/* Complete Step */}
          <div className={`flex items-center gap-2 ${step === "complete" ? "text-primary" : "text-muted-foreground"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step === "complete" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}>
              4
            </div>
            <span className="text-sm font-medium hidden sm:inline">Concluido</span>
          </div>
        </div>

        {/* Step 1: Admin Account */}
        {step === "admin" && (
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <UserCog className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-2xl">Conta do Administrador</CardTitle>
              <CardDescription>
                Crie a conta do administrador principal do sistema.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="adminCompanyName">Nome da Empresa</Label>
                <Input
                  id="adminCompanyName"
                  type="text"
                  placeholder="Sua empresa"
                  value={formData.adminCompanyName}
                  onChange={(e) => setFormData({ ...formData, adminCompanyName: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminResponsibleName">Nome do Responsavel</Label>
                <Input
                  id="adminResponsibleName"
                  type="text"
                  placeholder="Seu nome"
                  value={formData.adminResponsibleName}
                  onChange={(e) => setFormData({ ...formData, adminResponsibleName: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminEmail">Email</Label>
                <Input
                  id="adminEmail"
                  type="email"
                  placeholder="admin@exemplo.com"
                  value={formData.adminEmail}
                  onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminPassword">Senha</Label>
                <div className="relative">
                  <Input
                    id="adminPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Minimo 8 caracteres"
                    value={formData.adminPassword}
                    onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminPasswordConfirm">Confirmar Senha</Label>
                <Input
                  id="adminPasswordConfirm"
                  type="password"
                  placeholder="Repita a senha"
                  value={formData.adminPasswordConfirm}
                  onChange={(e) => setFormData({ ...formData, adminPasswordConfirm: e.target.value })}
                />
                {formData.adminPasswordConfirm && formData.adminPassword !== formData.adminPasswordConfirm && (
                  <p className="text-sm text-destructive">As senhas nao coincidem</p>
                )}
              </div>

              {error && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="pt-4">
                <Button
                  onClick={() => { setError(null); setStep("credentials"); }}
                  disabled={!isAdminValid}
                  className="w-full"
                >
                  Continuar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Credentials */}
        {step === "credentials" && (
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Server className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-2xl">Configuracao da API</CardTitle>
              <CardDescription>
                Insira as credenciais da API Evolution para conectar sua instancia WhatsApp.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="evolutionUrl">URL da API Evolution</Label>
                <Input
                  id="evolutionUrl"
                  type="url"
                  placeholder="https://api.evolution.exemplo.com"
                  value={formData.evolutionUrl}
                  onChange={(e) => setFormData({ ...formData, evolutionUrl: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="evolutionToken">Token da API</Label>
                <div className="relative">
                  <Input
                    id="evolutionToken"
                    type={showToken ? "text" : "password"}
                    placeholder="Insira seu token da API"
                    value={formData.evolutionToken}
                    onChange={(e) => setFormData({ ...formData, evolutionToken: e.target.value })}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {testResult && (
                <Alert variant={testResult.success ? "default" : "destructive"}>
                  {testResult.success ? (
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  <AlertDescription>{testResult.message}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setStep("admin")}
                  className="flex-1"
                >
                  Voltar
                </Button>
                <Button
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={!isCredentialsValid || isTesting}
                  className="flex-1 bg-transparent"
                >
                  {isTesting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Testar
                </Button>
                <Button
                  onClick={() => setStep("branding")}
                  disabled={!isCredentialsValid || !testResult?.success}
                  className="flex-1"
                >
                  Continuar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Branding */}
        {step === "branding" && (
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Palette className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-2xl">Personalizacao</CardTitle>
              <CardDescription>
                Personalize sua aplicacao com as cores e nome da sua marca.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="appName">Nome da Aplicacao</Label>
                <Input
                  id="appName"
                  type="text"
                  placeholder="Meu WhatsApp Manager"
                  value={formData.appName}
                  onChange={(e) => setFormData({ ...formData, appName: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Cor Primaria</Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      id="primaryColorPicker"
                      className="w-10 h-10 rounded border border-input cursor-pointer"
                      value={formData.primaryColor}
                      onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    />
                    <Input
                      id="primaryColor"
                      type="text"
                      value={formData.primaryColor}
                      onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondaryColor">Cor Secundaria</Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      id="secondaryColorPicker"
                      className="w-10 h-10 rounded border border-input cursor-pointer"
                      value={formData.secondaryColor}
                      onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                    />
                    <Input
                      id="secondaryColor"
                      type="text"
                      value={formData.secondaryColor}
                      onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="p-4 rounded-lg border bg-card">
                <p className="text-sm text-muted-foreground mb-2">Preview</p>
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: formData.primaryColor }}
                  >
                    {formData.appName.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-semibold">{formData.appName || "Meu App"}</span>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setStep("credentials")}
                  className="flex-1"
                >
                  Voltar
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Finalizar Setup
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Complete */}
        {step === "complete" && (
          <Card>
            <CardContent className="pt-8 pb-8 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <CheckCircle2 className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">Setup Concluido!</h2>
              <p className="text-muted-foreground mb-4">
                Seu sistema esta configurado e pronto para uso.
              </p>
              <p className="text-sm text-muted-foreground">
                Redirecionando para o login...
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
