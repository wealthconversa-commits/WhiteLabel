import { BrandingForm } from "@/components/branding/branding-form"

export default function AdminBrandingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Personalização</h1>
        <p className="text-muted-foreground mt-1">
          Personalize a aparência da aplicação
        </p>
      </div>

      <BrandingForm />
    </div>
  )
}
