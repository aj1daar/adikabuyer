type FilterActionsProps = {
  onReset: () => void
  onApply: () => void
  applyLabel?: string
}

/** Shared Сбросить / Сохранить footer for the desktop filter dropdowns. The apply
 *  button fills the row so its (wide Unbounded) label never gets clipped. */
export default function FilterActions({ onReset, onApply, applyLabel = 'Сохранить' }: FilterActionsProps) {
  return (
    <div className="flex items-center gap-2 border-t-2 border-black p-3">
      <button
        type="button"
        onClick={onReset}
        className="shrink-0 whitespace-nowrap rounded-pill px-3 py-2 font-grotesk text-sm font-bold text-ink/50 transition hover:text-ink"
      >
        Сбросить
      </button>
      <button
        type="button"
        onClick={onApply}
        className="flex-1 whitespace-nowrap rounded-pill border-2 border-black bg-ink px-4 py-2 text-center font-grotesk text-sm font-bold text-white transition hover:bg-bubblegum-dark"
      >
        {applyLabel}
      </button>
    </div>
  )
}
