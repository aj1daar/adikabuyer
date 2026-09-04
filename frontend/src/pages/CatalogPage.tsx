import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import MainLayout from '../layouts/MainLayout'
import { popIn } from '../utils/motion'
import ProductGrid from '../components/ProductGrid'
import SearchBar from '../components/SearchBar'
import FilterBar from '../components/FilterBar'
import FilterSheet from '../components/FilterSheet'
import MobileColumnsToggle, { type MobileColumns } from '../components/MobileColumnsToggle'
import Pagination from '../components/Pagination'
import useCatalog from '../hooks/useCatalog'
import useCategories from '../hooks/useCategories'
import useIsMobileViewport from '../hooks/useIsMobileViewport'
import usePageTitle from '../hooks/usePageTitle'

const MOBILE_COLUMNS_STORAGE_KEY = 'catalog-mobile-columns'
const PAGE_SIZE = 12
const UNPAGINATED_SIZE = 1000

function readStoredMobileColumns(): MobileColumns {
  const stored = localStorage.getItem(MOBILE_COLUMNS_STORAGE_KEY)
  return stored === '1' || stored === '2' || stored === '3' ? (Number(stored) as MobileColumns) : 2
}

export default function CatalogPage() {
  usePageTitle('Каталог')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [color, setColor] = useState('')
  const [size, setSize] = useState('')
  const [volumeMin, setVolumeMin] = useState('')
  const [volumeMax, setVolumeMax] = useState('')
  const [mobileColumns, setMobileColumns] = useState<MobileColumns>(readStoredMobileColumns)
  const [page, setPage] = useState(0)
  const isMobile = useIsMobileViewport()

  useEffect(() => {
    localStorage.setItem(MOBILE_COLUMNS_STORAGE_KEY, String(mobileColumns))
  }, [mobileColumns])

  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput), 300)
    return () => clearTimeout(timeout)
  }, [searchInput])

  useEffect(() => {
    setPage(0)
  }, [search, category, color, size, volumeMin, volumeMax])

  const categoryOptions = useCategories({ search, color, size, volumeMin, volumeMax })

  const { products, totalCount, loading, error } = useCatalog(
    { search, category, color, size, volumeMin, volumeMax },
    isMobile ? { page, pageSize: PAGE_SIZE } : { page: 0, pageSize: UNPAGINATED_SIZE }
  )

  const handleVolumeChange = (min: string, max: string) => {
    setVolumeMin(min)
    setVolumeMax(max)
  }

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <MainLayout>
      <div className="flex flex-col gap-6 py-8">
        <motion.div {...popIn(0)}>
          <SearchBar value={searchInput} onChange={setSearchInput} />
        </motion.div>

        <motion.div {...popIn(0.06)} className="flex items-center justify-between gap-3">
          <FilterBar
            category={category}
            color={color}
            size={size}
            volumeMin={volumeMin}
            volumeMax={volumeMax}
            categoryOptions={categoryOptions}
            onCategoryChange={setCategory}
            onColorChange={setColor}
            onSizeChange={setSize}
            onVolumeChange={handleVolumeChange}
          />
          <FilterSheet
            category={category}
            color={color}
            size={size}
            volumeMin={volumeMin}
            volumeMax={volumeMax}
            categoryOptions={categoryOptions}
            onCategoryChange={setCategory}
            onColorChange={setColor}
            onSizeChange={setSize}
            onVolumeChange={handleVolumeChange}
          />
          <MobileColumnsToggle value={mobileColumns} onChange={setMobileColumns} />
        </motion.div>

        {loading && products.length === 0 && <p className="text-ink/60">Загрузка товаров...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {!loading && !error && products.length === 0 && (
          <p className="text-ink/60">Товары не найдены.</p>
        )}
        {!error && products.length > 0 && (
          <div className={loading ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
            <ProductGrid products={products} mobileColumns={mobileColumns} />
          </div>
        )}

        {isMobile && !error && (
          <Pagination page={page} pageSize={PAGE_SIZE} totalCount={totalCount} onPageChange={handlePageChange} />
        )}
      </div>
    </MainLayout>
  )
}
