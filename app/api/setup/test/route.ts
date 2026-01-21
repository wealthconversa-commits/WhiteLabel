import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { evolutionUrl, evolutionToken } = body

    if (!evolutionUrl || !evolutionToken) {
      return NextResponse.json(
        { error: "Evolution URL and token are required" },
        { status: 400 }
      )
    }

    // Clean the URL
    const baseUrl = evolutionUrl.replace(/\/+$/, "")

    // Try with apikey header (Evolution API standard)
    try {
      const response = await fetch(`${baseUrl}/instance/fetchInstances`, {
        method: "GET",
        headers: {
          "apikey": evolutionToken,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        return NextResponse.json({ connected: true })
      }

      // If 401, provide clear feedback about invalid credentials
      if (response.status === 401) {
        return NextResponse.json({ 
          connected: false,
          error: "Token inválido - verifique suas credenciais da API Evolution"
        })
      }

      // Other errors
      return NextResponse.json({ 
        connected: false,
        error: `Erro na API: ${response.status} - ${response.statusText}`
      })
    } catch (fetchError) {
      // Network error - API unreachable
      return NextResponse.json({ 
        connected: false,
        error: "Não foi possível conectar à API - verifique a URL"
      })
    }
  } catch (error) {
    console.error("Connection test error:", error)
    return NextResponse.json(
      { connected: false, error: "Network error - could not reach the API" },
      { status: 500 }
    )
  }
}
