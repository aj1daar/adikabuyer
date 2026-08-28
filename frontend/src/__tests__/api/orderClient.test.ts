import { describe, it, expect } from 'vitest'
import orderClient from '../../api/orderClient'

describe('orderClient', () => {
  it('defaults to the local api-gateway base URL', () => {
    expect(orderClient.defaults.baseURL).toBe('http://localhost:8080/api/orders')
  })

  it('sends JSON content type headers', () => {
    expect(orderClient.defaults.headers['Content-Type']).toBe('application/json')
  })
})
