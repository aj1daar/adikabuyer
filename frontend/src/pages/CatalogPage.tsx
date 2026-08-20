import { useEffect, useMemo, useState } from 'react'
import MainLayout from '../layouts/MainLayout'
import ProductGrid from '../components/ProductGrid'
import SearchBar from '../components/SearchBar'
import FilterBar, { type FilterOption } from '../components/FilterBar'
import useCatalog from '../hooks/useCatalog'
import usePageTitle from '../hooks/usePageTitle'

export default function CatalogPage() {
  usePageTitle('Каталог')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [color, setColor] = useState('')
  const [size, setSize] = useState('')
  const [volumeMin, setVolumeMin] = useState('')
  const [volumeMax, setVolumeMax] = useState('')

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

        {loading && products.length === 0 && <p className="text-ink/60">Загрузка товаров...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {!loading && !error && products.length === 0 && (
          <p className="text-ink/60">Товары не найдены.</p>
        )}
        {!error && products.length > 0 && (
          <div className={loading ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
            <ProductGrid products={products} />
          </div>
        )}
      </div>
    </MainLayout>
  )
}
