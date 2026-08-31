import { useEffect, useRef } from 'react'

export type FieldDot = {
  /** starting position as a fraction of the viewport */
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

const TAU = Math.PI * 2
const FIELD_SCALE = 0.0016 // px⁻¹ — large, soft flow-field features
const FIELD_MORPH = 0.05 // how fast the field itself drifts
const EDGE_MARGIN = 70

function hash3(x: number, y: number, z: number) {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 2246822519)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  h ^= h >>> 16
  return (h >>> 0) / 4294967296
}

const smooth = (t: number) => t * t * (3 - 2 * t)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/** 3D value noise → smooth, non-repeating field used to steer the dots */
function noise3(x: number, y: number, z: number) {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const zi = Math.floor(z)
  const u = smooth(x - xi)
  const v = smooth(y - yi)
  const w = smooth(z - zi)
  return lerp(
    lerp(
      lerp(hash3(xi, yi, zi), hash3(xi + 1, yi, zi), u),
      lerp(hash3(xi, yi + 1, zi), hash3(xi + 1, yi + 1, zi), u),
      v
    ),
    lerp(
      lerp(hash3(xi, yi, zi + 1), hash3(xi + 1, yi, zi + 1), u),
      lerp(hash3(xi, yi + 1, zi + 1), hash3(xi + 1, yi + 1, zi + 1), u),
      v
    ),
    w
  )
}

function seeded(seed: number) {
  let t = seed + 0x6d2b79f5
  return () => {
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Backdrop dots roaming the whole viewport on a flow field: each drifts along
 * smooth, non-repeating curves at its own speed, curls away from the edges, and
 * leaves a short fading trail. No two move alike; nothing pauses.
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

    const agents = dots.map((dot, index) => {
      const rand = seeded(index * 131 + 7)
      return {
        x: dot.xPct * width,
        y: dot.yPct * height,
        vx: (rand() - 0.5) * 20,
        vy: (rand() - 0.5) * 20,
        speed: 24 + rand() * 30,
        turn: 1 + rand() * 1.8,
        fieldZ: rand() * 500,
        wind: 1.5 + rand() * 2.5, // how many full turns the field angle spans
        jitter: 0.15 + rand() * 0.35,
        radius: 3.1 + rand() * 1.9,
        trailLength: 16 + Math.floor(rand() * 12),
        trail: [] as { x: number; y: number }[],
        rand,
      }
    })

    const paintDot = (dot: FieldDot, x: number, y: number, radius: number, alpha: number) => {
      const p = PAINT[dot.color]
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, TAU)
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
        paintDot(dot, dot.xPct * width, dot.yPct * height, agents[index].radius, 0.9)
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
        const a = agents[index]

        const flow =
          noise3(a.x * FIELD_SCALE, a.y * FIELD_SCALE, time * FIELD_MORPH + a.fieldZ) * TAU * a.wind
        const jitter = (a.rand() - 0.5) * a.jitter
        const angle = flow + jitter

        let desiredX = Math.cos(angle) * a.speed
        let desiredY = Math.sin(angle) * a.speed

        // curl inward near the edges instead of leaving the page
        if (a.x < EDGE_MARGIN) desiredX += (EDGE_MARGIN - a.x) * 0.9
        else if (a.x > width - EDGE_MARGIN) desiredX -= (a.x - (width - EDGE_MARGIN)) * 0.9
        if (a.y < EDGE_MARGIN) desiredY += (EDGE_MARGIN - a.y) * 0.9
        else if (a.y > height - EDGE_MARGIN) desiredY -= (a.y - (height - EDGE_MARGIN)) * 0.9

        const steer = Math.min(1, a.turn * dt)
        a.vx += (desiredX - a.vx) * steer
        a.vy += (desiredY - a.vy) * steer

        a.x += a.vx * dt
        a.y += a.vy * dt
        a.x = Math.max(4, Math.min(width - 4, a.x))
        a.y = Math.max(4, Math.min(height - 4, a.y))

        a.trail.push({ x: a.x, y: a.y })
        if (a.trail.length > a.trailLength) {
          a.trail.shift()
        }
        a.trail.forEach((point, trailIndex) => {
          const k = trailIndex / a.trailLength
          paintDot(dot, point.x, point.y, a.radius * (0.3 + k * 0.7), k * k * 0.5)
        })
        paintDot(dot, a.x, a.y, a.radius, 0.9)
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
