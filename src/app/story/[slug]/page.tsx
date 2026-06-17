import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import type { Story, Chapter } from '@/types'
import { StoryIntroClient } from '@/components/reader/StoryIntroClient'
import type { Metadata } from 'next'

interface Props {
  params: { slug: string }
}

async function getStory(slug: string): Promise<{ story: Story; chapters: Chapter[] } | null> {
  const supabase = createServerClient()

  const { data: story, error } = await supabase
    .from('stories')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (error || !story) return null

  const { data: chapters } = await supabase
    .from('chapters')
    .select('id, title, chapter_number, word_count, status, story_id, audio_tracks, created_at, updated_at')
    .eq('story_id', story.id)
    .eq('status', 'published')
    .order('chapter_number', { ascending: true })

  return { story: story as Story, chapters: (chapters ?? []) as Chapter[] }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await getStory(params.slug)
  if (!data) return { title: 'Story Not Found' }

  return {
    title:       data.story.title,
    description: data.story.synopsis ?? undefined,
    openGraph: {
      title:       data.story.title,
      description: data.story.synopsis ?? undefined,
      images:      data.story.cover_image_url ? [data.story.cover_image_url] : [],
    },
  }
}

export default async function StoryPage({ params }: Props) {
  const data = await getStory(params.slug)
  if (!data) notFound()

  const { story, chapters } = data

  return (
    <StoryIntroClient story={story} chapters={chapters} />
  )
}
