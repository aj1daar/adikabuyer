import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import useCatalog from '../../hooks/useCatalog'
import catalogClient from '../../api/catalogClient'
import type { ProductDto } from '../../types/catalog'

vi.mock('../../api/catalogClient', () => ({
  default: { get: vi.fn() },
}))

const mockedGet = vi.mocked(catalogClient.get)

const product: ProductDto = {
  id: 1,
  name: 'Custom Tumbler',
  description: null,
  category: null,
  basePrice: 25,
  displayPrice: 25,
  active: true,
  imageUrl: null,
  variants: [],
}

beforeEach(() => {
  mockedGet.mockReset()
})

describe('useCatalog', () => {
  it('fetches products with no filter params and the default page by default', async () => {
    mockedGet.mockResolvedValueOnce({ data: { items: [product], totalCount: 1, page: 0, pageSize: 1000 } } as never)

    const { result } = renderHook(() => useCatalog())

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.products).toEqual([product])
    expect(result.current.totalCount).toBe(1)
    expect(mockedGet).toHaveBeenCalledWith(
      '/products',
      expect.objectContaining({
        params: {
          search: undefined,
          category: undefined,
          color: undefined,
          size: undefined,
          volumeMin: undefined,
          volumeMax: undefined,
          page: 0,
          pageSize: 1000,
        },
      })
    )
  })

  it('forwards the given filters and pagination as query params', async () => {
    mockedGet.mockResolvedValueOnce({ data: { items: [], totalCount: 0, page: 1, pageSize: 12 } } as never)

    const { result } = renderHook(() =>
      useCatalog(
        {
          search: 'tumbler',
          category: 'Drinkware',
          color: 'black',
          size: 'M',
          volumeMin: '300',
          volumeMax: '600',
        },
        { page: 1, pageSize: 12 }
      )
    )

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(mockedGet).toHaveBeenCalledWith(
      '/products',
      expect.objectContaining({
        params: {
          search: 'tumbler',
          category: 'Drinkware',
          color: 'black',
          size: 'M',
          volumeMin: '300',
          volumeMax: '600',
          page: 1,
          pageSize: 12,
        },
      })
    )
  })

  it('refetches when the filters change', async () => {
    mockedGet.mockResolvedValue({ data: { items: [], totalCount: 0, page: 0, pageSize: 1000 } } as never)

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

  it('refetches when the page changes', async () => {
    mockedGet.mockResolvedValue({ data: { items: [], totalCount: 0, page: 0, pageSize: 12 } } as never)

    const { result, rerender } = renderHook(({ page }) => useCatalog({}, { page, pageSize: 12 }), {
      initialProps: { page: 0 },
    })

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(mockedGet).toHaveBeenCalledTimes(1)

    rerender({ page: 1 })

    await waitFor(() => expect(mockedGet).toHaveBeenCalledTimes(2))
    expect(mockedGet).toHaveBeenLastCalledWith(
      '/products',
      expect.objectContaining({ params: expect.objectContaining({ page: 1, pageSize: 12 }) })
    )
  })

  it('sets an error message when the request fails', async () => {
    mockedGet.mockRejectedValueOnce(new Error('Network Error'))

    const { result } = renderHook(() => useCatalog())

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toBe('Network Error')
  })
})
