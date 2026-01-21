export interface Settings {
  id: string
  evolution_url: string
  evolution_token: string
  instance_id: string | null
  instance_name: string | null
  setup_completed: boolean
  created_at: string
  updated_at: string
}

export interface Branding {
  id: string
  logo_url: string | null
  primary_color: string
  secondary_color: string
  app_name: string
  created_at: string
  updated_at: string
}

export interface AuditLog {
  id: string
  action: string
  details: Record<string, unknown>
  ip_address: string | null
  created_at: string
}

export interface EvolutionInstanceResponse {
  instance: {
    instanceName: string
    instanceId: string
    status: string
  }
  hash: string
  qrcode?: {
    base64: string
  }
}

export interface EvolutionConnectionState {
  instance: {
    instanceName: string
    state: "open" | "close" | "connecting"
  }
}

export interface SetupFormData {
  evolutionUrl: string
  evolutionToken: string
  appName: string
  primaryColor: string
  secondaryColor: string
}

export interface BrandingFormData {
  logoUrl: string | null
  primaryColor: string
  secondaryColor: string
  appName: string
}
