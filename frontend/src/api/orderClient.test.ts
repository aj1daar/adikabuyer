import { describe, it, expect } from 'vitest'
import orderClient from './orderClient'

describe('orderClient', () => {
  it('defaults to the local order-service base URL', () => {
    expect(orderClient.defaults.baseURL).toBe('http://localhost:8082/api/orders')
  })

  it('sends JSON content type headers', () => {
    expect(orderClient.defaults.headers['Content-Type']).toBe('application/json')
  })
})
