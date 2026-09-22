import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { VariantStatus } from '../types/catalog'

export type CartItem = {
  variantId: number
  productId: number
  productName: string
  sku: string
  attributes: Record<string, unknown>
  unitPrice: number
  quantity: number
  status: VariantStatus
  /** in-stock units available; absent for pre-order (no cap) and for carts saved before caps */
  maxQuantity?: number
}

/** keep a quantity between 1 and the item's stock cap, when it has one */
export const clampQuantity = (quantity: number, maxQuantity?: number) =>
  Math.max(1, maxQuantity != null ? Math.min(quantity, maxQuantity) : quantity)

type CartStore = {
  items: CartItem[]
  isOpen: boolean
  addItem: (item: CartItem) => void
  removeItem: (variantId: number) => void
  changeQuantity: (variantId: number, delta: number) => void
  clearCart: () => void
  openCart: () => void
  closeCart: () => void
  toggleCart: () => void
  totalPrice: () => number
  totalCount: () => number
}

// The cart lines survive a reload or a closed tab; the drawer's open state does not.
// Prices are only a preview here — checkout re-prices every line on the server.
const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      addItem: (item) =>
        set((state) => {
          if (item.quantity <= 0 || item.maxQuantity === 0) {
            return state
          }
          const existing = state.items.find((cartItem) => cartItem.variantId === item.variantId)
          if (existing) {
            return {
              items: state.items.map((cartItem) =>
                cartItem.variantId === item.variantId
                  ? {
                      ...cartItem,
                      // the newest stock figure wins over the one saved with the cart
                      maxQuantity: item.maxQuantity,
                      quantity: clampQuantity(cartItem.quantity + item.quantity, item.maxQuantity),
                    }
                  : cartItem
              ),
            }
          }
          return { items: [...state.items, { ...item, quantity: clampQuantity(item.quantity, item.maxQuantity) }] }
        }),
      removeItem: (variantId) =>
        set((state) => ({
          items: state.items.filter((cartItem) => cartItem.variantId !== variantId),
        })),
      changeQuantity: (variantId, delta) =>
        set((state) => ({
          items: state.items.map((cartItem) =>
            cartItem.variantId === variantId
              ? { ...cartItem, quantity: clampQuantity(cartItem.quantity + delta, cartItem.maxQuantity) }
              : cartItem
          ),
        })),
      clearCart: () => set({ items: [] }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      totalPrice: () => get().items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
      totalCount: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
    }),
    {
      name: 'adikabuyer-cart',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
    }
  )
)

export default useCartStore
