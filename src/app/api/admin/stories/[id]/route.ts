import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAdminSession, unauthorizedResponse } from '@/lib/admin-session'
import { getAtmosphere } from '@/lib/atmosphere'
import { slugify } from '@/lib/utils'
import type { MoodType, StoryStatus } from '@/types'

interface Params { params: { id: string } }

// GET /api/admin/stories/:id — story + chapters
export async function GET(_req: NextRequest, { params }: Params) {
  if (!(await requireAdminSession())) return unauthorizedResponse()

  const supabase = createAdminClient()

  const { data: story, error } = await supabase
    .from('stories')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !story) return NextResponse.json({ error: 'Story not found' }, { status: 404 })

  const { data: chapters } = await supabase
    .from('chapters')
    .select('id, title, chapter_number, status, word_count, audio_tracks, created_at, updated_at')
    .eq('story_id', params.id)
    .order('chapter_number', { ascending: true })

  return NextResponse.json({ story, chapters: chapters ?? [] })
}

// PUT /api/admin/stories/:id — update story metadata
export async function PUT(req: NextRequest, { params }: Params) {
  if (!(await requireAdminSession())) return unauthorizedResponse()

  const body = await req.json()
  const {
    title, synopsis, genre, mood, tags, cover_image_url,
    series_id, series_order, status, scheduled_at, regenerateSlug,
  } = body as {
    title?: string
    synopsis?: string | null
    genre?: string
    mood?: MoodType
    tags?: string[]
    cover_image_url?: string | null
    series_id?: string | null
    series_order?: number | null
    status?: StoryStatus
    scheduled_at?: string | null
    regenerateSlug?: boolean
  }

  const supabase = createAdminClient()

  const updates: Record<string, unknown> = {}
  if (title !== undefined)            updates.title = title.trim()
  if (synopsis !== undefined)         updates.synopsis = synopsis
  if (genre !== undefined)            updates.genre = genre
  if (tags !== undefined)             updates.tags = tags
  if (cover_image_url !== undefined)  updates.cover_image_url = cover_image_url
  if (series_id !== undefined)        updates.series_id = series_id
  if (series_order !== undefined)     updates.series_order = series_order
  if (scheduled_at !== undefined)     updates.scheduled_at = scheduled_at

  // Mood change → regenerate atmosphere config
  if (mood !== undefined) {
    updates.mood = mood
    updates.atmosphere_config = getAtmosphere(mood)
  }

  // Status transitions
  if (status !== undefined) {
    updates.status = status
    if (status === 'published') {
      const { data: current } = await supabase.from('stories').select('published_at').eq('id', params.id).single()
      if (!current?.published_at) updates.published_at = new Date().toISOString()
    }
  }

  // Optional slug regeneration
  if (regenerateSlug && title) {
    const baseSlug = slugify(title)
    let slug = baseSlug
    let suffix = 1
    while (true) {
      const { data: existing } = await supabase.from('stories').select('id').eq('slug', slug).neq('id', params.id).maybeSingle()
      if (!existing) break
      slug = `${baseSlug}-${++suffix}`
    }
    updates.slug = slug
  }

  const { data, error } = await supabase
    .from('stories')
    .update(updates)
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ story: data })
}

// DELETE /api/admin/stories/:id — cascades to chapters, embeddings, etc.
export async function DELETE(_req: NextRequest, { params }: Params) {
  if (!(await requireAdminSession())) return unauthorizedResponse()

  const supabase = createAdminClient()
  const { error } = await supabase.from('stories').delete().eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
