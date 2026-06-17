'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import type { Story, Chapter } from '@/types'
import { atmosphereToCSSVars, getAtmosphere } from '@/lib/atmosphere'
import { ParticleLayer } from '@/components/atmosphere/ParticleLayer'
import { AudioPlayer } from '@/components/audio/AudioPlayer'
import { ChatbotWidget } from '@/components/reader/ChatbotWidget'
import { TipTapRenderer } from '@/components/reader/TipTapRenderer'
import { useReaderSession } from '@/hooks/useReaderSession'

interface Props {
  story:   Story
  chapter: Chapter
  prev:    { chapter_number: number; title: string } | null
  next:    { chapter_number: number; title: string } | null
}

export function ChapterReader({ story, chapter, prev, next }: Props) {
  const atmo    = getAtmosphere(story.mood)
  const cssVars = atmosphereToCSSVars(atmo)
  const [fontSize,      setFontSize]      = useState(18)
  const [showControls,  setShowControls]  = useState(true)
  const [chatOpen,      setChatOpen]      = useState(false)
  const [isBookmarked,  setIsBookmarked]  = useState(false)
  const [soundEnabled]  = useState(() => localStorage.getItem('sound-preference') !== 'off')
  const contentRef = useRef<HTMLDivElement>(null)
  const scrollTimer = useRef<NodeJS.Timeout>()

  // Ensure a (possibly anonymous) Supabase session exists so progress/bookmarks persist
  useReaderSession()

  // Apply atmosphere CSS vars to document root
  useEffect(() => {
    const root = document.documentElement
    Object.entries(cssVars).forEach(([k, v]) => root.style.setProperty(k, v))
    return () => {
      // Restore defaults on unmount
      root.style.removeProperty('--atmo-bg')
      root.style.removeProperty('--atmo-accent')
    }
  }, [story.mood])

  // Save reading progress on scroll
  useEffect(() => {
    const onScroll = () => {
      clearTimeout(scrollTimer.current)
      scrollTimer.current = setTimeout(() => {
        const pos = Math.round((window.scrollY / document.body.scrollHeight) * 100)
        fetch('/api/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chapter_id: chapter.id, story_id: story.id, scroll_position: pos }),
        }).catch(() => {})
      }, 1000)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { window.removeEventListener('scroll', onScroll); clearTimeout(scrollTimer.current) }
  }, [chapter.id, story.id])

  // Load bookmark state — localStorage first (instant), then reconcile with server
  useEffect(() => {
    const bookmarks: string[] = JSON.parse(localStorage.getItem('bookmarks') ?? '[]')
    setIsBookmarked(bookmarks.includes(story.id))

    fetch('/api/bookmarks')
      .then(r => r.json())
      .then((data: { bookmarks: { story_id: string }[] }) => {
        const serverHas = data.bookmarks?.some(b => b.story_id === story.id)
        if (serverHas) setIsBookmarked(true)
      })
      .catch(() => {})
  }, [story.id])

  const toggleBookmark = useCallback(() => {
    const bookmarks: string[] = JSON.parse(localStorage.getItem('bookmarks') ?? '[]')
    const next = !isBookmarked

    if (next) {
      bookmarks.push(story.id)
    } else {
      const idx = bookmarks.indexOf(story.id)
      if (idx !== -1) bookmarks.splice(idx, 1)
    }
    localStorage.setItem('bookmarks', JSON.stringify(bookmarks))
    setIsBookmarked(next)

    fetch('/api/bookmarks', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ story_id: story.id, action: next ? 'add' : 'remove' }),
    }).catch(() => {})
  }, [isBookmarked, story.id])

  // Hide controls on scroll down, show on scroll up
  useEffect(() => {
    let last = 0
    const onScroll = () => {
      const cur = window.scrollY
      setShowControls(cur < last || cur < 100)
      last = cur
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div
      style={{ ...cssVars as React.CSSProperties, minHeight: '100vh', background: 'var(--atmo-bg)' }}
    >
      <ParticleLayer type={atmo.particles} />

      {/* Top nav bar */}
      <motion.header
        className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-4 py-3"
        style={{
          background:   `${atmo.bgColor}cc`,
          borderBottom: `1px solid ${atmo.borderColor}`,
          backdropFilter: 'blur(12px)',
        }}
        animate={{ y: showControls ? 0 : -70 }}
        transition={{ duration: 0.3 }}
      >
        <Link
          href={`/story/${story.slug}`}
          className="text-xs uppercase tracking-widest hover:opacity-60 transition-opacity"
          style={{ color: atmo.mutedColor }}
        >
          ← {story.title}
        </Link>

        <span
          className="text-sm font-semibold"
          style={{ fontFamily: atmo.fontDisplay, color: atmo.accentColor }}
        >
          Ch. {chapter.chapter_number} — {chapter.title}
        </span>

        <div className="flex items-center gap-3">
          {/* Font size */}
          <button
            onClick={() => setFontSize(s => Math.max(14, s - 1))}
            className="text-xs px-2 py-1 rounded opacity-60 hover:opacity-100 transition-opacity"
            style={{ color: atmo.textColor, border: `1px solid ${atmo.borderColor}` }}
          >A-</button>
          <button
            onClick={() => setFontSize(s => Math.min(24, s + 1))}
            className="text-xs px-2 py-1 rounded opacity-60 hover:opacity-100 transition-opacity"
            style={{ color: atmo.textColor, border: `1px solid ${atmo.borderColor}` }}
          >A+</button>
          {/* Bookmark */}
          <button
            onClick={toggleBookmark}
            className="text-lg transition-all"
            style={{ color: isBookmarked ? atmo.accentColor : atmo.mutedColor }}
            title={isBookmarked ? 'Remove bookmark' : 'Bookmark story'}
          >
            {isBookmarked ? '★' : '☆'}
          </button>
          {/* AI chat */}
          <button
            onClick={() => setChatOpen(o => !o)}
            className="text-sm px-3 py-1 rounded transition-all"
            style={{
              background:  chatOpen ? atmo.accentColor : 'transparent',
              color:       chatOpen ? atmo.bgColor     : atmo.accentColor,
              border:      `1px solid ${atmo.accentColor}`,
            }}
          >
            AI ✦
          </button>
        </div>
      </motion.header>

      {/* Audio player */}
      {soundEnabled && chapter.audio_tracks.length > 0 && (
        <AudioPlayer tracks={chapter.audio_tracks} mood={story.mood} />
      )}

      {/* Main content */}
      <main className="relative z-10 pt-20 pb-32 px-4">
        <div ref={contentRef} className="max-w-3xl mx-auto">
          {/* Chapter header */}
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <p
              className="text-xs uppercase tracking-[0.3em] mb-4"
              style={{ color: atmo.accentColor }}
            >
              Chapter {chapter.chapter_number}
            </p>
            <h1
              className="text-4xl md:text-5xl font-bold mb-6"
              style={{ fontFamily: atmo.fontDisplay, color: atmo.textColor }}
            >
              {chapter.title}
            </h1>
            <div
              className="h-px w-24 mx-auto"
              style={{ background: atmo.accentColor }}
            />
          </motion.div>

          {/* Story content */}
          <motion.div
            className="story-content"
            style={{ fontSize: `${fontSize}px` }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            <TipTapRenderer content={chapter.content} />
          </motion.div>

          {/* Chapter navigation */}
          <div className="flex justify-between items-center mt-24 pt-8" style={{ borderTop: `1px solid ${atmo.borderColor}` }}>
            {prev ? (
              <Link
                href={`/read/${story.slug}/${prev.chapter_number}`}
                className="flex flex-col items-start group"
              >
                <span className="text-xs uppercase tracking-widest mb-1 opacity-50 group-hover:opacity-100 transition-opacity" style={{ color: atmo.accentColor }}>← Previous</span>
                <span className="text-sm group-hover:opacity-70 transition-opacity" style={{ color: atmo.textColor }}>Ch. {prev.chapter_number}: {prev.title}</span>
              </Link>
            ) : <div />}

            {next ? (
              <Link
                href={`/read/${story.slug}/${next.chapter_number}`}
                className="flex flex-col items-end group"
              >
                <span className="text-xs uppercase tracking-widest mb-1 opacity-50 group-hover:opacity-100 transition-opacity" style={{ color: atmo.accentColor }}>Next →</span>
                <span className="text-sm group-hover:opacity-70 transition-opacity" style={{ color: atmo.textColor }}>Ch. {next.chapter_number}: {next.title}</span>
              </Link>
            ) : (
              <div className="text-center w-full">
                <p className="text-sm opacity-60" style={{ color: atmo.mutedColor }}>✦ End of available chapters ✦</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* AI Chatbot */}
      {chatOpen && (
        <ChatbotWidget
          storyId={story.id}
          storyTitle={story.title}
          atmosphere={atmo}
          onClose={() => setChatOpen(false)}
        />
      )}
    </div>
  )
}
