export type MobileColumns = 1 | 2 | 3

type MobileColumnsToggleProps = {
  value: MobileColumns
  onChange: (value: MobileColumns) => void
}

const OPTIONS: MobileColumns[] = [1, 2, 3]

export default function MobileColumnsToggle({ value, onChange }: MobileColumnsToggleProps) {
  return (
    <div
      role="group"
      aria-label="Товаров в ряд"
      className="flex w-fit overflow-hidden rounded-pill border-2 border-black sm:hidden"
    >
      {OPTIONS.map((option, index) => (
        <button
          key={option}
          type="button"
          aria-pressed={value === option}
          onClick={() => onChange(option)}
          className={`flex h-11 w-11 items-center justify-center font-grotesk text-sm font-bold transition active:scale-100 active:brightness-75 active:shadow-[inset_0_4px_8px_rgba(0,0,0,0.55)] ${
            index > 0 ? 'border-l-2 border-black' : ''
          } ${value === option ? 'bg-bubblegum text-ink' : 'bg-white text-ink/50 hover:bg-silver'}`}
        >
          {option}
        </button>
      ))}
    </div>
  )
}
