import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import { StoryEditClient } from '@/components/admin/StoryEditClient'
import type { Chapter, Story } from '@/types'

export const dynamic = 'force-dynamic'

type ChapterListItem = Pick<Chapter, 'id' | 'title' | 'chapter_number' | 'status' | 'word_count' | 'audio_tracks'>

interface Props {
  params: { id: string }
}

export default async function StoryEditPage({ params }: Props) {
  const supabase = createAdminClient()

  const { data: story } = await supabase.from('stories').select('*').eq('id', params.id).single()
  if (!story) notFound()

  const { data: chapters } = await supabase
    .from('chapters')
    .select('id, title, chapter_number, status, word_count, audio_tracks')
    .eq('story_id', params.id)
    .order('chapter_number', { ascending: true })

  return (
    <StoryEditClient
      story={story as Story}
      chapters={(chapters ?? []) as ChapterListItem[]}
    />
  )
}
