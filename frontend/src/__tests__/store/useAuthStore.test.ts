import { describe, it, expect, beforeEach } from 'vitest'
import useAuthStore from '../../store/useAuthStore'

beforeEach(() => {
  useAuthStore.setState({ token: null })
})

describe('useAuthStore', () => {
  it('starts unauthenticated with no token', () => {
    expect(useAuthStore.getState().token).toBeNull()
    expect(useAuthStore.getState().isAuthenticated()).toBe(false)
  })

  it('becomes authenticated after setToken', () => {
    useAuthStore.getState().setToken('jwt-token')

    expect(useAuthStore.getState().token).toBe('jwt-token')
    expect(useAuthStore.getState().isAuthenticated()).toBe(true)
  })

  it('becomes unauthenticated after clearToken', () => {
    useAuthStore.getState().setToken('jwt-token')
    useAuthStore.getState().clearToken()

    expect(useAuthStore.getState().token).toBeNull()
    expect(useAuthStore.getState().isAuthenticated()).toBe(false)
  })
})
