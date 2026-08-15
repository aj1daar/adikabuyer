import { useEffect, useState } from 'react'
import catalogClient from '../api/catalogClient'
import type { ProductDto } from '../types/catalog'

type UseCatalogResult = {
  products: ProductDto[]
  loading: boolean
  error: string | null
}

export default function useCatalog(): UseCatalogResult {
  const [products, setProducts] = useState<ProductDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function fetchProducts() {
      setLoading(true)
      setError(null)
      try {
        const response = await catalogClient.get<ProductDto[]>('/products', {
          signal: controller.signal,
        })
        setProducts(response.data)
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : 'Failed to load products')
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    fetchProducts()

    return () => controller.abort()
  }, [])

  return { products, loading, error }
}
