import type { MobileColumns } from '../components/MobileColumnsToggle'

/** phone grid density per column choice — shared by the catalog grid and its skeleton */
export const MOBILE_COLUMN_CLASSES: Record<MobileColumns, string> = {
  1: 'grid-cols-1 gap-6',
  2: 'grid-cols-2 gap-4',
  3: 'grid-cols-3 gap-3',
}
