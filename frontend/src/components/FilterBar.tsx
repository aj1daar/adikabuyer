import FilterDropdown from './FilterDropdown'
import VolumeRangeFilter from './VolumeRangeFilter'
import { ATTRIBUTE_VALUE_OPTIONS } from '../utils/attributeOptions'

export type FilterOption = {
  label: string
  value: string
}

const toFilterOptions = (values: string[]): FilterOption[] => values.map((value) => ({ label: value, value }))

const COLOR_OPTIONS: FilterOption[] = toFilterOptions(ATTRIBUTE_VALUE_OPTIONS.color)
const SIZE_OPTIONS: FilterOption[] = toFilterOptions(ATTRIBUTE_VALUE_OPTIONS.size)

type FilterBarProps = {
  category: string
  color: string
  size: string
  volumeMin: string
  volumeMax: string
  categoryOptions: FilterOption[]
  onCategoryChange: (value: string) => void
  onColorChange: (value: string) => void
  onSizeChange: (value: string) => void
  onVolumeChange: (min: string, max: string) => void
}

export default function FilterBar({
  category,
  color,
  size,
  volumeMin,
  volumeMax,
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
      <VolumeRangeFilter min={volumeMin} max={volumeMax} onApply={onVolumeChange} />
    </div>
  )
}
