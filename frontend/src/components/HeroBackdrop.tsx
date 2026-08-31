const FADE_MASK = 'radial-gradient(ellipse 80% 80% at 50% 45%, #000 35%, transparent 82%)'

/** Neo-Y2K backdrop for the landing hero: graph-paper grid plus a few hard-edged outline shapes. */
export default function HeroBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(10,10,10,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(10,10,10,0.06) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: FADE_MASK,
          WebkitMaskImage: FADE_MASK,
        }}
      />

      {/* big bubblegum ring bleeding off the right edge */}
      <div className="absolute -right-40 top-1/2 h-[42rem] w-[42rem] -translate-y-1/2 rounded-full border-2 border-bubblegum/40" />
      {/* second, tighter ring */}
      <div className="absolute -right-24 top-1/2 h-[28rem] w-[28rem] -translate-y-1/2 rounded-full border-2 border-dashed border-black/10" />
      {/* rotated square, lower-left */}
      <div className="absolute -bottom-20 -left-16 h-72 w-72 rotate-12 rounded-3xl border-2 border-black/10" />

      {/* stray dots */}
      <span className="absolute left-[10%] top-[16%] h-3 w-3 rounded-full border-2 border-black bg-bubblegum" />
      <span className="absolute left-[6%] top-[62%] h-2.5 w-2.5 rounded-full bg-black/20" />
      <span className="absolute right-[16%] bottom-[14%] h-3.5 w-3.5 rounded-full border-2 border-black bg-white" />
    </div>
  )
}
