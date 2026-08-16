import { describe, it, expect } from 'vitest'
import catalogClient from './catalogClient'

describe('catalogClient', () => {
  it('defaults to the local api-gateway base URL', () => {
    expect(catalogClient.defaults.baseURL).toBe('http://localhost:8080/api/catalog')
  })

  it('sends JSON content type headers', () => {
    expect(catalogClient.defaults.headers['Content-Type']).toBe('application/json')
  })
})
