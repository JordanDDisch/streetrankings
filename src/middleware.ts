import { NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  // Only run middleware for /dashboard routes
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    const sessionToken = request.cookies.get('session')?.value

    // If no session token, redirect to login
    if (!sessionToken || sessionToken.trim() === '') {
      const loginUrl = new URL('/login', request.url)
      return NextResponse.redirect(loginUrl)
    }

    // Basic token format validation (should be 64 hex characters)
    const tokenPattern = /^[a-f0-9]{64}$/i
    if (!tokenPattern.test(sessionToken)) {
      const loginUrl = new URL('/login', request.url)
      const response = NextResponse.redirect(loginUrl)
      
      // Clear the invalid session cookie
      response.cookies.delete('session')
      return response
    }

    // Continue to the requested page - full validation will happen in the dashboard pages
    return NextResponse.next()
  }

  // For all other routes, continue normally
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
} 