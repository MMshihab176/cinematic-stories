import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAdminSession, unauthorizedResponse } from '@/lib/admin-session'

// POST /api/admin/chapters — create a new (draft) chapter for a story
export async function POST(req: NextRequest) {
  if (!(await requireAdminSession())) return unauthorizedResponse()

  const { story_id, title } = await req.json() as { story_id: string; title?: string }

  if (!story_id) {
    return NextResponse.json({ error: 'story_id is required' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Determine next chapter number
  const { data: last } = await supabase
    .from('chapters')
    .select('chapter_number')
    .eq('story_id', story_id)
    .order('chapter_number', { ascending: false })
    .limit(1)
    .maybeSingle()

  const nextNumber = (last?.chapter_number ?? 0) + 1

  const { data, error } = await supabase
    .from('chapters')
    .insert({
      story_id,
      title:          title?.trim() || `Chapter ${nextNumber}`,
      chapter_number: nextNumber,
      content:        { type: 'doc', content: [{ type: 'paragraph' }] },
      status:         'draft',
      audio_tracks:   [],
      word_count:     0,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ chapter: data }, { status: 201 })
}
