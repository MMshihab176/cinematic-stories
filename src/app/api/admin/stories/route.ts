import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAdminSession, unauthorizedResponse } from '@/lib/admin-session'
import { getAtmosphere } from '@/lib/atmosphere'
import { slugify } from '@/lib/utils'
import type { MoodType, StoryStatus } from '@/types'

// GET /api/admin/stories — list all stories (any status)
export async function GET() {
  if (!(await requireAdminSession())) return unauthorizedResponse()

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('stories')
    .select('*')
    .order('updated_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ stories: data })
}

// POST /api/admin/stories — create a new story
export async function POST(req: NextRequest) {
  if (!(await requireAdminSession())) return unauthorizedResponse()

  const body = await req.json()
  const {
    title, synopsis, genre, mood, tags, cover_image_url,
    series_id, series_order, status, scheduled_at,
  } = body as {
    title: string
    synopsis?: string
    genre?: string
    mood?: MoodType
    tags?: string[]
    cover_image_url?: string
    series_id?: string | null
    series_order?: number | null
    status?: StoryStatus
    scheduled_at?: string | null
  }

  if (!title?.trim()) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Generate a unique slug
  const baseSlug = slugify(title)
  let slug = baseSlug
  let suffix = 1
  while (true) {
    const { data: existing } = await supabase.from('stories').select('id').eq('slug', slug).maybeSingle()
    if (!existing) break
    slug = `${baseSlug}-${++suffix}`
  }

  const resolvedMood = (mood ?? 'default') as MoodType
  const atmosphere_config = getAtmosphere(resolvedMood)

  const { data, error } = await supabase
    .from('stories')
    .insert({
      title:             title.trim(),
      slug,
      synopsis:          synopsis ?? null,
      genre:             genre ?? 'drama',
      mood:              resolvedMood,
      tags:              tags ?? [],
      cover_image_url:   cover_image_url ?? null,
      series_id:         series_id ?? null,
      series_order:      series_order ?? null,
      status:            status ?? 'draft',
      scheduled_at:      scheduled_at ?? null,
      published_at:      status === 'published' ? new Date().toISOString() : null,
      atmosphere_config,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ story: data }, { status: 201 })
}
