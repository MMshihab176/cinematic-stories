// src/lib/supabase/server.ts
// Server-side clients for API routes and Server Components
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// For Server Components (respects RLS, uses user session)
export const createServerClient = () =>
  createServerComponentClient({ cookies })

// For admin API routes (bypasses RLS via service_role key)
export const createAdminClient = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
