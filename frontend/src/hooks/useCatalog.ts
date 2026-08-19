import { useCallback, useEffect, useState } from 'react'
import catalogClient from '../api/catalogClient'
import type { ProductDto } from '../types/catalog'

export type CatalogFilters = {
  search?: string
  category?: string
  color?: string
  size?: string
  volume?: string
}

type UseCatalogResult = {
  products: ProductDto[]
  loading: boolean
  error: string | null
  refetch: () => void
}

export default function useCatalog(filters: CatalogFilters = {}): UseCatalogResult {
  const [products, setProducts] = useState<ProductDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { search, category, color, size, volume } = filters

  const fetchProducts = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true)
      setError(null)
      try {
        const response = await catalogClient.get<ProductDto[]>('/products', {
          signal,
          params: { search, category, color, size, volume },
        })
        setProducts(response.data)
      } catch (err) {
        if (!signal?.aborted) {
          setError(err instanceof Error ? err.message : 'Не удалось загрузить товары')
        }
      } finally {
        if (!signal?.aborted) {
          setLoading(false)
        }
      }
    },
    [search, category, color, size, volume]
  )

  useEffect(() => {
    const controller = new AbortController()
    fetchProducts(controller.signal)
    return () => controller.abort()
  }, [fetchProducts])

  const refetch = useCallback(() => {
    fetchProducts()
  }, [fetchProducts])

  return { products, loading, error, refetch }
}
