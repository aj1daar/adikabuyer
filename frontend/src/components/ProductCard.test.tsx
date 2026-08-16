import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ProductCard from './ProductCard'
import useCartStore from '../store/useCartStore'
import type { ProductDto } from '../types/catalog'

const product: ProductDto = {
  id: 1,
  name: 'Custom Tumbler',
  description: 'Insulated steel tumbler',
  category: 'Drinkware',
  basePrice: 25,
  active: true,
  imageUrl: null,
  variants: [
    {
      id: 1,
      productId: 1,
      sku: 'TUM-BLK-500',
      attributes: { color: 'Black', size: '500ml' },
      priceOverride: null,
      stockQuantity: 10,
      active: true,
      status: 'IN_STOCK',
    },
  ],
}

beforeEach(() => {
  useCartStore.setState({ items: [], isOpen: false })
})

describe('ProductCard', () => {
  it('renders product title, price, and dynamic variant attributes', () => {
    render(<ProductCard product={product} />)

    expect(screen.getByText('Custom Tumbler')).toBeInTheDocument()
    expect(screen.getByText('25.00 ⃀')).toBeInTheDocument()
    expect(screen.getByText('Black, 500ml')).toBeInTheDocument()
  })

  it('adds the primary variant to the cart store when the button is clicked', () => {
    render(<ProductCard product={product} />)

    fireEvent.click(screen.getByRole('button', { name: /в корзину/i }))

    expect(useCartStore.getState().items).toEqual([
      {
        variantId: 1,
        productId: 1,
        productName: 'Custom Tumbler',
        sku: 'TUM-BLK-500',
        attributes: { color: 'Black', size: '500ml' },
        unitPrice: 25,
        quantity: 1,
      },
    ])
  })
})
