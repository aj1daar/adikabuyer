import { useEffect, useMemo, useState } from 'react'
import MainLayout from '../layouts/MainLayout'
import ProductGrid from '../components/ProductGrid'
import SearchBar from '../components/SearchBar'
import FilterBar, { type FilterOption } from '../components/FilterBar'
import FilterSheet from '../components/FilterSheet'
import MobileColumnsToggle, { type MobileColumns } from '../components/MobileColumnsToggle'
import useCatalog from '../hooks/useCatalog'
import usePageTitle from '../hooks/usePageTitle'

const MOBILE_COLUMNS_STORAGE_KEY = 'catalog-mobile-columns'

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

  useEffect(() => {
    localStorage.setItem(MOBILE_COLUMNS_STORAGE_KEY, String(mobileColumns))
  }, [mobileColumns])

  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput), 300)
    return () => clearTimeout(timeout)
  }, [searchInput])

  const { products: categoryScopedProducts } = useCatalog({ search, color, size, volumeMin, volumeMax })
  const categoryOptions = useMemo<FilterOption[]>(() => {
    const uniqueCategories = new Set(
      categoryScopedProducts
        .map((product) => product.category)
        .filter((value): value is string => !!value)
    )
    return [...uniqueCategories].sort().map((value) => ({ label: value, value }))
  }, [categoryScopedProducts])

  const { products, loading, error } = useCatalog({ search, category, color, size, volumeMin, volumeMax })

  const handleVolumeChange = (min: string, max: string) => {
    setVolumeMin(min)
    setVolumeMax(max)
  }

  return (
    <MainLayout>
      <div className="flex flex-col gap-6 py-8">
        <SearchBar value={searchInput} onChange={setSearchInput} />

        <div className="flex items-center justify-between gap-3">
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
        </div>

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
      </div>
    </MainLayout>
  )
}
