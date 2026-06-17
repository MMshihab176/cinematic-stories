'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { ATMOSPHERE_PRESETS } from '@/lib/atmosphere'
import { MediaPickerModal } from '@/components/admin/MediaPickerModal'
import type { MoodType, Story, StoryStatus } from '@/types'

const MOOD_OPTIONS: MoodType[] = Object.keys(ATMOSPHERE_PRESETS) as MoodType[]

interface Props {
  mode:  'create' | 'edit'
  story?: Story
}

export function StoryForm({ mode, story }: Props) {
  const router = useRouter()
  const [title,     setTitle]     = useState(story?.title ?? '')
  const [synopsis,  setSynopsis]  = useState(story?.synopsis ?? '')
  const [genre,     setGenre]     = useState(story?.genre ?? 'drama')
  const [mood,      setMood]      = useState<MoodType>(story?.mood ?? 'default')
  const [tags,      setTags]      = useState(story?.tags?.join(', ') ?? '')
  const [coverUrl,  setCoverUrl]  = useState(story?.cover_image_url ?? '')
  const [status,    setStatus]    = useState<StoryStatus>(story?.status ?? 'draft')
  const [scheduledAt, setScheduledAt] = useState(story?.scheduled_at?.slice(0, 16) ?? '')
  const [saving,    setSaving]    = useState(false)
  const [pickerOpen,setPickerOpen]= useState(false)

  const atmo = ATMOSPHERE_PRESETS[mood]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) { toast.error('Title is required'); return }
    setSaving(true)

    const payload = {
      title,
      synopsis: synopsis || null,
      genre,
      mood,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      cover_image_url: coverUrl || null,
      status,
      scheduled_at: status === 'scheduled' && scheduledAt ? new Date(scheduledAt).toISOString() : null,
    }

    try {
      if (mode === 'create') {
        const res = await fetch('/api/admin/stories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        toast.success('Story created')
        router.push(`/admin/stories/${data.story.id}`)
      } else if (story) {
        const res = await fetch(`/api/admin/stories/${story.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        toast.success('Saved')
        router.refresh()
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!story) return
    if (!confirm(`Delete "${story.title}" and all its chapters? This cannot be undone.`)) return

    const res = await fetch(`/api/admin/stories/${story.id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Story deleted')
      router.push('/admin/stories')
    } else {
      toast.error('Delete failed')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Title */}
      <div>
        <label className="block text-xs uppercase tracking-widest text-[#6b6555] mb-2">Title</label>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
          className="w-full px-4 py-3 rounded-lg bg-[#101010] border border-[#1e1e1e] text-[#e8e0d0] outline-none focus:border-[#e0c97f] transition-colors"
          placeholder="The Hollow Crown"
        />
      </div>

      {/* Synopsis */}
      <div>
        <label className="block text-xs uppercase tracking-widest text-[#6b6555] mb-2">Synopsis</label>
        <textarea
          value={synopsis}
          onChange={e => setSynopsis(e.target.value)}
          rows={3}
          className="w-full px-4 py-3 rounded-lg bg-[#101010] border border-[#1e1e1e] text-[#e8e0d0] outline-none focus:border-[#e0c97f] transition-colors resize-none"
          placeholder="A short hook readers see on the cinematic intro screen..."
        />
      </div>

      {/* Genre + Mood */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs uppercase tracking-widest text-[#6b6555] mb-2">Genre Label</label>
          <input
            value={genre}
            onChange={e => setGenre(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-[#101010] border border-[#1e1e1e] text-[#e8e0d0] outline-none focus:border-[#e0c97f] transition-colors"
            placeholder="Psychological Thriller"
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-[#6b6555] mb-2">Atmosphere / Mood</label>
          <select
            value={mood}
            onChange={e => setMood(e.target.value as MoodType)}
            className="w-full px-4 py-3 rounded-lg bg-[#101010] border border-[#1e1e1e] text-[#e8e0d0] outline-none focus:border-[#e0c97f] transition-colors capitalize"
          >
            {MOOD_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>

      {/* Atmosphere preview */}
      <div
        className="rounded-lg p-4 flex items-center gap-3 border"
        style={{ background: atmo.surfaceColor, borderColor: atmo.borderColor }}
      >
        <div className="flex gap-1.5">
          {[atmo.bgColor, atmo.accentColor, atmo.mutedColor].map((c, i) => (
            <span key={i} className="w-5 h-5 rounded-full border border-white/10" style={{ background: c }} />
          ))}
        </div>
        <p className="text-xs" style={{ color: atmo.textColor }}>
          {atmo.particles !== 'none' ? `${atmo.particles} particles · ` : ''}{atmo.fontDisplay.split(',')[0].replace(/"/g, '')}
        </p>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-xs uppercase tracking-widest text-[#6b6555] mb-2">Tags (comma-separated)</label>
        <input
          value={tags}
          onChange={e => setTags(e.target.value)}
          className="w-full px-4 py-3 rounded-lg bg-[#101010] border border-[#1e1e1e] text-[#e8e0d0] outline-none focus:border-[#e0c97f] transition-colors"
          placeholder="revenge, university, courtroom drama"
        />
      </div>

      {/* Cover image */}
      <div>
        <label className="block text-xs uppercase tracking-widest text-[#6b6555] mb-2">Cover Image</label>
        <div className="flex items-center gap-4">
          <div className="w-20 h-28 rounded bg-[#101010] border border-[#1e1e1e] overflow-hidden flex items-center justify-center text-[#3a3830] shrink-0">
            {coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coverUrl} alt="" className="w-full h-full object-cover" />
            ) : '✦'}
          </div>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="px-3 py-1.5 rounded-lg border border-[#2a2820] text-sm hover:bg-[#161616] transition-colors"
            >
              Choose from Media Library
            </button>
            {coverUrl && (
              <button type="button" onClick={() => setCoverUrl('')} className="text-xs text-[#6b6555] hover:text-red-400 text-left">
                Remove cover
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Status */}
      <div>
        <label className="block text-xs uppercase tracking-widest text-[#6b6555] mb-2">Status</label>
        <div className="flex gap-2">
          {(['draft', 'published', 'scheduled'] as StoryStatus[]).map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={`px-4 py-2 rounded-lg text-sm capitalize border transition-colors ${
                status === s
                  ? 'bg-[#e0c97f] text-[#0a0a0a] border-[#e0c97f]'
                  : 'border-[#2a2820] text-[#a8a090] hover:bg-[#161616]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        {status === 'scheduled' && (
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={e => setScheduledAt(e.target.value)}
            className="mt-3 px-4 py-2.5 rounded-lg bg-[#101010] border border-[#1e1e1e] text-[#e8e0d0] outline-none focus:border-[#e0c97f] transition-colors"
          />
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2.5 rounded-lg bg-[#e0c97f] text-[#0a0a0a] text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {saving ? 'Saving...' : mode === 'create' ? 'Create Story' : 'Save Changes'}
        </button>
        {mode === 'edit' && (
          <button
            type="button"
            onClick={handleDelete}
            className="px-5 py-2.5 rounded-lg border border-red-900/50 text-red-400 text-sm hover:bg-red-950/30 transition-colors"
          >
            Delete Story
          </button>
        )}
      </div>

      {pickerOpen && (
        <MediaPickerModal
          fileType="image"
          onSelect={url => { setCoverUrl(url); setPickerOpen(false) }}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </form>
  )
}
