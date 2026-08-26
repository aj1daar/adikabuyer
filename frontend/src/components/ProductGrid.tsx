import type { ProductDto } from '../types/catalog'
import ProductCard from './ProductCard'
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
      className={`grid ${MOBILE_COLUMN_CLASSES[mobileColumns]} sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4`}
    >
      {products.map((product) => (
        <ProductCard key={product.id} product={product} mobileColumns={mobileColumns} />
      ))}
    </div>
  )
}
