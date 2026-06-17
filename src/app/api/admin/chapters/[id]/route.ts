import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAdminSession, unauthorizedResponse } from '@/lib/admin-session'
import { wordCountFromTipTap } from '@/lib/utils'
import { indexChapter } from '@/lib/ai/embeddings'
import type { AudioTrack, StoryStatus } from '@/types'

interface Params { params: { id: string } }

// GET /api/admin/chapters/:id
export async function GET(_req: NextRequest, { params }: Params) {
  if (!(await requireAdminSession())) return unauthorizedResponse()

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('chapters')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Chapter not found' }, { status: 404 })
  return NextResponse.json({ chapter: data })
}

// PUT /api/admin/chapters/:id — update content/title/status/audio/order
export async function PUT(req: NextRequest, { params }: Params) {
  if (!(await requireAdminSession())) return unauthorizedResponse()

  const body = await req.json()
  const {
    title, content, status, audio_tracks, chapter_number, scheduled_at,
  } = body as {
    title?:          string
    content?:        object
    status?:         StoryStatus
    audio_tracks?:   AudioTrack[]
    chapter_number?: number
    scheduled_at?:   string | null
  }

  const supabase = createAdminClient()

  const updates: Record<string, unknown> = {}
  if (title !== undefined)          updates.title = title.trim()
  if (status !== undefined)         updates.status = status
  if (audio_tracks !== undefined)   updates.audio_tracks = audio_tracks
  if (chapter_number !== undefined) updates.chapter_number = chapter_number
  if (scheduled_at !== undefined)   updates.scheduled_at = scheduled_at
  if (content !== undefined) {
    updates.content = content
    updates.word_count = wordCountFromTipTap(content)
  }

  const { data, error } = await supabase
    .from('chapters')
    .update(updates)
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Re-index for AI chatbot RAG if content or status changed and chapter is published
  if ((content !== undefined || status !== undefined) && data.status === 'published') {
    indexChapter(data.story_id, data.id, data.content).catch(err =>
      console.error('Background reindex failed:', err)
    )
  }

  return NextResponse.json({ chapter: data })
}

// DELETE /api/admin/chapters/:id
export async function DELETE(_req: NextRequest, { params }: Params) {
  if (!(await requireAdminSession())) return unauthorizedResponse()

  const supabase = createAdminClient()
  const { error } = await supabase.from('chapters').delete().eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
