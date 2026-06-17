'use client'

import { useEffect, useRef, useState } from 'react'
import type { Howl as HowlInstance } from 'howler'
import type { AudioTrack, MoodType } from '@/types'
import { getAtmosphere } from '@/lib/atmosphere'

interface Props {
  tracks: AudioTrack[]
  mood:   MoodType
}

export function AudioPlayer({ tracks, mood }: Props) {
  // First track's `autoplay` flag determines whether BGM fades in immediately —
  // ChapterReader only mounts this component when the reader chose "Enter Story
  // World" with sound, so this still respects the browser autoplay-gesture rule.
  const [playing,   setPlaying]   = useState(() => tracks[0]?.autoplay ?? false)
  const [volume,    setVolume]    = useState(0.5)
  const [trackIdx,  setTrackIdx]  = useState(0)
  const [collapsed, setCollapsed] = useState(false)
  const howlRef = useRef<HowlInstance | null>(null)
  const atmo = getAtmosphere(mood)

  const currentTrack = tracks[trackIdx]

  // Load Howler dynamically (avoids SSR issues — Howler touches `window`)
  useEffect(() => {
    if (!currentTrack) return
    let cancelled = false
    let nextHowl: HowlInstance | null = null

    import('howler').then(({ Howl }) => {
      if (cancelled) return

      // Fade out & unload previous track
      const prev = howlRef.current
      if (prev) {
        prev.fade(prev.volume(), 0, 800)
        setTimeout(() => prev.unload(), 900)
      }

      nextHowl = new Howl({
        src:    [currentTrack.url],
        loop:   currentTrack.loop ?? true,
        volume: 0,
        html5:  true,
        onload: () => {
          if (cancelled) return
          if (playing) {
            nextHowl?.play()
            nextHowl?.fade(0, volume, 1200)
          }
        },
      })

      howlRef.current = nextHowl
    })

    return () => {
      cancelled = true
      const h = howlRef.current
      if (h) {
        h.fade(h.volume(), 0, 600)
        setTimeout(() => h.unload(), 700)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack?.url])

  const togglePlay = () => {
    const h = howlRef.current
    if (!h) return
    if (playing) {
      h.fade(volume, 0, 600)
      setTimeout(() => h.pause(), 650)
      setPlaying(false)
    } else {
      h.play()
      h.fade(0, volume, 800)
      setPlaying(true)
    }
  }

  const changeVolume = (v: number) => {
    setVolume(v)
    howlRef.current?.volume(v)
  }

  const nextTrack = () => setTrackIdx(i => (i + 1) % tracks.length)
  const prevTrack = () => setTrackIdx(i => (i - 1 + tracks.length) % tracks.length)

  if (!currentTrack) return null

  return (
    <div
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 audio-player transition-all duration-300"
      style={{
        width: collapsed ? 'auto' : '320px',
        padding: collapsed ? '8px 16px' : '12px 16px',
      }}
    >
      {collapsed ? (
        <button
          onClick={() => setCollapsed(false)}
          className="flex items-center gap-2 text-xs"
          style={{ color: atmo.accentColor }}
        >
          <span>{playing ? '♪' : '♩'}</span>
          <span className="opacity-60">BGM</span>
        </button>
      ) : (
        <div className="flex flex-col gap-2">
          {/* Track label */}
          <div className="flex items-center justify-between">
            <span className="text-xs opacity-60 truncate max-w-[180px]" style={{ color: atmo.textColor }}>
              {currentTrack.label}
            </span>
            <button
              onClick={() => setCollapsed(true)}
              className="text-xs opacity-40 hover:opacity-80 ml-2"
              style={{ color: atmo.textColor }}
            >
              ↓
            </button>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            {tracks.length > 1 && (
              <button onClick={prevTrack} className="text-sm opacity-60 hover:opacity-100" style={{ color: atmo.textColor }}>⏮</button>
            )}
            <button
              onClick={togglePlay}
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all"
              style={{ background: atmo.accentColor, color: atmo.bgColor }}
            >
              {playing ? '⏸' : '▶'}
            </button>
            {tracks.length > 1 && (
              <button onClick={nextTrack} className="text-sm opacity-60 hover:opacity-100" style={{ color: atmo.textColor }}>⏭</button>
            )}
            {/* Volume */}
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={e => changeVolume(parseFloat(e.target.value))}
              className="flex-1 h-1 appearance-none rounded cursor-pointer"
              style={{ accentColor: atmo.accentColor }}
            />
            <span className="text-xs opacity-40" style={{ color: atmo.textColor }}>
              {Math.round(volume * 100)}%
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
