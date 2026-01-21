import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { hashPassword } from "@/lib/auth"

// This route creates the initial admin user
// DELETE THIS FILE AFTER USE IN PRODUCTION
export async function GET() {
  try {
    const supabase = await getSupabaseServerClient()

    // Check if admin already exists
    const { data: existingAdmin } = await supabase
      .from("users")
      .select("id, email")
      .eq("email", "experiencias700@gmail.com")
      .maybeSingle()

    if (existingAdmin) {
      // Update existing user to be admin
      const { error: updateError } = await supabase
        .from("users")
        .update({
          role: "ADMIN",
          status: "APPROVED",
        })
        .eq("email", "experiencias700@gmail.com")

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }

      return NextResponse.json({ 
        success: true, 
        message: "Usuario existente atualizado para admin",
        email: "experiencias700@gmail.com"
      })
    }

    // Create new admin user
    const passwordHash = await hashPassword("123456")

    const { error: insertError } = await supabase
      .from("users")
      .insert({
        company_name: "Administrador",
        responsible_name: "Admin",
        email: "experiencias700@gmail.com",
        password_hash: passwordHash,
        role: "ADMIN",
        status: "APPROVED",
      })

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: "Admin criado com sucesso",
      email: "experiencias700@gmail.com",
      password: "123456"
    })
  } catch (error) {
    console.error("Seed admin error:", error)
    return NextResponse.json(
      { error: "Falha ao criar admin" },
      { status: 500 }
    )
  }
}
