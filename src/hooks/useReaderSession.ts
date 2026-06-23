'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useReaderSession(): string | null {
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    let active = true

    const init = async () => {
      // Check existing session first
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        if (active) setUserId(session.user.id)
        return
      }

      // Check localStorage for cached user id
      const cached = localStorage.getItem('reader_user_id')
      if (cached) {
        if (active) setUserId(cached)
      }

      // Try anonymous sign in
      try {
        const { data, error } = await supabase.auth.signInAnonymously()
        if (!active) return
        if (!error && data.user) {
          localStorage.setItem('reader_user_id', data.user.id)
          setUserId(data.user.id)
        }
      } catch {
        // Anonymous auth not enabled — use localStorage-only mode
        const fallbackId = localStorage.getItem('reader_user_id') 
          ?? `local_${Math.random().toString(36).slice(2)}`
        localStorage.setItem('reader_user_id', fallbackId)
        if (active) setUserId(fallbackId)
      }
    }

    init()
    return () => { active = false }
  }, [])

  return userId
}
