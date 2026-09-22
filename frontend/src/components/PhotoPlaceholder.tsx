type PhotoPlaceholderProps = {
  /** tighter sticker for compact phone cards */
  compact?: boolean
}

/** Neo-Y2K stand-in for a product without a photo: dashed ring and a «фото скоро» sticker. */
export default function PhotoPlaceholder({ compact }: PhotoPlaceholderProps) {
  return (
    <span className="flex h-full w-full items-center justify-center bg-silver" aria-hidden="true">
      <span className="flex aspect-square w-1/2 items-center justify-center rounded-full border-2 border-dashed border-black/25">
        <span
          className={`-rotate-3 whitespace-nowrap rounded-pill border-2 border-black bg-white font-grotesk font-bold uppercase tracking-wide text-ink/70 shadow-[2px_2px_0_0_#000] ${
            compact ? 'px-1.5 py-0.5 text-[8px] sm:px-3 sm:py-1 sm:text-xs' : 'px-3 py-1 text-xs'
          }`}
        >
          фото скоро
        </span>
      </span>
    </span>
  )
}
