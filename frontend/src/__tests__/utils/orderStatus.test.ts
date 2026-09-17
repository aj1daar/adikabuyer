import { describe, it, expect } from 'vitest'
import { matchesOrderFilter, nextStatus, isFinalStatus, ORDER_STATUS_LABEL } from '../../utils/orderStatus'

describe('orderStatus', () => {
  it('walks the buyer flow one step at a time and stops at the end', () => {
    expect(nextStatus('NEW')).toBe('CONFIRMED')
    expect(nextStatus('CONFIRMED')).toBe('PURCHASED')
    expect(nextStatus('PURCHASED')).toBe('SHIPPED')
    expect(nextStatus('SHIPPED')).toBe('DELIVERED')
    expect(nextStatus('DELIVERED')).toBeNull()
    expect(nextStatus('CANCELLED')).toBeNull()
  })

  it('treats delivered and cancelled as final', () => {
    expect(isFinalStatus('DELIVERED')).toBe(true)
    expect(isFinalStatus('CANCELLED')).toBe(true)
    expect(isFinalStatus('SHIPPED')).toBe(false)
  })

  it('groups the in-progress statuses under В работе', () => {
    expect(matchesOrderFilter('CONFIRMED', 'active')).toBe(true)
    expect(matchesOrderFilter('SHIPPED', 'active')).toBe(true)
    expect(matchesOrderFilter('NEW', 'active')).toBe(false)
    expect(matchesOrderFilter('CANCELLED', 'all')).toBe(true)
    expect(ORDER_STATUS_LABEL.SHIPPED).toBe('В пути')
  })
})
