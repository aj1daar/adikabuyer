type FilterOption = {
  label: string
  value: string
}

const COLOR_OPTIONS: FilterOption[] = [
  { label: 'Чёрный', value: 'black' },
  { label: 'Белый', value: 'white' },
  { label: 'Розовый', value: 'pink' },
  { label: 'Серебристый', value: 'silver' },
]

const SIZE_OPTIONS: FilterOption[] = [
  { label: 'S', value: 'S' },
  { label: 'M', value: 'M' },
  { label: 'L', value: 'L' },
]

const VOLUME_OPTIONS: FilterOption[] = [
  { label: '350 мл', value: '350ml' },
  { label: '500 мл', value: '500ml' },
  { label: '750 мл', value: '750ml' },
]

type FilterBarProps = {
  color: string
  size: string
  volume: string
  onColorChange: (value: string) => void
  onSizeChange: (value: string) => void
  onVolumeChange: (value: string) => void
}

type FilterPillRowProps = {
  label: string
  options: FilterOption[]
  selected: string
  onSelect: (value: string) => void
}

function FilterPillRow({ label, options, selected, onSelect }: FilterPillRowProps) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-medium uppercase tracking-wide text-ink/50">{label}</span>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {options.map((option) => {
          const isSelected = selected === option.value
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onSelect(isSelected ? '' : option.value)}
              aria-pressed={isSelected}
              className={`shrink-0 rounded-pill border px-4 py-2 text-sm font-medium transition ${
                isSelected
                  ? 'border-ink bg-ink text-white'
                  : 'border-ink/15 bg-white text-ink hover:border-ink/40'
              }`}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function FilterBar({
  color,
  size,
  volume,
  onColorChange,
  onSizeChange,
  onVolumeChange,
}: FilterBarProps) {
  return (
    <div className="flex flex-col gap-4">
      <FilterPillRow label="Цвет" options={COLOR_OPTIONS} selected={color} onSelect={onColorChange} />
      <FilterPillRow label="Размер" options={SIZE_OPTIONS} selected={size} onSelect={onSizeChange} />
      <FilterPillRow label="Объём" options={VOLUME_OPTIONS} selected={volume} onSelect={onVolumeChange} />
    </div>
  )
}
