import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import useCategories from './useCategories'
import catalogClient from '../api/catalogClient'

vi.mock('../api/catalogClient', () => ({
  default: { get: vi.fn() },
}))

const mockedGet = vi.mocked(catalogClient.get)

beforeEach(() => {
  mockedGet.mockReset()
})

describe('useCategories', () => {
  it('maps the fetched category strings into filter options', async () => {
    mockedGet.mockResolvedValueOnce({ data: ['Drinkware', 'Одежда'] } as never)

    const { result } = renderHook(() => useCategories())

    await waitFor(() =>
      expect(result.current).toEqual([
        { label: 'Drinkware', value: 'Drinkware' },
        { label: 'Одежда', value: 'Одежда' },
      ])
    )
  })

  it('forwards the given filters as query params', async () => {
    mockedGet.mockResolvedValueOnce({ data: [] } as never)

    renderHook(() =>
      useCategories({ search: 'tumbler', color: 'black', size: 'M', volumeMin: '300', volumeMax: '600' })
    )

    await waitFor(() =>
      expect(mockedGet).toHaveBeenCalledWith(
        '/categories',
        expect.objectContaining({
          params: { search: 'tumbler', color: 'black', size: 'M', volumeMin: '300', volumeMax: '600' },
        })
      )
    )
  })

  it('refetches when a filter changes', async () => {
    mockedGet.mockResolvedValue({ data: [] } as never)

    const { rerender } = renderHook(({ color }) => useCategories({ color }), {
      initialProps: { color: '' },
    })

    await waitFor(() => expect(mockedGet).toHaveBeenCalledTimes(1))

    rerender({ color: 'black' })

    await waitFor(() => expect(mockedGet).toHaveBeenCalledTimes(2))
    expect(mockedGet).toHaveBeenLastCalledWith(
      '/categories',
      expect.objectContaining({ params: expect.objectContaining({ color: 'black' }) })
    )
  })

  it('keeps the previous list when the request fails', async () => {
    mockedGet.mockRejectedValueOnce(new Error('Network Error'))

    const { result } = renderHook(() => useCategories())

    await waitFor(() => expect(mockedGet).toHaveBeenCalled())
    expect(result.current).toEqual([])
  })
})
