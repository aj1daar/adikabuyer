import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useSearchParams } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import { popIn } from '../utils/motion'
import ProductGrid from '../components/ProductGrid'
import ProductGridSkeleton from '../components/ProductGridSkeleton'
import SearchBar from '../components/SearchBar'
import FilterBar from '../components/FilterBar'
import FilterSheet from '../components/FilterSheet'
import MobileColumnsToggle, { type MobileColumns } from '../components/MobileColumnsToggle'
import Pagination from '../components/Pagination'
import useCatalog from '../hooks/useCatalog'
import useCategories from '../hooks/useCategories'
import useIsMobileViewport from '../hooks/useIsMobileViewport'
import usePageTitle from '../hooks/usePageTitle'
import pluralRu from '../utils/pluralRu'

const MOBILE_COLUMNS_STORAGE_KEY = 'catalog-mobile-columns'
// phones page 12 at a time; desktop 24 (six rows of four) instead of pulling the whole
// catalog in one request
const MOBILE_PAGE_SIZE = 12
const DESKTOP_PAGE_SIZE = 24

// URL query keys for the catalog state, so going back from a product (or sharing the
// link) lands on the same search, filters and page
const PARAM = {
  search: 'q',
  category: 'category',
  color: 'color',
  size: 'size',
  volumeMin: 'vmin',
  volumeMax: 'vmax',
  page: 'page',
} as const

function readStoredMobileColumns(): MobileColumns {
  const stored = localStorage.getItem(MOBILE_COLUMNS_STORAGE_KEY)
  return stored === '1' || stored === '2' || stored === '3' ? (Number(stored) as MobileColumns) : 2
}

export default function CatalogPage() {
  usePageTitle('Каталог')
  const [params, setParams] = useSearchParams()
  const search = params.get(PARAM.search) ?? ''
  const category = params.get(PARAM.category) ?? ''
  const color = params.get(PARAM.color) ?? ''
  const size = params.get(PARAM.size) ?? ''
  const volumeMin = params.get(PARAM.volumeMin) ?? ''
  const volumeMax = params.get(PARAM.volumeMax) ?? ''
  // 1-based in the URL (?page=2), 0-based for the API
  const page = Math.max(0, Math.floor(Number(params.get(PARAM.page)) || 1) - 1)
  const [searchInput, setSearchInput] = useState(search)
  const [mobileColumns, setMobileColumns] = useState<MobileColumns>(readStoredMobileColumns)
  const isMobile = useIsMobileViewport()
  const pageSize = isMobile ? MOBILE_PAGE_SIZE : DESKTOP_PAGE_SIZE

  // replace, not push: filter tweaks shouldn't pile up history entries behind the back button
  const updateParams = useCallback((changes: Partial<Record<keyof typeof PARAM, string>>) => {
    setParams(
      (current) => {
        const next = new URLSearchParams(current)
        for (const [key, value] of Object.entries(changes)) {
          const name = PARAM[key as keyof typeof PARAM]
          if (value) {
            next.set(name, value)
          } else {
            next.delete(name)
          }
        }
        // any filter change starts over from the first page
        if (!('page' in changes)) {
          next.delete(PARAM.page)
        }
        return next
      },
      { replace: true },
    )
  }, [setParams])

  useEffect(() => {
    localStorage.setItem(MOBILE_COLUMNS_STORAGE_KEY, String(mobileColumns))
  }, [mobileColumns])

  useEffect(() => {
    if (searchInput === search) {
      return
    }
    const timeout = setTimeout(() => updateParams({ search: searchInput }), 300)
    return () => clearTimeout(timeout)
  }, [searchInput, search, updateParams])

  const categoryOptions = useCategories({ search, color, size, volumeMin, volumeMax })

  const { products, totalCount, loading, error } = useCatalog(
    { search, category, color, size, volumeMin, volumeMax },
    { page, pageSize }
  )

  const handleVolumeChange = (min: string, max: string) => {
    updateParams({ volumeMin: min, volumeMax: max })
  }
  const setCategory = (value: string) => updateParams({ category: value })
  const setColor = (value: string) => updateParams({ color: value })
  const setSize = (value: string) => updateParams({ size: value })

  const isFiltered = Boolean(search || category || color || size || volumeMin || volumeMax)
  const resetAll = () => {
    setSearchInput('')
    updateParams({ search: '', category: '', color: '', size: '', volumeMin: '', volumeMax: '' })
  }

  const handlePageChange = (nextPage: number) => {
    updateParams({ page: nextPage > 0 ? String(nextPage + 1) : '' })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <MainLayout>
      <div className="flex flex-col gap-4 py-4 sm:gap-6 sm:py-8">
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

        {/* while narrowing down: how many matched, and one tap back to everything */}
        {isFiltered && !error && !(loading && products.length === 0) && (
          <div className="-mt-1 flex flex-wrap items-center justify-between gap-2">
            <p className="font-grotesk text-sm font-bold text-ink/60" aria-live="polite">
              Найдено {totalCount} {pluralRu(totalCount, ['товар', 'товара', 'товаров'])}
            </p>
            <button
              type="button"
              onClick={resetAll}
              className="relative font-grotesk text-sm font-bold text-bubblegum-dark underline decoration-dotted underline-offset-4 after:absolute after:-inset-x-2 after:-inset-y-3 after:content-[''] hover:text-ink"
            >
              Сбросить всё
            </button>
          </div>
        )}

        {loading && products.length === 0 && <ProductGridSkeleton mobileColumns={mobileColumns} />}
        {error && <p className="text-red-500">{error}</p>}
        {!loading && !error && products.length === 0 && (
          <p className="text-ink/60">Товары не найдены.</p>
        )}
        {!error && products.length > 0 && (
          <div className={loading ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
            <ProductGrid products={products} mobileColumns={mobileColumns} />
          </div>
        )}

        {!error && (
          <Pagination page={page} pageSize={pageSize} totalCount={totalCount} onPageChange={handlePageChange} />
        )}
      </div>
    </MainLayout>
  )
}
