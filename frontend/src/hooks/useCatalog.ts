import { useCallback, useEffect, useState } from 'react'
import catalogClient from '../api/catalogClient'
import type { ProductDto, ProductPageResponse } from '../types/catalog'

export type CatalogFilters = {
  search?: string
  category?: string
  color?: string
  size?: string
  volumeMin?: string
  volumeMax?: string
  includeArchived?: boolean
}

export type CatalogPagination = {
  page?: number
  pageSize?: number
}

const DEFAULT_PAGE_SIZE = 1000

type UseCatalogResult = {
  products: ProductDto[]
  totalCount: number
  loading: boolean
  error: string | null
  refetch: () => void
}

export default function useCatalog(
  filters: CatalogFilters = {},
  pagination: CatalogPagination = {}
): UseCatalogResult {
  const [products, setProducts] = useState<ProductDto[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { search, category, color, size, volumeMin, volumeMax, includeArchived } = filters
  const { page = 0, pageSize = DEFAULT_PAGE_SIZE } = pagination

  const fetchProducts = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true)
      setError(null)
      try {
        const response = await catalogClient.get<ProductPageResponse>('/products', {
          signal,
          params: {
            search,
            category,
            color,
            size,
            volumeMin,
            volumeMax,
            page,
            pageSize,
            includeArchived: includeArchived || undefined,
          },
        })
        setProducts(response.data.items)
        setTotalCount(response.data.totalCount)
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
    [search, category, color, size, volumeMin, volumeMax, page, pageSize, includeArchived]
  )

  useEffect(() => {
    const controller = new AbortController()
    fetchProducts(controller.signal)
    return () => controller.abort()
  }, [fetchProducts])

  const refetch = useCallback(() => {
    fetchProducts()
  }, [fetchProducts])

  return { products, totalCount, loading, error, refetch }
}
