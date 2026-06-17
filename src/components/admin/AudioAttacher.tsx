'use client'

import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { MediaPickerModal } from './MediaPickerModal'
import type { AudioMoodTag, AudioTrack, MediaAsset } from '@/types'

const MOOD_TAGS: AudioMoodTag[] = ['ambient', 'tense', 'calm', 'epic', 'sad', 'mysterious']

interface Props {
  tracks:   AudioTrack[]
  onChange: (tracks: AudioTrack[]) => void
  storyId?: string
}

export function AudioAttacher({ tracks, onChange, storyId }: Props) {
  const [pickerOpen, setPickerOpen] = useState(false)

  const update = (id: string, patch: Partial<AudioTrack>) => {
    onChange(tracks.map(t => (t.id === id ? { ...t, ...patch } : t)))
  }

  const remove = (id: string) => {
    onChange(tracks.filter(t => t.id !== id))
  }

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir
    if (target < 0 || target >= tracks.length) return
    const next = [...tracks]
    const tmp = next[index]
    next[index] = next[target]
    next[target] = tmp
    onChange(next)
  }

  const addFromAsset = (url: string, asset: MediaAsset) => {
    const newTrack: AudioTrack = {
      id:       uuidv4(),
      label:    asset.label,
      url,
      mood_tag: 'ambient',
      duration: 0,
      autoplay: tracks.length === 0,
      loop:     true,
    }
    onChange([...tracks, newTrack])
    setPickerOpen(false)
  }

  return (
    <div>
      <div className="space-y-2 mb-3">
        {tracks.length === 0 && (
          <p className="text-sm text-[#6b6555]">No audio tracks attached to this chapter.</p>
        )}

        {tracks.map((track, i) => (
          <div key={track.id} className="p-3 rounded-lg bg-[#101010] border border-[#1e1e1e] flex items-start gap-3">
            {/* Reorder */}
            <div className="flex flex-col gap-0.5 pt-1 shrink-0">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="text-xs text-[#6b6555] hover:text-[#e0c97f] disabled:opacity-20">▲</button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === tracks.length - 1} className="text-xs text-[#6b6555] hover:text-[#e0c97f] disabled:opacity-20">▼</button>
            </div>

            <div className="flex-1 min-w-0 space-y-2">
              <input
                value={track.label}
                onChange={e => update(track.id, { label: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded bg-[#0a0a0a] border border-[#1e1e1e] text-sm"
                placeholder="Track label"
              />

              <audio src={track.url} controls preload="none" className="w-full h-8" />

              <div className="flex items-center gap-3 flex-wrap text-xs">
                <label className="flex items-center gap-1.5 text-[#a8a090]">
                  Mood
                  <select
                    value={track.mood_tag}
                    onChange={e => update(track.id, { mood_tag: e.target.value as AudioMoodTag })}
                    className="px-2 py-1 rounded bg-[#0a0a0a] border border-[#1e1e1e] capitalize"
                  >
                    {MOOD_TAGS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </label>
                <label className="flex items-center gap-1.5 text-[#a8a090]">
                  <input type="checkbox" checked={track.autoplay} onChange={e => update(track.id, { autoplay: e.target.checked })} />
                  Autoplay on entry
                </label>
                <label className="flex items-center gap-1.5 text-[#a8a090]">
                  <input type="checkbox" checked={track.loop} onChange={e => update(track.id, { loop: e.target.checked })} />
                  Loop
                </label>
              </div>
            </div>

            <button type="button" onClick={() => remove(track.id)} className="text-red-400 hover:text-red-300 text-sm shrink-0" title="Remove track">
              ×
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setPickerOpen(true)}
        className="px-3 py-1.5 rounded-lg border border-[#2a2820] text-sm hover:bg-[#161616] transition-colors"
      >
        + Attach Audio Track
      </button>

      <p className="text-xs text-[#6b6555] mt-2">
        Only the first track marked "Autoplay on entry" will fade in automatically when a reader
        chooses "Enter Story World" with sound.
      </p>

      {pickerOpen && (
        <MediaPickerModal fileType="audio" storyId={storyId} onSelect={addFromAsset} onClose={() => setPickerOpen(false)} />
      )}
    </div>
  )
}
