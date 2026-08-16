import { describe, it, expect, beforeEach } from 'vitest'
import mediaClient from './mediaClient'
import useAuthStore from '../store/useAuthStore'

beforeEach(() => {
  useAuthStore.setState({ token: null })
})

describe('mediaClient', () => {
  it('defaults to the local api-gateway media base URL', () => {
    expect(mediaClient.defaults.baseURL).toBe('http://localhost:8080/api/media')
  })
})
