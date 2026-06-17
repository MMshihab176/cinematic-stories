import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

// POST: toggle a bookmark for the current session
export async function POST(req: NextRequest) {
  const { story_id, action } = await req.json() as { story_id: string; action: 'add' | 'remove' }

  if (!story_id) {
    return NextResponse.json({ error: 'story_id is required' }, { status: 400 })
  }

  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ ok: true, persisted: false })
  }

  if (action === 'remove') {
    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('user_id', session.user.id)
      .eq('story_id', story_id)

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  } else {
    const { error } = await supabase
      .from('bookmarks')
      .upsert({ user_id: session.user.id, story_id }, { onConflict: 'user_id,story_id' })

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, persisted: true })
}

// GET: list bookmarked stories for the current session
export async function GET() {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ bookmarks: [] })
  }

  const { data, error } = await supabase
    .from('bookmarks')
    .select('story_id, created_at, stories(slug, title, cover_image_url, mood, genre, synopsis)')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ bookmarks: [] })

  return NextResponse.json({ bookmarks: data ?? [] })
}
