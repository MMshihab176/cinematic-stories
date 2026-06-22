'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

export function SearchBar({ initialValue = '' }: { initialValue?: string }) {
  const [value, setValue] = useState(initialValue)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(() => {
      if (value.trim()) {
        router.push(`/?q=${encodeURIComponent(value.trim())}`)
      } else {
        router.push('/')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center w-full gap-2">
      <input
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder="গল্প খুঁজুন... (Search stories)"
        className="flex-1 px-4 py-3 rounded-xl text-sm outline-none transition-all"
        style={{
          background: 'var(--atmo-surface)',
          border: '1px solid var(--atmo-border)',
          color: 'var(--atmo-text)',
        }}
      />
      <button
        type="submit"
        disabled={isPending}
        className="px-4 py-3 rounded-xl text-sm font-medium transition-all disabled:opacity-50 shrink-0"
        style={{
          background: 'var(--atmo-accent)',
          color: 'var(--atmo-bg)',
        }}
      >
        {isPending ? '...' : '🔍'}
      </button>
    </form>
  )
}
