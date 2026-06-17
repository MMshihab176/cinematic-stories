'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { TipTapEditor } from './TipTapEditor'
import { AudioAttacher } from './AudioAttacher'
import { wordCountFromTipTap } from '@/lib/utils'
import type { AudioTrack, Chapter, Story, StoryStatus } from '@/types'

interface Props {
  story:   Story
  chapter: Chapter
}

export function ChapterEditorClient({ story, chapter }: Props) {
  const router = useRouter()
  const [title,         setTitle]         = useState(chapter.title)
  const [chapterNumber, setChapterNumber] = useState(chapter.chapter_number)
  const [content,       setContent]       = useState<object>(chapter.content)
  const [status,        setStatus]        = useState<StoryStatus>(chapter.status)
  const [scheduledAt,   setScheduledAt]   = useState(chapter.scheduled_at?.slice(0, 16) ?? '')
  const [audioTracks,   setAudioTracks]   = useState<AudioTrack[]>(chapter.audio_tracks)
  const [saving,        setSaving]        = useState(false)
  const [reindexing,    setReindexing]    = useState(false)

  const wordCount = wordCountFromTipTap(content)

  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/chapters/${chapter.id}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          chapter_number: chapterNumber,
          content,
          status,
          scheduled_at: status === 'scheduled' && scheduledAt ? new Date(scheduledAt).toISOString() : null,
          audio_tracks: audioTracks,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Chapter saved')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }, [chapter.id, title, chapterNumber, content, status, scheduledAt, audioTracks, router])

  const handleDelete = async () => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return
    const res = await fetch(`/api/admin/chapters/${chapter.id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Chapter deleted')
      router.push(`/admin/stories/${story.id}`)
    } else {
      toast.error('Delete failed')
    }
  }

  const handleReindex = async () => {
    setReindexing(true)
    try {
      const res = await fetch('/api/admin/reindex', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ chapterId: chapter.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('AI assistant reindexed')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Reindex failed')
    } finally {
      setReindexing(false)
    }
  }

  return (
    <div className="p-6 sm:p-10 max-w-4xl">
      <Link href={`/admin/stories/${story.id}`} className="text-xs uppercase tracking-widest text-[#6b6555] hover:text-[#e0c97f] transition-colors">
        ← {story.title}
      </Link>

      <div className="flex items-end justify-between gap-4 mt-3 mb-6 flex-wrap">
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="text-2xl font-semibold bg-transparent border-none outline-none flex-1 min-w-[200px]"
          style={{ fontFamily: '"Playfair Display", serif' }}
          placeholder="Chapter title"
        />
        <div className="flex items-center gap-2 text-sm shrink-0">
          <span className="text-[#6b6555]">Ch.</span>
          <input
            type="number"
            min={1}
            value={chapterNumber}
            onChange={e => setChapterNumber(parseInt(e.target.value, 10) || 1)}
            className="w-16 px-2 py-1.5 rounded bg-[#101010] border border-[#1e1e1e] text-center"
          />
        </div>
      </div>

      {/* Status + word count */}
      <div className="flex items-center gap-3 mb-2 flex-wrap">
        {(['draft', 'published', 'scheduled'] as StoryStatus[]).map(s => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-xs capitalize border transition-colors ${
              status === s ? 'bg-[#e0c97f] text-[#0a0a0a] border-[#e0c97f]' : 'border-[#2a2820] text-[#a8a090] hover:bg-[#161616]'
            }`}
          >
            {s}
          </button>
        ))}
        <span className="text-xs text-[#6b6555] ml-auto">
          {wordCount.toLocaleString()} words · ~{Math.max(1, Math.ceil(wordCount / 200))} min read
        </span>
      </div>

      {status === 'scheduled' && (
        <input
          type="datetime-local"
          value={scheduledAt}
          onChange={e => setScheduledAt(e.target.value)}
          className="mb-6 px-4 py-2 rounded-lg bg-[#101010] border border-[#1e1e1e] text-sm outline-none focus:border-[#e0c97f] transition-colors"
        />
      )}
      {status !== 'scheduled' && <div className="mb-6" />}

      {/* Editor */}
      <div className="mb-8">
        <label className="block text-xs uppercase tracking-widest text-[#6b6555] mb-2">Content</label>
        <TipTapEditor content={content} onChange={setContent} storyId={story.id} />
      </div>

      {/* Audio */}
      <div className="mb-8">
        <label className="block text-xs uppercase tracking-widest text-[#6b6555] mb-2">Background Audio</label>
        <AudioAttacher tracks={audioTracks} onChange={setAudioTracks} storyId={story.id} />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 flex-wrap pb-10">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 rounded-lg bg-[#e0c97f] text-[#0a0a0a] text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Chapter'}
        </button>

        {status === 'published' && (
          <a
            href={`/read/${story.slug}/${chapter.chapter_number}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2.5 rounded-lg border border-[#2a2820] text-sm hover:bg-[#161616] transition-colors"
          >
            Preview ↗
          </a>
        )}

        <button
          onClick={handleReindex}
          disabled={reindexing}
          className="px-5 py-2.5 rounded-lg border border-[#2a2820] text-sm hover:bg-[#161616] transition-colors disabled:opacity-50"
        >
          {reindexing ? 'Reindexing...' : '✦ Reindex for AI'}
        </button>

        <button
          onClick={handleDelete}
          className="px-5 py-2.5 rounded-lg border border-red-900/50 text-red-400 text-sm hover:bg-red-950/30 transition-colors ml-auto"
        >
          Delete Chapter
        </button>
      </div>
    </div>
  )
}
