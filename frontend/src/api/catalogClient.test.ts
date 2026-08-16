import { describe, it, expect } from 'vitest'
import catalogClient from './catalogClient'

describe('catalogClient', () => {
  it('defaults to the local catalog-service base URL', () => {
    expect(catalogClient.defaults.baseURL).toBe('http://localhost:8081/api/catalog')
  })

  it('sends JSON content type headers', () => {
    expect(catalogClient.defaults.headers['Content-Type']).toBe('application/json')
  })
})
