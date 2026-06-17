import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { Session } from '@supabase/supabase-js'

/**
 * Verifies the current request comes from the authenticated admin
 * (the single user whose email matches ADMIN_EMAIL).
 * Returns the session if valid, or null otherwise.
 *
 * Note: middleware already blocks /api/admin/* for non-admins; this is
 * defense-in-depth for direct server-side calls.
 */
export async function requireAdminSession(): Promise<Session | null> {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session || session.user.email !== process.env.ADMIN_EMAIL) {
    return null
  }
  return session
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
