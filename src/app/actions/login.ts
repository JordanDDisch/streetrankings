'use server'
import db from '@/lib/db'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { randomBytes } from 'crypto'

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const user = await db('users').where('email', email).first()

  if (!user) {
    return { error: 'Incorrect email or password' }
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash)

  if (!isPasswordValid) {
    return { error: 'Invalid password' }
  }

  // Generate a secure session token
  const sessionToken = randomBytes(32).toString('hex')
  
  // Set session expiry to 7 days from now
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)
  
  // Store session in the database
  await db('sessions').insert({
    session_token: sessionToken,
    user_id: user.id,
    expires_at: expiresAt,
    is_active: true
  })
  
  // Set session cookie
  cookies().set('session', sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
    path: '/',
    sameSite: 'lax'
  })

  return { success: true, user, sessionToken }
}
