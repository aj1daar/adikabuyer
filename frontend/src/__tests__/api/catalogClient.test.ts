import { describe, it, expect, beforeEach } from 'vitest'
import catalogClient, { attachAuthHeader, handleAuthError } from '../../api/catalogClient'
import useAuthStore from '../../store/useAuthStore'
import type { InternalAxiosRequestConfig } from 'axios'

beforeEach(() => {
  useAuthStore.setState({ token: null })
})

describe('catalogClient', () => {
  it('defaults to the local api-gateway base URL', () => {
    expect(catalogClient.defaults.baseURL).toBe('http://localhost:8080/api/catalog')
  })

  it('sends JSON content type headers', () => {
    expect(catalogClient.defaults.headers['Content-Type']).toBe('application/json')
  })
})

describe('attachAuthHeader', () => {
  it('attaches the Authorization header when a token is present', () => {
    useAuthStore.setState({ token: 'jwt-token' })
    const config = { headers: {} } as InternalAxiosRequestConfig

    const result = attachAuthHeader(config)

    expect(result.headers.Authorization).toBe('Bearer jwt-token')
  })

  it('does not attach an Authorization header when no token is present', () => {
    const config = { headers: {} } as InternalAxiosRequestConfig

    const result = attachAuthHeader(config)

    expect(result.headers.Authorization).toBeUndefined()
  })
})

describe('handleAuthError', () => {
  it('clears the auth token on a 401 response', async () => {
    useAuthStore.setState({ token: 'jwt-token' })

    await expect(handleAuthError({ response: { status: 401 } })).rejects.toBeDefined()

    expect(useAuthStore.getState().token).toBeNull()
  })

  it('does not clear the auth token on a non-401 response', async () => {
    useAuthStore.setState({ token: 'jwt-token' })

    await expect(handleAuthError({ response: { status: 500 } })).rejects.toBeDefined()

    expect(useAuthStore.getState().token).toBe('jwt-token')
  })
})
