import { useEffect, useState } from 'react'
import catalogClient from '../api/catalogClient'
import type { FilterOption } from '../utils/attributeOptions'

export type CategoryFilters = {
  search?: string
  color?: string
  size?: string
  volumeMin?: string
  volumeMax?: string
}

export default function useCategories(filters: CategoryFilters = {}): FilterOption[] {
  const [categories, setCategories] = useState<string[]>([])
  const { search, color, size, volumeMin, volumeMax } = filters

  useEffect(() => {
    const controller = new AbortController()
    catalogClient
      .get<string[]>('/categories', {
        signal: controller.signal,
        params: { search, color, size, volumeMin, volumeMax },
      })
      .then((response) => setCategories(response.data))
      .catch(() => {
        // Category options are a non-critical filter aid — leave the list as-is on failure.
      })
    return () => controller.abort()
  }, [search, color, size, volumeMin, volumeMax])

  return categories.map((category) => ({ label: category, value: category }))
}
