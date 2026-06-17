'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * Ensures every reader has a Supabase session (anonymous if not signed in)
 * so reading progress and bookmarks can sync via RLS-protected tables.
 *
 * Requires "Anonymous Sign-Ins" enabled in Supabase Dashboard → Authentication → Providers.
 */
export function useReaderSession(): string | null {
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    let active = true

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!active) return

      if (session?.user) {
        setUserId(session.user.id)
        return
      }

      const { data, error } = await supabase.auth.signInAnonymously()
      if (!active) return
      if (!error && data.user) setUserId(data.user.id)
    })

    return () => { active = false }
  }, [])

  return userId
}
