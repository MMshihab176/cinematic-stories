'use client'

import { useEffect, useRef } from 'react'
import type { AtmosphereConfig } from '@/types'

interface Props {
  type: AtmosphereConfig['particles']
}

export function ParticleLayer({ type }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (type === 'none') return
    const canvasEl = canvasRef.current
    if (!canvasEl) return
    const canvas: HTMLCanvasElement = canvasEl
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationId: number
    let particles: Particle[] = []

    const resize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    class Particle {
      x:     number
      y:     number
      size:  number
      speedX:number
      speedY:number
      opacity:number
      color: string

      constructor() {
        this.x       = Math.random() * canvas.width
        this.y       = Math.random() * canvas.height
        this.size    = Math.random() * 4 + 1
        this.speedX  = (Math.random() - 0.5) * 0.5
        this.speedY  = type === 'petals' ? Math.random() * 0.8 + 0.2 : -Math.random() * 0.8 - 0.2
        this.opacity = Math.random() * 0.5 + 0.1
        this.color   = this.getColor()
      }

      getColor(): string {
        switch(type) {
          case 'fog':       return 'rgba(139,0,0,'
          case 'petals':    return 'rgba(201,125,138,'
          case 'sparkles':  return 'rgba(200,180,255,'
          case 'embers':    return 'rgba(255,120,20,'
          case 'rain':      return 'rgba(100,140,200,'
          default:          return 'rgba(200,200,200,'
        }
      }

      update() {
        this.x += this.speedX
        this.y += this.speedY
        this.opacity -= 0.001

        if (this.y < 0 && type !== 'petals') { this.y = canvas.height; this.opacity = Math.random() * 0.5 }
        if (this.y > canvas.height)         { this.y = 0;              this.opacity = Math.random() * 0.5 }
        if (this.x < 0)  this.x = canvas.width
        if (this.x > canvas.width) this.x = 0
        if (this.opacity <= 0) { this.opacity = Math.random() * 0.5 + 0.1 }
      }

      draw() {
        if (!ctx) return
        if (type === 'rain') {
          ctx.strokeStyle = `${this.color}${this.opacity})`
          ctx.lineWidth = 0.5
          ctx.beginPath()
          ctx.moveTo(this.x, this.y)
          ctx.lineTo(this.x + 1, this.y + 10)
          ctx.stroke()
        } else if (type === 'sparkles') {
          ctx.fillStyle = `${this.color}${this.opacity})`
          ctx.beginPath()
          ctx.arc(this.x, this.y, this.size * 0.5, 0, Math.PI * 2)
          ctx.fill()
        } else {
          ctx.fillStyle = `${this.color}${this.opacity})`
          ctx.beginPath()
          if (type === 'petals') {
            ctx.ellipse(this.x, this.y, this.size, this.size * 2, Math.random() * Math.PI, 0, Math.PI * 2)
          } else {
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
          }
          ctx.fill()
        }
      }
    }

    // Init particles
    const count = type === 'sparkles' ? 80 : type === 'rain' ? 150 : 50
    for (let i = 0; i < count; i++) {
      particles.push(new Particle())
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach(p => { p.update(); p.draw() })
      animationId = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', resize)
    }
  }, [type])

  if (type === 'none') return null

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.6 }}
    />
  )
}
