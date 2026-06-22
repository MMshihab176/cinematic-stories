import { createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import type { Story } from '@/types'
import { getAtmosphere } from '@/lib/atmosphere'
import { SearchBar } from '@/components/reader/SearchBar'

export const revalidate = 60

async function getPublishedStories(query?: string): Promise<Story[]> {
  const supabase = createServerClient()
  let q = supabase
    .from('stories')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  if (query) {
    q = q.or(`title.ilike.%${query}%,synopsis.ilike.%${query}%,genre.ilike.%${query}%`)
  }

  const { data, error } = await q
  if (error) { console.error('Homepage stories error:', error); return [] }
  return (data ?? []) as Story[]
}

export default async function HomePage({ searchParams }: { searchParams: { q?: string } }) {
  const query = searchParams?.q ?? ''
  const stories = await getPublishedStories(query)

  return (
    <main className="min-h-screen" style={{ background: 'var(--atmo-bg)', color: 'var(--atmo-text)' }}>
      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center py-24 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[var(--atmo-bg)] pointer-events-none z-10" />
        <Link
          href="/library"
          className="absolute top-6 right-6 z-20 text-xs uppercase tracking-widest hover:opacity-70 transition-opacity"
          style={{ color: 'var(--atmo-muted)' }}
        >
          ★ Library
        </Link>
        <h1
          className="relative z-20 text-5xl md:text-7xl font-bold tracking-tight mb-4"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--atmo-accent)' }}
        >
          {process.env.NEXT_PUBLIC_SITE_NAME ?? 'My Story Space'}
        </h1>
        <p className="relative z-20 text-lg md:text-xl max-w-xl mb-10" style={{ color: 'var(--atmo-muted)' }}>
          Cinematic stories that pull you into another world.
        </p>
        {/* Search bar */}
        <div className="relative z-20 w-full max-w-md">
          <SearchBar initialValue={query} />
        </div>
      </section>

      {/* Stories Grid */}
      <section className="max-w-7xl mx-auto px-4 pb-24">
        {query && (
          <p className="text-sm mb-6" style={{ color: 'var(--atmo-muted)' }}>
            {stories.length > 0
              ? `${stories.length} result${stories.length !== 1 ? 's' : ''} for "${query}"`
              : `No stories found for "${query}"`}
            {' · '}
            <Link href="/" className="hover:underline" style={{ color: 'var(--atmo-accent)' }}>Clear search</Link>
          </p>
        )}
        {stories.length === 0 && !query ? (
          <p className="text-center py-24" style={{ color: 'var(--atmo-muted)' }}>
            No stories published yet. Check back soon.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {stories.map(story => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

function StoryCard({ story }: { story: Story }) {
  const atmo = getAtmosphere(story.mood)
  return (
    <Link href={`/story/${story.slug}`} className="group block">
      <article
        className="rounded-xl overflow-hidden border transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
        style={{ background: atmo.surfaceColor, borderColor: atmo.borderColor }}
      >
        <div className="relative h-56 bg-black overflow-hidden">
          {story.cover_image_url ? (
            <Image
              src={story.cover_image_url}
              alt={story.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-700 opacity-80"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl" style={{ background: atmo.bgColor }}>
              <span style={{ color: atmo.accentColor }}>✦</span>
            </div>
          )}
          <span
            className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs uppercase tracking-widest"
            style={{ background: atmo.surfaceColor, color: atmo.accentColor, border: `1px solid ${atmo.borderColor}` }}
          >
            {story.genre}
          </span>
        </div>
        <div className="p-5">
          <h2
            className="text-xl font-semibold mb-2 leading-snug"
            style={{ fontFamily: 'var(--font-display)', color: atmo.textColor }}
          >
            {story.title}
          </h2>
          {story.synopsis && (
            <p className="text-sm line-clamp-2 mb-4" style={{ color: atmo.mutedColor }}>{story.synopsis}</p>
          )}
          <div className="flex flex-wrap gap-2">
            {story.tags.slice(0, 3).map(tag => (
              <span key={tag} className="text-xs px-2 py-0.5 rounded" style={{ background: `${atmo.accentColor}18`, color: atmo.accentColor }}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      </article>
    </Link>
  )
}
