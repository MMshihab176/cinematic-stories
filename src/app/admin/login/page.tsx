'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AdminLoginPage() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState<string | null>(null)
  const [loading,  setLoading]  = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    // Server-side middleware verifies this session belongs to ADMIN_EMAIL
    // and will redirect back here if it doesn't match.
    router.push('/admin')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold text-center mb-2 text-[#e8e0d0]" style={{ fontFamily: '"Playfair Display", serif' }}>
          Admin Sign In
        </h1>
        <p className="text-center text-sm text-[#6b6555] mb-8">
          {process.env.NEXT_PUBLIC_SITE_NAME ?? 'My Story Space'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-widest text-[#6b6555] mb-2">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-[#1a1a1a] border border-[#2a2820] text-[#e8e0d0] outline-none focus:border-[#e0c97f] transition-colors"
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-[#6b6555] mb-2">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-[#1a1a1a] border border-[#2a2820] text-[#e8e0d0] outline-none focus:border-[#e0c97f] transition-colors"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-[#e0c97f] text-[#0a0a0a] font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-xs text-[#4a4838] mt-8">
          Single-admin access only. Create this account in your Supabase project
          under Authentication → Users.
        </p>
      </div>
    </div>
  )
}
