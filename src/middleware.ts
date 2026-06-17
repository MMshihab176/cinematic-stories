import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Refresh session if expired — required for Server Components to read it
  const { data: { session } } = await supabase.auth.getSession()

  const { pathname } = req.nextUrl
  const isLoginPage  = pathname === '/admin/login'
  const isAdminPage  = pathname.startsWith('/admin')
  const isAdminApi   = pathname.startsWith('/api/admin')

  if ((isAdminPage && !isLoginPage) || isAdminApi) {
    const isAdmin = session?.user?.email === process.env.ADMIN_EMAIL

    if (!isAdmin) {
      if (isAdminApi) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      const loginUrl = new URL('/admin/login', req.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  // If already logged in as admin, skip the login page
  if (isLoginPage && session?.user?.email === process.env.ADMIN_EMAIL) {
    return NextResponse.redirect(new URL('/admin', req.url))
  }

  return res
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}
