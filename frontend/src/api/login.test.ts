import { describe, it, expect, vi, beforeEach } from 'vitest'
import login from './login'
import authClient from './authClient'
import type { LoginResponse } from '../types/auth'

vi.mock('./authClient', () => ({
  default: { post: vi.fn() },
}))

const mockedPost = vi.mocked(authClient.post)

const response: LoginResponse = { token: 'jwt-token', tokenType: 'Bearer' }

beforeEach(() => {
  mockedPost.mockReset()
})

describe('login', () => {
  it('posts credentials to the login endpoint', async () => {
    mockedPost.mockResolvedValueOnce({ data: response } as never)

    await login({ username: 'admin', password: 'admin123' })

    expect(mockedPost).toHaveBeenCalledWith('/login', { username: 'admin', password: 'admin123' })
  })

  it('resolves with the response data', async () => {
    mockedPost.mockResolvedValueOnce({ data: response } as never)

    const result = await login({ username: 'admin', password: 'admin123' })

    expect(result).toEqual(response)
  })

  it('propagates the error on failed login', async () => {
    mockedPost.mockRejectedValueOnce(new Error('Unauthorized'))

    await expect(login({ username: 'admin', password: 'wrong' })).rejects.toThrow('Unauthorized')
  })
})
