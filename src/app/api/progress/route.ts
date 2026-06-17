import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

// POST: upsert reading progress for the current session (anon or authenticated)
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { chapter_id, story_id, scroll_position, completed } = body as {
    chapter_id: string
    story_id: string
    scroll_position: number
    completed?: boolean
  }

  if (!chapter_id || !story_id) {
    return NextResponse.json({ error: 'chapter_id and story_id are required' }, { status: 400 })
  }

  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  // No session yet (e.g. anonymous auth not enabled) — fail gracefully, client keeps local state
  if (!session) {
    return NextResponse.json({ ok: true, persisted: false })
  }

  const { error } = await supabase
    .from('reading_progress')
    .upsert(
      {
        user_id:         session.user.id,
        story_id,
        chapter_id,
        scroll_position: Math.max(0, Math.min(100, scroll_position ?? 0)),
        completed:        completed ?? false,
        last_read_at:     new Date().toISOString(),
      },
      { onConflict: 'user_id,chapter_id' }
    )

  if (error) {
    console.error('Progress upsert error:', error)
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, persisted: true })
}

// GET: list recent reading progress for "Continue Reading"
export async function GET() {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ progress: [] })
  }

  const { data, error } = await supabase
    .from('reading_progress')
    .select('story_id, chapter_id, scroll_position, completed, last_read_at, stories(slug, title, cover_image_url, mood), chapters(chapter_number, title)')
    .eq('user_id', session.user.id)
    .order('last_read_at', { ascending: false })
    .limit(10)

  if (error) {
    return NextResponse.json({ progress: [] })
  }

  return NextResponse.json({ progress: data ?? [] })
}
