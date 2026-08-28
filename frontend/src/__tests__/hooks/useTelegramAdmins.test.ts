import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import useTelegramAdmins from '../../hooks/useTelegramAdmins'
import getTelegramAdmins from '../../api/telegramAdmins'
import type { TelegramAdminDto } from '../../types/telegramAdmin'

vi.mock('../../api/telegramAdmins')

const mockedGetTelegramAdmins = vi.mocked(getTelegramAdmins)

const admin: TelegramAdminDto = {
  chatId: 42,
  username: 'shop_owner',
  registeredAt: '2026-01-01T00:00:00Z',
}

beforeEach(() => {
  mockedGetTelegramAdmins.mockReset()
})

describe('useTelegramAdmins', () => {
  it('does not fetch when disabled', () => {
    renderHook(() => useTelegramAdmins(false))

    expect(mockedGetTelegramAdmins).not.toHaveBeenCalled()
  })

  it('fetches and returns admins when enabled', async () => {
    mockedGetTelegramAdmins.mockResolvedValueOnce([admin])

    const { result } = renderHook(() => useTelegramAdmins(true))

    await waitFor(() => expect(result.current.admins).toEqual([admin]))
    expect(result.current.error).toBeNull()
    expect(result.current.loading).toBe(false)
  })

  it('sets an error message when the fetch fails', async () => {
    mockedGetTelegramAdmins.mockRejectedValueOnce(new Error('boom'))

    const { result } = renderHook(() => useTelegramAdmins(true))

    await waitFor(() => expect(result.current.error).toBe('boom'))
    expect(result.current.admins).toEqual([])
  })
})
