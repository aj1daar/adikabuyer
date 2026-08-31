type ProductLabelsProps = {
  labels?: string[]
  className?: string
  size?: 'card' | 'page'
}

/** Neo-Y2K sticker badges for product quirks — Limited, С принтом, and the like. */
export default function ProductLabels({ labels, className, size = 'card' }: ProductLabelsProps) {
  if (!labels || labels.length === 0) {
    return null
  }

  const sizing =
    size === 'page'
      ? 'px-3 py-1 text-xs shadow-[3px_3px_0_0_#000]'
      : 'px-2 py-0.5 text-[10px] shadow-[2px_2px_0_0_#000]'
  const layout = size === 'page' ? 'flex-row flex-wrap items-center' : 'flex-col items-start'

  return (
    <div className={`pointer-events-none flex gap-1.5 ${layout} ${className ?? ''}`}>
      {labels.map((label, index) => (
        <span
          key={label}
          className={`whitespace-nowrap rounded-pill border-2 border-black font-grotesk font-bold uppercase tracking-wide ${sizing} ${
            index % 2 === 0 ? '-rotate-2' : 'rotate-2'
          } ${index === 0 ? 'bg-ink text-white' : 'bg-bubblegum text-ink'}`}
        >
          {label}
        </span>
      ))}
    </div>
  )
}
