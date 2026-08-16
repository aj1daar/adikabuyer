import { useCallback, useEffect, useState } from 'react'
import catalogClient from '../api/catalogClient'
import type { ProductDto } from '../types/catalog'

type UseCatalogResult = {
  products: ProductDto[]
  loading: boolean
  error: string | null
  refetch: () => void
}

export default function useCatalog(): UseCatalogResult {
  const [products, setProducts] = useState<ProductDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProducts = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    setError(null)
    try {
      const response = await catalogClient.get<ProductDto[]>('/products', { signal })
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
  }, [])

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
