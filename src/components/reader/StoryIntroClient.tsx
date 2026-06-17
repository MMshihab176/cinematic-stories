'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import type { Story, Chapter } from '@/types'
import { atmosphereToCSSVars, getAtmosphere } from '@/lib/atmosphere'
import { ParticleLayer } from '@/components/atmosphere/ParticleLayer'
import { useReaderSession } from '@/hooks/useReaderSession'

interface Props {
  story:    Story
  chapters: Chapter[]
}

type Phase = 'intro' | 'reading-list'

export function StoryIntroClient({ story, chapters }: Props) {
  const [phase,      setPhase]      = useState<Phase>('intro')
  const [soundOn,    setSoundOn]    = useState<boolean | null>(null)
  const [prefLoaded, setPrefLoaded] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const atmo = getAtmosphere(story.mood)
  const cssVars = atmosphereToCSSVars(atmo)

  // Establish a reader session early so progress/bookmarks are ready by chapter 1
  useReaderSession()

  // Load saved preference
  useEffect(() => {
    const pref = localStorage.getItem('sound-preference')
    if (pref === 'on')  { setSoundOn(true);  setPrefLoaded(true) }
    if (pref === 'off') { setSoundOn(false); setPrefLoaded(true) }
    setPrefLoaded(true)
  }, [])

  // If user has a saved "off" pref, skip intro
  useEffect(() => {
    if (prefLoaded && soundOn === false) {
      setPhase('reading-list')
    }
  }, [prefLoaded, soundOn])

  const enterWithSound = () => {
    localStorage.setItem('sound-preference', 'on')
    setSoundOn(true)
    setPhase('reading-list')
    // Howler audio is initialized inside AudioPlayer component on the chapter page
  }

  const enterWithoutSound = () => {
    localStorage.setItem('sound-preference', 'off')
    setSoundOn(false)
    setPhase('reading-list')
  }

  return (
    <div style={{ ...cssVars as React.CSSProperties, minHeight: '100vh', background: 'var(--atmo-bg)' }}>
      <AnimatePresence mode="wait">
        {phase === 'intro' ? (
          <motion.div
            key="intro"
            className="intro-screen"
            style={{ background: atmo.bgColor }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Particle atmosphere */}
            <ParticleLayer type={atmo.particles} />

            {/* Cover image blurred bg */}
            {story.cover_image_url && (
              <div className="absolute inset-0 z-0">
                <Image
                  src={story.cover_image_url}
                  alt=""
                  fill
                  className="object-cover opacity-20 blur-sm scale-105"
                  priority
                />
              </div>
            )}

            {/* Gradient overlay */}
            <div className={`absolute inset-0 z-0 ${atmo.overlayClass} pointer-events-none`} />
            <div
              className="absolute inset-0 z-0 pointer-events-none"
              style={{ background: `radial-gradient(ellipse at center, transparent 20%, ${atmo.bgColor} 80%)` }}
            />

            {/* Content */}
            <motion.div
              className="relative z-10 flex flex-col items-center text-center px-8 max-w-2xl"
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              {/* Genre label */}
              <motion.span
                className="text-xs uppercase tracking-[0.3em] mb-6"
                style={{ color: atmo.accentColor, fontFamily: atmo.fontBody }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                {story.genre}
              </motion.span>

              {/* Title */}
              <motion.h1
                className="text-5xl md:text-7xl font-bold mb-6 leading-tight"
                style={{ fontFamily: atmo.fontDisplay, color: atmo.textColor }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.7 }}
              >
                {story.title}
              </motion.h1>

              {/* Synopsis */}
              {story.synopsis && (
                <motion.p
                  className="text-base md:text-lg mb-12 max-w-lg leading-relaxed"
                  style={{ color: atmo.mutedColor, fontFamily: atmo.fontBody }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.9 }}
                >
                  {story.synopsis}
                </motion.p>
              )}

              {/* CTA buttons */}
              <motion.div
                className="flex flex-col items-center gap-4"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1 }}
              >
                <button onClick={enterWithSound} className="intro-cta-btn">
                  ♪ &nbsp; Enter Story World
                </button>
                <button onClick={enterWithoutSound} className="intro-cta-btn secondary">
                  Read Without Sound
                </button>
              </motion.div>
            </motion.div>

            {/* Scroll hint */}
            <motion.p
              className="absolute bottom-8 text-xs tracking-widest"
              style={{ color: atmo.mutedColor }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
            >
              {chapters.length} {chapters.length === 1 ? 'chapter' : 'chapters'}
            </motion.p>
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto px-4 py-16"
          >
            <ParticleLayer type={atmo.particles} />

            <Link
              href="/"
              className="text-xs tracking-widest uppercase mb-12 inline-block hover:opacity-60 transition-opacity"
              style={{ color: atmo.mutedColor }}
            >
              ← All Stories
            </Link>

            <h1
              className="text-4xl md:text-6xl font-bold mb-4"
              style={{ fontFamily: atmo.fontDisplay, color: atmo.accentColor }}
            >
              {story.title}
            </h1>

            {story.synopsis && (
              <p className="text-lg mb-12 max-w-2xl" style={{ color: atmo.mutedColor }}>
                {story.synopsis}
              </p>
            )}

            {/* Chapter list */}
            <div className="space-y-3">
              {chapters.map((ch, i) => (
                <motion.div
                  key={ch.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <Link
                    href={`/read/${story.slug}/${ch.chapter_number}`}
                    className="flex items-center justify-between p-5 rounded-xl border transition-all duration-200 hover:scale-[1.01]"
                    style={{
                      background:  atmo.surfaceColor,
                      borderColor: atmo.borderColor,
                      color:       atmo.textColor,
                    }}
                  >
                    <div>
                      <span
                        className="text-xs uppercase tracking-widest mr-4"
                        style={{ color: atmo.accentColor }}
                      >
                        Ch. {ch.chapter_number}
                      </span>
                      <span style={{ fontFamily: atmo.fontDisplay }}>{ch.title}</span>
                    </div>
                    {ch.word_count > 0 && (
                      <span className="text-xs" style={{ color: atmo.mutedColor }}>
                        {Math.ceil(ch.word_count / 200)} min read
                      </span>
                    )}
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
