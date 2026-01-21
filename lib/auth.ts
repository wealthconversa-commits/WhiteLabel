import { getSupabaseServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import bcrypt from "bcryptjs"
import { v4 as uuidv4 } from "uuid"

export type UserRole = "ADMIN" | "USER"
export type UserStatus = "PENDING" | "APPROVED" | "SUSPENDED"

export interface User {
  id: string
  email: string
  company_name: string
  responsible_name: string
  role: UserRole
  status: UserStatus
  created_at: string
  updated_at: string
}

export interface Session {
  id: string
  user_id: string
  expires_at: string
}

const SESSION_COOKIE_NAME = "session_token"
const SESSION_DURATION_DAYS = 7

// Hash password using bcrypt
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

// Verify password against hash
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// Create a new session for a user
export async function createSession(userId: string): Promise<string> {
  const supabase = await getSupabaseServerClient()
  const sessionToken = uuidv4()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS)

  await supabase.from("sessions").insert({
    user_id: userId,
    token: sessionToken,
    expires_at: expiresAt.toISOString(),
  })

  // Set HTTP-only cookie
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  })

  return sessionToken
}

// Get current session from cookie
export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (!sessionToken) {
    return null
  }

  const supabase = await getSupabaseServerClient()
  const { data: session } = await supabase
    .from("sessions")
    .select("*")
    .eq("token", sessionToken)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle()

  return session
}

// Get current user from session
export async function getCurrentUser(): Promise<User | null> {
  const session = await getSession()

  if (!session) {
    return null
  }

  const supabase = await getSupabaseServerClient()
  const { data: user } = await supabase
    .from("users")
    .select("id, email, company_name, responsible_name, role, status, created_at, updated_at")
    .eq("id", session.user_id)
    .maybeSingle()

  return user
}

// Delete session (logout)
export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (sessionToken) {
    const supabase = await getSupabaseServerClient()
    await supabase.from("sessions").delete().eq("token", sessionToken)
  }

  cookieStore.delete(SESSION_COOKIE_NAME)
}

// Register a new user
export async function registerUser(
  email: string,
  password: string,
  companyName: string,
  responsibleName: string
): Promise<{ success: boolean; error?: string; user?: User }> {
  const supabase = await getSupabaseServerClient()

  // Check if email already exists
  const { data: existingUser } = await supabase
    .from("users")
    .select("id")
    .eq("email", email.toLowerCase())
    .maybeSingle()

  if (existingUser) {
    return { success: false, error: "Este email já está cadastrado" }
  }

  // Check if this is the first user (will be admin)
  const { count } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true })

  const isFirstUser = count === 0
  const hashedPassword = await hashPassword(password)

  const { data: newUser, error } = await supabase
    .from("users")
    .insert({
      email: email.toLowerCase(),
      password_hash: hashedPassword,
      company_name: companyName,
      responsible_name: responsibleName,
      role: isFirstUser ? "ADMIN" : "USER",
      status: isFirstUser ? "APPROVED" : "PENDING",
    })
    .select("id, email, company_name, responsible_name, role, status, created_at, updated_at")
    .single()

  if (error) {
    return { success: false, error: "Erro ao criar conta" }
  }

  return { success: true, user: newUser }
}

// Login user
export async function loginUser(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string; user?: User }> {
  const supabase = await getSupabaseServerClient()

  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("email", email.toLowerCase())
    .maybeSingle()

  if (!user) {
    return { success: false, error: "Email ou senha inválidos" }
  }

  const isValidPassword = await verifyPassword(password, user.password_hash)

  if (!isValidPassword) {
    return { success: false, error: "Email ou senha inválidos" }
  }

  // Create session
  await createSession(user.id)

  return {
    success: true,
    user: {
      id: user.id,
      email: user.email,
      company_name: user.company_name,
      responsible_name: user.responsible_name,
      role: user.role,
      status: user.status,
      created_at: user.created_at,
      updated_at: user.updated_at,
    },
  }
}

// Check if user is admin
export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser()
  return user?.role === "ADMIN"
}

// Check if user is approved
export async function isApproved(): Promise<boolean> {
  const user = await getCurrentUser()
  return user?.status === "APPROVED"
}
