import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// Called by Vercel Cron (see vercel.json) every 15 minutes.
// Publishes any story/chapter whose scheduled_at has passed.
// Protected by CRON_SECRET — NOT covered by the /api/admin/* middleware guard.
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const now = new Date().toISOString()

  const { data: stories, error: storyErr } = await supabase
    .from('stories')
    .update({ status: 'published', published_at: now })
    .eq('status', 'scheduled')
    .lte('scheduled_at', now)
    .select('id, title')

  const { data: chapters, error: chapterErr } = await supabase
    .from('chapters')
    .update({ status: 'published' })
    .eq('status', 'scheduled')
    .lte('scheduled_at', now)
    .select('id, story_id, title')

  if (storyErr || chapterErr) {
    return NextResponse.json({ error: storyErr?.message ?? chapterErr?.message }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    publishedStories:  stories?.length ?? 0,
    publishedChapters: chapters?.length ?? 0,
  })
}
