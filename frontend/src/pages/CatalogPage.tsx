import { useEffect, useState } from 'react'
import MainLayout from '../layouts/MainLayout'
import ProductGrid from '../components/ProductGrid'
import SearchBar from '../components/SearchBar'
import FilterBar from '../components/FilterBar'
import useCatalog from '../hooks/useCatalog'
import usePageTitle from '../hooks/usePageTitle'

export default function CatalogPage() {
  usePageTitle('Каталог')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [color, setColor] = useState('')
  const [size, setSize] = useState('')
  const [volume, setVolume] = useState('')

  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput), 300)
    return () => clearTimeout(timeout)
  }, [searchInput])

  const { products, loading, error } = useCatalog({ search, color, size, volume })

  return (
    <MainLayout>
      <div className="flex flex-col gap-6 py-8">
        <SearchBar value={searchInput} onChange={setSearchInput} />

        <FilterBar
          color={color}
          size={size}
          volume={volume}
          onColorChange={setColor}
          onSizeChange={setSize}
          onVolumeChange={setVolume}
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
