import FilterDropdown from './FilterDropdown'
import VolumeRangeFilter from './VolumeRangeFilter'
import { SINGLE_SELECT_FILTERS, type FilterOption } from '../utils/attributeOptions'

export type { FilterOption }

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
  const singleSelectValues: Record<string, string> = { color, size }
  const singleSelectHandlers: Record<string, (value: string) => void> = {
    color: onColorChange,
    size: onSizeChange,
  }

  return (
    <div className="hidden flex-wrap gap-3 sm:flex">
      {categoryOptions.length > 0 && (
        <FilterDropdown label="Категория" options={categoryOptions} value={category} onApply={onCategoryChange} />
      )}
      {SINGLE_SELECT_FILTERS.map(({ key, label, options }) => (
        <FilterDropdown
          key={key}
          label={label}
          options={options}
          value={singleSelectValues[key]}
          onApply={singleSelectHandlers[key]}
        />
      ))}
      <VolumeRangeFilter min={volumeMin} max={volumeMax} onApply={onVolumeChange} />
    </div>
  )
}
