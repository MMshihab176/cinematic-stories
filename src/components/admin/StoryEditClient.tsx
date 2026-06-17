'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { StoryForm } from './StoryForm'
import type { Chapter, Story } from '@/types'

type ChapterListItem = Pick<Chapter, 'id' | 'title' | 'chapter_number' | 'status' | 'word_count' | 'audio_tracks'>

interface Props {
  story:    Story
  chapters: ChapterListItem[]
}

const STATUS_STYLES: Record<string, string> = {
  published: 'bg-green-900/40 text-green-300 border-green-800',
  draft:     'bg-zinc-800 text-zinc-400 border-zinc-700',
  scheduled: 'bg-amber-900/40 text-amber-300 border-amber-800',
}

export function StoryEditClient({ story, chapters: initial }: Props) {
  const router = useRouter()
  const [chapters, setChapters] = useState(
    [...initial].sort((a, b) => a.chapter_number - b.chapter_number)
  )
  const [adding, setAdding] = useState(false)

  const addChapter = async () => {
    setAdding(true)
    try {
      const res = await fetch('/api/admin/chapters', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ story_id: story.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      router.push(`/admin/stories/${story.id}/chapters/${data.chapter.id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create chapter')
      setAdding(false)
    }
  }

  const deleteChapter = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return
    const res = await fetch(`/api/admin/chapters/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setChapters(prev => prev.filter(c => c.id !== id))
      toast.success('Chapter deleted')
    } else {
      toast.error('Delete failed')
    }
  }

  // 3-step swap avoids the unique(story_id, chapter_number) constraint
  const move = async (index: number, dir: -1 | 1) => {
    const target = index + dir
    if (target < 0 || target >= chapters.length) return

    const a = chapters[index]
    const b = chapters[target]
    const put = (id: string, chapter_number: number) =>
      fetch(`/api/admin/chapters/${id}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ chapter_number }),
      })

    await put(a.id, -1)
    await put(b.id, a.chapter_number)
    await put(a.id, b.chapter_number)

    const next = [...chapters]
    next[index]  = { ...b, chapter_number: a.chapter_number }
    next[target] = { ...a, chapter_number: b.chapter_number }
    setChapters(next)
  }

  return (
    <div className="p-6 sm:p-10 max-w-4xl">
      <Link href="/admin/stories" className="text-xs uppercase tracking-widest text-[#6b6555] hover:text-[#e0c97f] transition-colors">
        ← All Stories
      </Link>

      <div className="flex items-center justify-between mt-3 mb-8 flex-wrap gap-2">
        <h1 className="text-2xl font-semibold" style={{ fontFamily: '"Playfair Display", serif' }}>
          {story.title}
        </h1>
        {story.status === 'published' && (
          <a href={`/story/${story.slug}`} target="_blank" rel="noopener noreferrer" className="text-sm text-[#e0c97f] hover:underline">
            View live page ↗
          </a>
        )}
      </div>

      <StoryForm mode="edit" story={story} />

      <hr className="my-10 border-[#1e1e1e]" />

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm uppercase tracking-widest text-[#6b6555]">Chapters</h2>
        <button
          onClick={addChapter}
          disabled={adding}
          className="px-4 py-2 rounded-lg bg-[#e0c97f] text-[#0a0a0a] text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {adding ? 'Creating...' : '+ Add Chapter'}
        </button>
      </div>

      {chapters.length === 0 ? (
        <p className="text-sm text-[#6b6555]">No chapters yet — add one to start writing.</p>
      ) : (
        <div className="space-y-2 pb-10">
          {chapters.map((ch, i) => (
            <div key={ch.id} className="flex items-center gap-3 p-3 rounded-lg border border-[#1e1e1e] bg-[#101010]">
              <div className="flex flex-col gap-0.5 shrink-0">
                <button onClick={() => move(i, -1)} disabled={i === 0} className="text-xs text-[#6b6555] hover:text-[#e0c97f] disabled:opacity-20">▲</button>
                <button onClick={() => move(i, 1)} disabled={i === chapters.length - 1} className="text-xs text-[#6b6555] hover:text-[#e0c97f] disabled:opacity-20">▼</button>
              </div>

              <Link href={`/admin/stories/${story.id}/chapters/${ch.id}`} className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">Ch. {ch.chapter_number}: {ch.title}</p>
                <p className="text-xs text-[#6b6555]">
                  {ch.word_count.toLocaleString()} words
                  {ch.audio_tracks?.length ? ` · ${ch.audio_tracks.length} audio track${ch.audio_tracks.length > 1 ? 's' : ''}` : ''}
                </p>
              </Link>

              <span className={`text-xs px-2 py-0.5 rounded-full border shrink-0 ${STATUS_STYLES[ch.status] ?? STATUS_STYLES.draft}`}>
                {ch.status}
              </span>

              <button onClick={() => deleteChapter(ch.id, ch.title)} className="text-red-400 hover:text-red-300 text-sm shrink-0" title="Delete chapter">
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
