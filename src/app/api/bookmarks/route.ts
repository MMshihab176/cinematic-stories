import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// POST: toggle a bookmark — client sends userId directly since
// anonymous sessions don't reliably propagate to server-side cookies on Vercel edge.
export async function POST(req: NextRequest) {
  const { story_id, action, user_id } = await req.json() as {
    story_id: string
    action: 'add' | 'remove'
    user_id: string
  }

  if (!story_id || !user_id) {
    return NextResponse.json({ error: 'story_id and user_id are required' }, { status: 400 })
  }

  const supabase = createAdminClient()

  if (action === 'remove') {
    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('user_id', user_id)
      .eq('story_id', story_id)

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  } else {
    const { error } = await supabase
      .from('bookmarks')
      .upsert({ user_id, story_id }, { onConflict: 'user_id,story_id' })

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, persisted: true })
}

// GET: list bookmarked stories — user_id passed as query param
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const user_id = searchParams.get('user_id')

  if (!user_id) {
    return NextResponse.json({ bookmarks: [] })
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('bookmarks')
    .select('story_id, created_at, stories(slug, title, cover_image_url, mood, genre, synopsis)')
    .eq('user_id', user_id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ bookmarks: [] })
  return NextResponse.json({ bookmarks: data ?? [] })
}
