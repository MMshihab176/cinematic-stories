import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/server'
import type { Story } from '@/types'

export const dynamic = 'force-dynamic'

const STATUS_STYLES: Record<string, string> = {
  published: 'bg-green-900/40 text-green-300 border-green-800',
  draft:     'bg-zinc-800 text-zinc-400 border-zinc-700',
  scheduled: 'bg-amber-900/40 text-amber-300 border-amber-800',
}

async function getStories() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('stories')
    .select('id, title, slug, status, genre, mood, cover_image_url, updated_at, series_id')
    .order('updated_at', { ascending: false })

  return (data ?? []) as Pick<Story, 'id'|'title'|'slug'|'status'|'genre'|'mood'|'cover_image_url'|'updated_at'|'series_id'>[]
}

export default async function AdminStoriesPage() {
  const stories = await getStories()

  return (
    <div className="p-6 sm:p-10 max-w-6xl">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <h1 className="text-2xl font-semibold" style={{ fontFamily: '"Playfair Display", serif' }}>
          All Stories
        </h1>
        <Link
          href="/admin/stories/new"
          className="px-4 py-2 rounded-lg bg-[#e0c97f] text-[#0a0a0a] text-sm font-medium hover:opacity-90 transition-opacity"
        >
          + New Story
        </Link>
      </div>

      {stories.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-[#2a2820] rounded-xl">
          <p className="text-[#6b6555] mb-4">No stories yet.</p>
          <Link href="/admin/stories/new" className="text-[#e0c97f] hover:underline text-sm">
            Create your first story →
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {stories.map(story => (
            <Link
              key={story.id}
              href={`/admin/stories/${story.id}`}
              className="flex items-center justify-between p-4 rounded-lg border border-[#1e1e1e] bg-[#101010] hover:bg-[#161616] transition-colors"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-12 h-16 rounded bg-[#1a1a1a] shrink-0 overflow-hidden flex items-center justify-center text-[#3a3830]">
                  {story.cover_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={story.cover_image_url} alt="" className="w-full h-full object-cover" />
                  ) : '✦'}
                </div>
                <div className="min-w-0">
                  <p className="font-medium truncate">{story.title}</p>
                  <p className="text-xs text-[#6b6555] truncate">{story.genre} · {story.mood} · /{story.slug}</p>
                </div>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full border shrink-0 ${STATUS_STYLES[story.status] ?? STATUS_STYLES.draft}`}>
                {story.status}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
