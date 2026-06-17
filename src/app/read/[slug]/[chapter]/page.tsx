import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import type { Story, Chapter } from '@/types'
import { ChapterReader } from '@/components/reader/ChapterReader'
import type { Metadata } from 'next'

interface Props {
  params: { slug: string; chapter: string }
}

async function getData(slug: string, chapterNum: number) {
  const supabase = createServerClient()

  const { data: story } = await supabase
    .from('stories')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (!story) return null

  const { data: chapter } = await supabase
    .from('chapters')
    .select('*')
    .eq('story_id', story.id)
    .eq('chapter_number', chapterNum)
    .eq('status', 'published')
    .single()

  if (!chapter) return null

  // Prev / next chapters
  const { data: siblings } = await supabase
    .from('chapters')
    .select('id, title, chapter_number')
    .eq('story_id', story.id)
    .eq('status', 'published')
    .in('chapter_number', [chapterNum - 1, chapterNum + 1])

  const prev = siblings?.find(c => c.chapter_number === chapterNum - 1) ?? null
  const next = siblings?.find(c => c.chapter_number === chapterNum + 1) ?? null

  return { story: story as Story, chapter: chapter as Chapter, prev, next }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const chapterNum = parseInt(params.chapter, 10)
  const data = await getData(params.slug, chapterNum)
  if (!data) return { title: 'Chapter Not Found' }

  return {
    title: `${data.chapter.title} | ${data.story.title}`,
  }
}

export default async function ChapterPage({ params }: Props) {
  const chapterNum = parseInt(params.chapter, 10)
  if (isNaN(chapterNum)) notFound()

  const data = await getData(params.slug, chapterNum)
  if (!data) notFound()

  return (
    <ChapterReader
      story={data.story}
      chapter={data.chapter}
      prev={data.prev}
      next={data.next}
    />
  )
}
