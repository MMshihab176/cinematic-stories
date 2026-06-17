import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAdminSession, unauthorizedResponse } from '@/lib/admin-session'
import { indexChapter } from '@/lib/ai/embeddings'

// POST /api/admin/reindex — { chapterId } or { storyId } to rebuild AI embeddings
export async function POST(req: NextRequest) {
  if (!(await requireAdminSession())) return unauthorizedResponse()

  const { chapterId, storyId } = await req.json() as { chapterId?: string; storyId?: string }
  const supabase = createAdminClient()

  if (chapterId) {
    const { data: chapter, error } = await supabase
      .from('chapters')
      .select('id, story_id, content')
      .eq('id', chapterId)
      .single()

    if (error || !chapter) return NextResponse.json({ error: 'Chapter not found' }, { status: 404 })

    await indexChapter(chapter.story_id, chapter.id, chapter.content)
    return NextResponse.json({ ok: true, reindexed: 1 })
  }

  if (storyId) {
    const { data: chapters, error } = await supabase
      .from('chapters')
      .select('id, story_id, content')
      .eq('story_id', storyId)
      .eq('status', 'published')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    for (const ch of chapters ?? []) {
      await indexChapter(ch.story_id, ch.id, ch.content)
    }
    return NextResponse.json({ ok: true, reindexed: chapters?.length ?? 0 })
  }

  return NextResponse.json({ error: 'chapterId or storyId is required' }, { status: 400 })
}
