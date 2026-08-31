import { useLocation } from 'react-router-dom'

const FADE_MASK = 'radial-gradient(ellipse 85% 85% at 50% 42%, #000 30%, transparent 84%)'

type Shape = { kind: 'ring' | 'square' | 'dot'; className: string }

/** Same visual language on every storefront page, a different arrangement per route. */
const LAYOUTS: Record<string, Shape[]> = {
  home: [
    { kind: 'ring', className: 'right-[-15rem] top-1/2 h-[44rem] w-[44rem] -translate-y-1/2 border-bubblegum/35' },
    { kind: 'ring', className: 'right-[-8rem] top-1/2 h-[27rem] w-[27rem] -translate-y-1/2 border-black/10' },
    { kind: 'square', className: 'bottom-[-5rem] left-[-4rem] h-72 w-72 rotate-12 rounded-3xl border-black/12' },
    { kind: 'dot', className: 'left-[9%] top-[16%] h-3 w-3 border-2 border-black bg-bubblegum' },
    { kind: 'dot', className: 'left-[5%] top-[64%] h-2.5 w-2.5 bg-black/20' },
    { kind: 'dot', className: 'right-[24%] bottom-[15%] h-3.5 w-3.5 border-2 border-black bg-white' },
  ],
  catalog: [
    { kind: 'ring', className: 'left-[-13rem] top-[-11rem] h-[36rem] w-[36rem] border-bubblegum/30' },
    { kind: 'ring', className: 'right-[-11rem] bottom-[-13rem] h-[32rem] w-[32rem] border-black/10' },
    { kind: 'square', className: 'right-[7%] top-[7rem] h-40 w-40 -rotate-6 rounded-2xl border-black/12' },
    { kind: 'dot', className: 'left-[18%] bottom-[12%] h-3 w-3 border-2 border-black bg-white' },
    { kind: 'dot', className: 'right-[12%] top-[30%] h-2.5 w-2.5 bg-bubblegum/50' },
  ],
  product: [
    { kind: 'ring', className: 'left-[-17rem] top-[28%] h-[42rem] w-[42rem] border-bubblegum/30' },
    { kind: 'square', className: 'bottom-[-4rem] right-[-3rem] h-64 w-64 rotate-12 rounded-3xl border-black/12' },
    { kind: 'ring', className: 'right-[10%] top-[-8rem] h-[22rem] w-[22rem] border-black/10' },
    { kind: 'dot', className: 'left-[10%] bottom-[18%] h-3 w-3 border-2 border-black bg-bubblegum' },
    { kind: 'dot', className: 'right-[22%] top-[22%] h-2.5 w-2.5 bg-black/20' },
  ],
  about: [
    { kind: 'ring', className: 'left-1/2 top-1/2 h-[46rem] w-[46rem] -translate-x-1/2 -translate-y-1/2 border-bubblegum/20' },
    { kind: 'ring', className: 'left-1/2 top-1/2 h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/2 border-black/8' },
    { kind: 'dot', className: 'left-[12%] top-[20%] h-3 w-3 border-2 border-black bg-white' },
    { kind: 'dot', className: 'right-[14%] bottom-[18%] h-3 w-3 border-2 border-black bg-bubblegum' },
  ],
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
  const shapes = LAYOUTS[layoutKey(pathname)]

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
          className={`absolute ${
            shape.kind === 'ring'
              ? 'rounded-full border-2'
              : shape.kind === 'square'
                ? 'border-2'
                : 'rounded-full'
          } ${shape.className}`}
        />
      ))}
    </div>
  )
}
