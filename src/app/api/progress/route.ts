import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// POST: upsert reading progress — user_id sent from client
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { chapter_id, story_id, scroll_position, completed, user_id } = body as {
    chapter_id: string
    story_id: string
    scroll_position: number
    completed?: boolean
    user_id?: string
  }

  if (!chapter_id || !story_id || !user_id) {
    return NextResponse.json({ ok: true, persisted: false })
  }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('reading_progress')
    .upsert(
      {
        user_id,
        story_id,
        chapter_id,
        scroll_position: Math.max(0, Math.min(100, scroll_position ?? 0)),
        completed: completed ?? false,
        last_read_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,chapter_id' }
    )

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true, persisted: true })
}

// GET: continue-reading list
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const user_id = searchParams.get('user_id')

  if (!user_id) return NextResponse.json({ progress: [] })

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('reading_progress')
    .select('story_id, chapter_id, scroll_position, completed, last_read_at, stories(slug, title, cover_image_url, mood), chapters(chapter_number, title)')
    .eq('user_id', user_id)
    .order('last_read_at', { ascending: false })
    .limit(10)

  if (error) return NextResponse.json({ progress: [] })
  return NextResponse.json({ progress: data ?? [] })
}
