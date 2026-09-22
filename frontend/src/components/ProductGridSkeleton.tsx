import { MOBILE_COLUMN_CLASSES } from '../utils/gridColumns'
import type { MobileColumns } from './MobileColumnsToggle'

type ProductGridSkeletonProps = {
  mobileColumns?: MobileColumns
  count?: number
}

/**
 * First-load placeholder in the exact shape of the grid (photo block, name and price bars,
 * button pill), so products slot in without the page jumping. Pulses only when motion is OK.
 */
export default function ProductGridSkeleton({ mobileColumns = 1, count = 8 }: ProductGridSkeletonProps) {
  return (
    <div
      role="status"
      aria-label="Загрузка товаров..."
      className={`grid ${MOBILE_COLUMN_CLASSES[mobileColumns]} sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4`}
    >
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          aria-hidden="true"
          className="flex flex-col overflow-hidden rounded-3xl border-2 border-black/15 bg-white shadow-[6px_6px_0_0_rgba(0,0,0,0.08)] motion-safe:animate-pulse"
        >
          <div className="aspect-[4/5] bg-silver" />
          <div className={`flex flex-col gap-2 p-5 ${mobileColumns >= 2 ? 'max-sm:p-3' : ''}`}>
            <div className="h-4 w-3/4 rounded-full bg-silver" />
            <div className="h-4 w-1/2 rounded-full bg-silver" />
            <div className="mt-3 h-9 rounded-pill bg-silver" />
          </div>
        </div>
      ))}
    </div>
  )
}
