import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import { ChapterEditorClient } from '@/components/admin/ChapterEditorClient'
import type { Story, Chapter } from '@/types'

export const dynamic = 'force-dynamic'

interface Props {
  params: { id: string; chapterId: string }
}

export default async function ChapterEditorPage({ params }: Props) {
  const supabase = createAdminClient()

  const { data: chapter } = await supabase
    .from('chapters')
    .select('*')
    .eq('id', params.chapterId)
    .eq('story_id', params.id)
    .single()

  if (!chapter) notFound()

  const { data: story } = await supabase
    .from('stories')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!story) notFound()

  return <ChapterEditorClient story={story as Story} chapter={chapter as Chapter} />
}
