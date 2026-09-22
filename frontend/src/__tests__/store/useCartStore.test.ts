import { describe, it, expect, beforeEach } from 'vitest'
import useCartStore, { type CartItem } from '../../store/useCartStore'

const item = (overrides: Partial<CartItem> = {}): CartItem => ({
  variantId: 1,
  productId: 1,
  productName: 'Custom Tumbler',
  sku: 'TUM-BLK-500',
  attributes: { color: 'black' },
  unitPrice: 25,
  quantity: 1,
  status: 'IN_STOCK',
  ...overrides,
})

beforeEach(() => {
  useCartStore.setState({ items: [], isOpen: false })
})

describe('useCartStore', () => {
  it('adds a new item to an empty cart', () => {
    useCartStore.getState().addItem(item())

    expect(useCartStore.getState().items).toHaveLength(1)
  })

  it('merges quantities when the same variant is added twice', () => {
    useCartStore.getState().addItem(item({ quantity: 2 }))
    useCartStore.getState().addItem(item({ quantity: 3 }))

    const items = useCartStore.getState().items
    expect(items).toHaveLength(1)
    expect(items[0].quantity).toBe(5)
  })

  it('ignores an add with zero or negative quantity', () => {
    useCartStore.getState().addItem(item({ variantId: 1, quantity: 0 }))
    useCartStore.getState().addItem(item({ variantId: 2, quantity: -5 }))

    expect(useCartStore.getState().items).toEqual([])
  })

  it('increments and decrements quantity via changeQuantity', () => {
    useCartStore.getState().addItem(item({ quantity: 2 }))

    useCartStore.getState().changeQuantity(1, 1)
    expect(useCartStore.getState().items[0].quantity).toBe(3)

    useCartStore.getState().changeQuantity(1, -1)
    expect(useCartStore.getState().items[0].quantity).toBe(2)
  })

  it('never drops quantity below one via changeQuantity', () => {
    useCartStore.getState().addItem(item({ quantity: 1 }))

    useCartStore.getState().changeQuantity(1, -1)

    expect(useCartStore.getState().items[0].quantity).toBe(1)
  })

  it('keeps distinct variants as separate line items', () => {
    useCartStore.getState().addItem(item({ variantId: 1 }))
    useCartStore.getState().addItem(item({ variantId: 2 }))

    expect(useCartStore.getState().items).toHaveLength(2)
  })

  it('removes an item by variantId', () => {
    useCartStore.getState().addItem(item({ variantId: 1 }))
    useCartStore.getState().addItem(item({ variantId: 2 }))

    useCartStore.getState().removeItem(1)

    const items = useCartStore.getState().items
    expect(items).toHaveLength(1)
    expect(items[0].variantId).toBe(2)
  })

  it('does nothing when removing a variantId that is not in the cart', () => {
    useCartStore.getState().addItem(item({ variantId: 1 }))

    useCartStore.getState().removeItem(999)

    expect(useCartStore.getState().items).toHaveLength(1)
  })

  it('clears all items', () => {
    useCartStore.getState().addItem(item({ variantId: 1 }))
    useCartStore.getState().addItem(item({ variantId: 2 }))

    useCartStore.getState().clearCart()

    expect(useCartStore.getState().items).toEqual([])
  })

  it('computes totalPrice across quantities and unit prices', () => {
    useCartStore.getState().addItem(item({ variantId: 1, unitPrice: 25, quantity: 2 }))
    useCartStore.getState().addItem(item({ variantId: 2, unitPrice: 10, quantity: 3 }))

    expect(useCartStore.getState().totalPrice()).toBe(80)
  })

  it('returns zero totalPrice and totalCount for an empty cart', () => {
    expect(useCartStore.getState().totalPrice()).toBe(0)
    expect(useCartStore.getState().totalCount()).toBe(0)
  })

  it('computes totalCount as the sum of quantities, not line item count', () => {
    useCartStore.getState().addItem(item({ variantId: 1, quantity: 4 }))
    useCartStore.getState().addItem(item({ variantId: 2, quantity: 1 }))

    expect(useCartStore.getState().totalCount()).toBe(5)
  })

  it('toggles the drawer open state', () => {
    expect(useCartStore.getState().isOpen).toBe(false)

    useCartStore.getState().toggleCart()
    expect(useCartStore.getState().isOpen).toBe(true)

    useCartStore.getState().toggleCart()
    expect(useCartStore.getState().isOpen).toBe(false)
  })

  it('opens and closes the drawer explicitly', () => {
    useCartStore.getState().openCart()
    expect(useCartStore.getState().isOpen).toBe(true)

    useCartStore.getState().closeCart()
    expect(useCartStore.getState().isOpen).toBe(false)
  })
})

describe('useCartStore persistence', () => {
  it('keeps the cart lines in localStorage but not the drawer state', () => {
    useCartStore.getState().addItem(item({ quantity: 2 }))
    useCartStore.getState().openCart()

    const saved = JSON.parse(localStorage.getItem('adikabuyer-cart') ?? '{}')

    expect(saved.state.items).toHaveLength(1)
    expect(saved.state.items[0].quantity).toBe(2)
    expect(saved.state).not.toHaveProperty('isOpen')
  })

  it('restores the cart lines from localStorage after a reload', async () => {
    localStorage.setItem('adikabuyer-cart', JSON.stringify({ state: { items: [item({ variantId: 7, quantity: 3 })] }, version: 1 }))

    await useCartStore.persist.rehydrate()

    expect(useCartStore.getState().items).toEqual([expect.objectContaining({ variantId: 7, quantity: 3 })])
    expect(useCartStore.getState().isOpen).toBe(false)
  })
})

describe('useCartStore stock caps', () => {
  it('never lets an in-stock line go past its stock, whether added or stepped up', () => {
    useCartStore.getState().addItem(item({ quantity: 2, maxQuantity: 3 }))
    useCartStore.getState().addItem(item({ quantity: 5, maxQuantity: 3 }))
    expect(useCartStore.getState().items[0].quantity).toBe(3)

    useCartStore.getState().changeQuantity(1, 1)
    expect(useCartStore.getState().items[0].quantity).toBe(3)
  })

  it('leaves pre-order lines uncapped', () => {
    useCartStore.getState().addItem(item({ quantity: 40, status: 'PRE_ORDER' }))
    useCartStore.getState().changeQuantity(1, 10)

    expect(useCartStore.getState().items[0].quantity).toBe(50)
  })

  it('ignores an add when the stock is zero', () => {
    useCartStore.getState().addItem(item({ maxQuantity: 0 }))

    expect(useCartStore.getState().items).toHaveLength(0)
  })
})
