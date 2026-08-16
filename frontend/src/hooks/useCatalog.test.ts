import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import useCatalog from './useCatalog'
import catalogClient from '../api/catalogClient'
import type { ProductDto } from '../types/catalog'

vi.mock('../api/catalogClient', () => ({
  default: { get: vi.fn() },
}))

const mockedGet = vi.mocked(catalogClient.get)

const product: ProductDto = {
  id: 1,
  name: 'Custom Tumbler',
  description: null,
  category: null,
  basePrice: 25,
  active: true,
  imageUrl: null,
  variants: [],
}

beforeEach(() => {
  mockedGet.mockReset()
})

describe('useCatalog', () => {
  it('fetches products with no filter params by default', async () => {
    mockedGet.mockResolvedValueOnce({ data: [product] } as never)

    const { result } = renderHook(() => useCatalog())

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.products).toEqual([product])
    expect(mockedGet).toHaveBeenCalledWith(
      '/products',
      expect.objectContaining({ params: { search: undefined, color: undefined, size: undefined, volume: undefined } })
    )
  })

  it('forwards the given filters as query params', async () => {
    mockedGet.mockResolvedValueOnce({ data: [] } as never)

    const { result } = renderHook(() => useCatalog({ search: 'tumbler', color: 'black', size: 'M', volume: '500ml' }))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(mockedGet).toHaveBeenCalledWith(
      '/products',
      expect.objectContaining({ params: { search: 'tumbler', color: 'black', size: 'M', volume: '500ml' } })
    )
  })

  it('refetches when the filters change', async () => {
    mockedGet.mockResolvedValue({ data: [] } as never)

    const { result, rerender } = renderHook(({ color }) => useCatalog({ color }), {
      initialProps: { color: '' },
    })

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(mockedGet).toHaveBeenCalledTimes(1)

    rerender({ color: 'black' })

    await waitFor(() => expect(mockedGet).toHaveBeenCalledTimes(2))
    expect(mockedGet).toHaveBeenLastCalledWith(
      '/products',
      expect.objectContaining({ params: expect.objectContaining({ color: 'black' }) })
    )
  })

  it('sets an error message when the request fails', async () => {
    mockedGet.mockRejectedValueOnce(new Error('Network Error'))

    const { result } = renderHook(() => useCatalog())

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toBe('Network Error')
  })
})
