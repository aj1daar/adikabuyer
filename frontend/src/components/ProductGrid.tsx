import { motion } from 'framer-motion'
import type { ProductDto } from '../types/catalog'
import ProductCard from './ProductCard'
import { popInView } from '../utils/motion'
import type { MobileColumns } from './MobileColumnsToggle'

type ProductGridProps = {
  products: ProductDto[]
  mobileColumns?: MobileColumns
}

const MOBILE_COLUMN_CLASSES: Record<MobileColumns, string> = {
  1: 'grid-cols-1 gap-6',
  2: 'grid-cols-2 gap-4',
  3: 'grid-cols-3 gap-3',
}

export default function ProductGrid({ products, mobileColumns = 1 }: ProductGridProps) {
  return (
    <div
      key={mobileColumns}
      className={`animate-grid-density-pop grid ${MOBILE_COLUMN_CLASSES[mobileColumns]} sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4`}
    >
      {products.map((product, index) => (
        // pops in as it scrolls into view, staggered — the same bounce as the
        // product-page price sticker, but scroll-triggered so a long catalog
        // doesn't fire 30 animations at once on load
        <motion.div key={product.id} {...popInView(Math.min(index, 11) * 0.035)}>
          <ProductCard product={product} mobileColumns={mobileColumns} />
        </motion.div>
      ))}
    </div>
  )
}
