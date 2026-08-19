import FilterDropdown from './FilterDropdown'

export type FilterOption = {
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
  category: string
  color: string
  size: string
  volume: string
  categoryOptions: FilterOption[]
  onCategoryChange: (value: string) => void
  onColorChange: (value: string) => void
  onSizeChange: (value: string) => void
  onVolumeChange: (value: string) => void
}

export default function FilterBar({
  category,
  color,
  size,
  volume,
  categoryOptions,
  onCategoryChange,
  onColorChange,
  onSizeChange,
  onVolumeChange,
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {categoryOptions.length > 0 && (
        <FilterDropdown label="Категория" options={categoryOptions} value={category} onApply={onCategoryChange} />
      )}
      <FilterDropdown label="Цвет" options={COLOR_OPTIONS} value={color} onApply={onColorChange} />
      <FilterDropdown label="Размер" options={SIZE_OPTIONS} value={size} onApply={onSizeChange} />
      <FilterDropdown label="Объём" options={VOLUME_OPTIONS} value={volume} onApply={onVolumeChange} />
    </div>
  )
}
