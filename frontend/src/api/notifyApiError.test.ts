import { describe, it, expect, vi, beforeEach } from 'vitest'
import toast from 'react-hot-toast'
import notifyApiError from './notifyApiError'
import type { AxiosError } from 'axios'

vi.mock('react-hot-toast', () => ({
  default: { error: vi.fn() },
}))

const mockedToastError = vi.mocked(toast.error)

type ApiErrorBody = {
  message?: string
}

function buildError(status: number | undefined, message?: string): AxiosError<ApiErrorBody> {
  return {
    isAxiosError: true,
    name: 'AxiosError',
    message: 'Request failed',
    toJSON: () => ({}),
    response: status === undefined ? undefined : {
      status,
      data: { message },
      statusText: '',
      headers: {},
      config: {} as never,
    },
  } as AxiosError<ApiErrorBody>
}

beforeEach(() => {
  mockedToastError.mockReset()
})

describe('notifyApiError', () => {
  it('shows a session-expired message on 401', async () => {
    await expect(notifyApiError(buildError(401))).rejects.toBeDefined()

    expect(mockedToastError).toHaveBeenCalledWith('Сессия истекла. Войдите снова.')
  })

  it('shows the server-provided message for non-401 errors', async () => {
    await expect(notifyApiError(buildError(409, 'One or more variant SKUs already exist'))).rejects.toBeDefined()

    expect(mockedToastError).toHaveBeenCalledWith('One or more variant SKUs already exist')
  })

  it('shows a generic fallback message when the server provides none', async () => {
    await expect(notifyApiError(buildError(500))).rejects.toBeDefined()

    expect(mockedToastError).toHaveBeenCalledWith('Произошла ошибка. Попробуйте ещё раз.')
  })

  it('shows the fallback message when there is no response at all', async () => {
    await expect(notifyApiError(buildError(undefined))).rejects.toBeDefined()

    expect(mockedToastError).toHaveBeenCalledWith('Произошла ошибка. Попробуйте ещё раз.')
  })

  it('always rejects with the original error', async () => {
    const error = buildError(404, 'Product not found: 99')

    await expect(notifyApiError(error)).rejects.toBe(error)
  })
})
