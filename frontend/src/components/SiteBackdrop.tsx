import { useReducedMotion } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import DotField, { type FieldDot } from './DotField'

const FADE_MASK = 'radial-gradient(ellipse 85% 85% at 50% 42%, #000 30%, transparent 84%)'

type Shape = { kind: 'ring' | 'square'; className: string }
type Layout = { shapes: Shape[]; dots: FieldDot[] }

/** Same visual language on every storefront page, a different arrangement per route. */
const LAYOUTS: Record<string, Layout> = {
  home: {
    shapes: [
      { kind: 'ring', className: 'right-[-15rem] top-1/2 h-[44rem] w-[44rem] -translate-y-1/2 border-bubblegum/35' },
      { kind: 'ring', className: 'right-[-8rem] top-1/2 h-[27rem] w-[27rem] -translate-y-1/2 border-black/10' },
      { kind: 'square', className: 'bottom-[-5rem] left-[-4rem] h-72 w-72 rotate-12 rounded-3xl border-black/12' },
    ],
    dots: [
      { xPct: 0.09, yPct: 0.16, color: 'pink' },
      { xPct: 0.05, yPct: 0.64, color: 'ink' },
      { xPct: 0.62, yPct: 0.28, color: 'pink' },
      { xPct: 0.78, yPct: 0.85, color: 'white' },
    ],
  },
  catalog: {
    shapes: [
      { kind: 'ring', className: 'left-[-13rem] top-[-11rem] h-[36rem] w-[36rem] border-bubblegum/30' },
      { kind: 'ring', className: 'right-[-11rem] bottom-[-13rem] h-[32rem] w-[32rem] border-black/10' },
      { kind: 'square', className: 'right-[7%] top-[7rem] h-40 w-40 -rotate-6 rounded-2xl border-black/12' },
    ],
    dots: [
      { xPct: 0.18, yPct: 0.88, color: 'white' },
      { xPct: 0.88, yPct: 0.3, color: 'pink' },
      { xPct: 0.4, yPct: 0.12, color: 'ink' },
    ],
  },
  product: {
    shapes: [
      { kind: 'ring', className: 'left-[-17rem] top-[28%] h-[42rem] w-[42rem] border-bubblegum/30' },
      { kind: 'square', className: 'bottom-[-4rem] right-[-3rem] h-64 w-64 rotate-12 rounded-3xl border-black/12' },
      { kind: 'ring', className: 'right-[10%] top-[-8rem] h-[22rem] w-[22rem] border-black/10' },
    ],
    dots: [
      { xPct: 0.1, yPct: 0.82, color: 'pink' },
      { xPct: 0.78, yPct: 0.22, color: 'ink' },
      { xPct: 0.5, yPct: 0.9, color: 'white' },
    ],
  },
  about: {
    shapes: [
      { kind: 'ring', className: 'left-1/2 top-1/2 h-[46rem] w-[46rem] -translate-x-1/2 -translate-y-1/2 border-bubblegum/20' },
      { kind: 'ring', className: 'left-1/2 top-1/2 h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/2 border-black/8' },
    ],
    dots: [
      { xPct: 0.12, yPct: 0.2, color: 'white' },
      { xPct: 0.86, yPct: 0.82, color: 'pink' },
      { xPct: 0.2, yPct: 0.78, color: 'ink' },
    ],
  },
}

function layoutKey(pathname: string): keyof typeof LAYOUTS {
  if (pathname === '/') return 'home'
  if (pathname.startsWith('/catalog/')) return 'product'
  if (pathname.startsWith('/catalog')) return 'catalog'
  if (pathname.startsWith('/about')) return 'about'
  return 'home'
}

export default function SiteBackdrop() {
  const { pathname } = useLocation()
  const reduceMotion = useReducedMotion()
  const { shapes, dots } = LAYOUTS[layoutKey(pathname)]

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(10,10,10,0.055) 1px, transparent 1px), linear-gradient(to bottom, rgba(10,10,10,0.055) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: FADE_MASK,
          WebkitMaskImage: FADE_MASK,
        }}
      />
      {shapes.map((shape, index) => (
        <span
          key={index}
          className={`absolute border-2 ${shape.kind === 'ring' ? 'rounded-full' : ''} ${shape.className}`}
        />
      ))}
      <DotField dots={dots} reduceMotion={reduceMotion} />
    </div>
  )
}
