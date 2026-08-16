import { create } from 'zustand'

export type CartItem = {
  variantId: number
  productId: number
  productName: string
  sku: string
  attributes: Record<string, unknown>
  unitPrice: number
  quantity: number
}

type CartStore = {
  items: CartItem[]
  isOpen: boolean
  addItem: (item: CartItem) => void
  removeItem: (variantId: number) => void
  openCart: () => void
  closeCart: () => void
  toggleCart: () => void
  totalPrice: () => number
  totalCount: () => number
}

const useCartStore = create<CartStore>()((set, get) => ({
  items: [],
  isOpen: false,
  addItem: (item) =>
    set((state) => {
      const existing = state.items.find((cartItem) => cartItem.variantId === item.variantId)
      if (existing) {
        return {
          items: state.items.map((cartItem) =>
            cartItem.variantId === item.variantId
              ? { ...cartItem, quantity: cartItem.quantity + item.quantity }
              : cartItem
          ),
        }
      }
      return { items: [...state.items, item] }
    }),
  removeItem: (variantId) =>
    set((state) => ({
      items: state.items.filter((cartItem) => cartItem.variantId !== variantId),
    })),
  openCart: () => set({ isOpen: true }),
  closeCart: () => set({ isOpen: false }),
  toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
  totalPrice: () => get().items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
  totalCount: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
}))

export default useCartStore
