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
          className={`flex h-10 w-10 items-center justify-center font-grotesk text-sm font-bold transition ${
            index > 0 ? 'border-l-2 border-black' : ''
          } ${value === option ? 'bg-bubblegum text-ink' : 'bg-white text-ink/50'}`}
        >
          {option}
        </button>
      ))}
    </div>
  )
}
