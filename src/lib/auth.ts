import { cookies } from 'next/headers'
import db from '@/lib/db'

export interface AuthenticatedUser {
  id: string
  email: string
  username: string
  first_name?: string
  last_name?: string
  avatar_url?: string
}

export interface SessionData {
  id: string
  session_token: string
  user_id: string
  expires_at: Date
  is_active: boolean
  last_accessed_at: Date
  user: AuthenticatedUser
}

export async function validateSession(): Promise<SessionData | null> {
  const sessionToken = cookies().get('session')?.value

  if (!sessionToken) {
    return null
  }

  try {
    // Check if session exists and is valid
    const session = await db('sessions')
      .join('users', 'sessions.user_id', 'users.id')
      .where('sessions.session_token', sessionToken)
      .where('sessions.is_active', true)
      .where('sessions.expires_at', '>', new Date())
      .select(
        'sessions.id',
        'sessions.session_token',
        'sessions.user_id',
        'sessions.expires_at',
        'sessions.is_active',
        'sessions.last_accessed_at',
        'users.email',
        'users.username',
        'users.first_name',
        'users.last_name',
        'users.avatar_url'
      )
      .first()

    if (!session) {
      return null
    }

    // Update last accessed time
    await db('sessions')
      .where('session_token', sessionToken)
      .update({ last_accessed_at: new Date() })

    // Structure the response
    return {
      id: session.id,
      session_token: session.session_token,
      user_id: session.user_id,
      expires_at: session.expires_at,
      is_active: session.is_active,
      last_accessed_at: session.last_accessed_at,
      user: {
        id: session.user_id,
        email: session.email,
        username: session.username,
        first_name: session.first_name,
        last_name: session.last_name,
        avatar_url: session.avatar_url
      }
    }
  } catch (error) {
    console.error('Session validation error:', error)
    return null
  }
}

export async function requireAuth(): Promise<SessionData> {
  const session = await validateSession()
  
  if (!session) {
    throw new Error('Authentication required')
  }
  
  return session
}

export async function logout(): Promise<void> {
  const sessionToken = cookies().get('session')?.value
  
  if (sessionToken) {
    // Deactivate session in database
    await db('sessions')
      .where('session_token', sessionToken)
      .update({ is_active: false })
  }
  
  // Clear the session cookie
  cookies().delete('session')
} 