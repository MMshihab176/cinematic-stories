import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/server'
import type { Story } from '@/types'

export const dynamic = 'force-dynamic'

async function getDashboardData() {
  const supabase = createAdminClient()

  const { data: stories } = await supabase
    .from('stories')
    .select('id, title, slug, status, genre, mood, cover_image_url, updated_at')
    .order('updated_at', { ascending: false })

  const { count: chapterCount } = await supabase
    .from('chapters')
    .select('*', { count: 'exact', head: true })

  const { count: mediaCount } = await supabase
    .from('media_assets')
    .select('*', { count: 'exact', head: true })

  const { count: pendingComments } = await supabase
    .from('comments')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  return {
    stories: (stories ?? []) as Pick<Story, 'id'|'title'|'slug'|'status'|'genre'|'mood'|'cover_image_url'|'updated_at'>[],
    chapterCount: chapterCount ?? 0,
    mediaCount: mediaCount ?? 0,
    pendingComments: pendingComments ?? 0,
  }
}

const STATUS_STYLES: Record<string, string> = {
  published: 'bg-green-900/40 text-green-300 border-green-800',
  draft:     'bg-zinc-800 text-zinc-400 border-zinc-700',
  scheduled: 'bg-amber-900/40 text-amber-300 border-amber-800',
}

export default async function AdminDashboard() {
  const { stories, chapterCount, mediaCount, pendingComments } = await getDashboardData()

  const published = stories.filter(s => s.status === 'published').length
  const drafts    = stories.filter(s => s.status === 'draft').length
  const scheduled = stories.filter(s => s.status === 'scheduled').length

  return (
    <div className="p-6 sm:p-10 max-w-6xl">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <h1 className="text-2xl font-semibold" style={{ fontFamily: '"Playfair Display", serif' }}>
          Dashboard
        </h1>
        <Link
          href="/admin/stories/new"
          className="px-4 py-2 rounded-lg bg-[#e0c97f] text-[#0a0a0a] text-sm font-medium hover:opacity-90 transition-opacity"
        >
          + New Story
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-10">
        <StatCard label="Published" value={published} />
        <StatCard label="Drafts" value={drafts} />
        <StatCard label="Scheduled" value={scheduled} />
        <StatCard label="Chapters" value={chapterCount} />
        <StatCard label="Media Files" value={mediaCount} />
      </div>

      {pendingComments > 0 && (
        <div className="mb-8 px-4 py-3 rounded-lg bg-amber-900/20 border border-amber-800/50 text-amber-300 text-sm">
          {pendingComments} comment{pendingComments !== 1 ? 's' : ''} pending moderation.
        </div>
      )}

      {/* Recent stories */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm uppercase tracking-widest text-[#6b6555]">Recent Stories</h2>
        <Link href="/admin/stories" className="text-xs text-[#e0c97f] hover:underline">View all →</Link>
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
          {stories.slice(0, 5).map(story => (
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
                  <p className="text-xs text-[#6b6555] truncate">{story.genre} · {story.mood}</p>
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

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-[#1e1e1e] bg-[#101010] p-4">
      <p className="text-2xl font-semibold text-[#e0c97f]">{value}</p>
      <p className="text-xs text-[#6b6555] mt-1">{label}</p>
    </div>
  )
}
