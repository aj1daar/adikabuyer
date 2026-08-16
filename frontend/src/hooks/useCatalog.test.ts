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
  variants: [],
}

beforeEach(() => {
  mockedGet.mockReset()
})

describe('useCatalog', () => {
  it('starts in a loading state with no products or error', () => {
    mockedGet.mockImplementation(() => new Promise(() => {}))

    const { result } = renderHook(() => useCatalog())

    expect(result.current.loading).toBe(true)
    expect(result.current.products).toEqual([])
    expect(result.current.error).toBeNull()
  })

  it('populates products and clears loading on success', async () => {
    mockedGet.mockResolvedValueOnce({ data: [product] } as never)

    const { result } = renderHook(() => useCatalog())

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.products).toEqual([product])
    expect(result.current.error).toBeNull()
  })

  it('sets an error message and clears loading on failure', async () => {
    mockedGet.mockRejectedValueOnce(new Error('Network Error'))

    const { result } = renderHook(() => useCatalog())

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toBe('Network Error')
    expect(result.current.products).toEqual([])
  })

  it('passes an abort signal so an unmount cancels the in-flight request', () => {
    mockedGet.mockImplementation(() => new Promise(() => {}))

    const { unmount } = renderHook(() => useCatalog())

    expect(mockedGet).toHaveBeenCalledWith(
      '/products',
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    )

    expect(() => unmount()).not.toThrow()
  })
})
