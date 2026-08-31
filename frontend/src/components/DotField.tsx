import { useEffect, useRef } from 'react'

export type FieldDot = {
  /** home position as a fraction of the viewport */
  xPct: number
  yPct: number
  color: 'pink' | 'ink' | 'white'
}

type DotFieldProps = {
  dots: FieldDot[]
  reduceMotion?: boolean | null
}

const PAINT: Record<FieldDot['color'], { r: number; g: number; b: number; stroke: string }> = {
  pink: { r: 232, g: 121, b: 159, stroke: '' },
  ink: { r: 10, g: 10, b: 10, stroke: '' },
  white: { r: 255, g: 255, b: 255, stroke: 'rgba(10,10,10,0.5)' },
}

const TRAIL_LENGTH = 16

/** deterministic per-dot randomness so no two dots move alike */
function seeded(seed: number) {
  let t = seed + 0x6d2b79f5
  return () => {
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * The backdrop dots on a full-viewport canvas: each drifts gently, then now and
 * again loops one or two circles, leaving a short fading trail. Every dot gets
 * its own radius, speed, direction and timing.
 */
export default function DotField({ dots, reduceMotion }: DotFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) {
      return
    }

    let width = 0
    let height = 0
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const state = dots.map((_, index) => {
      const rand = seeded(index * 131 + 7)
      return {
        driftAmpX: 2 + rand() * 4,
        driftAmpY: 2 + rand() * 4,
        driftSpeedX: 0.12 + rand() * 0.22,
        driftSpeedY: 0.1 + rand() * 0.2,
        driftPhaseX: rand() * Math.PI * 2,
        driftPhaseY: rand() * Math.PI * 2,
        radius: 3.2 + rand() * 1.8,
        loopRadius: 24 + rand() * 44,
        loopDuration: 2.2 + rand() * 2.4,
        loops: rand() < 0.35 ? 2 : 1,
        direction: rand() < 0.5 ? 1 : -1,
        looping: false,
        loopT: 0,
        cooldown: 1.5 + rand() * 4,
        trail: [] as { x: number; y: number }[],
      }
    })

    const paintDot = (dot: FieldDot, x: number, y: number, radius: number, alpha: number) => {
      const p = PAINT[dot.color]
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},${alpha})`
      ctx.fill()
      if (p.stroke && alpha > 0.5) {
        ctx.lineWidth = 1.3
        ctx.strokeStyle = p.stroke
        ctx.stroke()
      }
    }

    if (reduceMotion) {
      dots.forEach((dot, index) => {
        paintDot(dot, dot.xPct * width, dot.yPct * height, state[index].radius, 0.9)
      })
      return () => window.removeEventListener('resize', resize)
    }

    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      const time = now / 1000

      ctx.clearRect(0, 0, width, height)

      dots.forEach((dot, index) => {
        const s = state[index]
        const baseX = dot.xPct * width
        const baseY = dot.yPct * height

        const wobbleX = Math.sin(time * s.driftSpeedX + s.driftPhaseX) * s.driftAmpX
        const wobbleY = Math.cos(time * s.driftSpeedY + s.driftPhaseY) * s.driftAmpY

        let loopX = 0
        let loopY = 0
        if (s.looping) {
          s.loopT += dt
          const progress = s.loopT / s.loopDuration
          if (progress >= 1) {
            s.looping = false
            s.cooldown = 3 + Math.random() * 7
          } else {
            const angle = s.direction * progress * Math.PI * 2 * s.loops
            const envelope = Math.sin(Math.PI * progress) // 0 → 1 → 0, so it returns home
            loopX = Math.cos(angle) * s.loopRadius * envelope
            loopY = Math.sin(angle) * s.loopRadius * envelope
          }
        } else {
          s.cooldown -= dt
          if (s.cooldown <= 0) {
            s.looping = true
            s.loopT = 0
          }
        }

        const x = baseX + wobbleX + loopX
        const y = baseY + wobbleY + loopY

        s.trail.push({ x, y })
        if (s.trail.length > TRAIL_LENGTH) {
          s.trail.shift()
        }

        s.trail.forEach((point, trailIndex) => {
          const k = trailIndex / TRAIL_LENGTH
          paintDot(dot, point.x, point.y, s.radius * (0.35 + k * 0.65), k * k * 0.55)
        })
        paintDot(dot, x, y, s.radius, 0.9)
      })

      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [dots, reduceMotion])

  return <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0" />
}
