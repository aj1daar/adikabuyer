import FilterDropdown from './FilterDropdown'
import { ATTRIBUTE_VALUE_OPTIONS } from '../utils/attributeOptions'

export type FilterOption = {
  label: string
  value: string
}

const toFilterOptions = (values: string[]): FilterOption[] => values.map((value) => ({ label: value, value }))

const COLOR_OPTIONS: FilterOption[] = toFilterOptions(ATTRIBUTE_VALUE_OPTIONS.color)
const SIZE_OPTIONS: FilterOption[] = toFilterOptions(ATTRIBUTE_VALUE_OPTIONS.size)
const VOLUME_OPTIONS: FilterOption[] = toFilterOptions(ATTRIBUTE_VALUE_OPTIONS.volume)

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
