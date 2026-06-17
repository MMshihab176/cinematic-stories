'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { getAtmosphere } from '@/lib/atmosphere'
import type { MoodType } from '@/types'

interface BookmarkedStory {
  story_id: string
  stories: {
    slug: string
    title: string
    cover_image_url: string | null
    mood: MoodType
    genre: string
    synopsis: string | null
  } | null
}

export default function LibraryPage() {
  const [bookmarks, setBookmarks] = useState<BookmarkedStory[]>([])
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    fetch('/api/bookmarks')
      .then(r => r.json())
      .then(data => setBookmarks(data.bookmarks ?? []))
      .finally(() => setLoading(false))
  }, [])

  return (
    <main className="min-h-screen px-4 py-16 max-w-5xl mx-auto" style={{ background: '#0f0f0f', color: '#e8e0d0' }}>
      <Link href="/" className="text-xs uppercase tracking-widest text-[#6b6555] hover:text-[#e0c97f] transition-colors">
        ← Home
      </Link>

      <h1 className="text-3xl md:text-4xl font-bold mt-4 mb-8" style={{ fontFamily: '"Playfair Display", serif' }}>
        Your Library
      </h1>

      {loading ? (
        <p className="text-[#6b6555]">Loading...</p>
      ) : bookmarks.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-[#2a2820] rounded-xl">
          <p className="text-[#6b6555] mb-4">You haven't bookmarked any stories yet.</p>
          <Link href="/" className="text-[#e0c97f] hover:underline text-sm">Browse stories →</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {bookmarks.map(b => {
            if (!b.stories) return null
            const atmo = getAtmosphere(b.stories.mood)
            return (
              <Link key={b.story_id} href={`/story/${b.stories.slug}`} className="group block">
                <article
                  className="rounded-xl overflow-hidden border transition-all duration-300 hover:scale-[1.02]"
                  style={{ background: atmo.surfaceColor, borderColor: atmo.borderColor }}
                >
                  <div className="relative h-44 bg-black overflow-hidden">
                    {b.stories.cover_image_url ? (
                      <Image src={b.stories.cover_image_url} alt={b.stories.title} fill className="object-cover opacity-80" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl" style={{ background: atmo.bgColor, color: atmo.accentColor }}>✦</div>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="text-xs uppercase tracking-widest mb-1" style={{ color: atmo.accentColor }}>{b.stories.genre}</p>
                    <h2 className="font-semibold" style={{ fontFamily: 'var(--font-display)', color: atmo.textColor }}>{b.stories.title}</h2>
                  </div>
                </article>
              </Link>
            )
          })}
        </div>
      )}
    </main>
  )
}
