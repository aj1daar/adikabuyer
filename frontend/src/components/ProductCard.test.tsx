import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ProductCard from './ProductCard'
import type { ProductDto } from '../types/catalog'

const product: ProductDto = {
  id: 1,
  name: 'Custom Tumbler',
  description: 'Insulated steel tumbler',
  category: 'Drinkware',
  basePrice: 25,
  active: true,
  variants: [
    {
      id: 1,
      productId: 1,
      sku: 'TUM-BLK-500',
      attributes: { color: 'Black', size: '500ml' },
      priceOverride: null,
      stockQuantity: 10,
      active: true,
    },
  ],
}

describe('ProductCard', () => {
  it('renders product title, price, and dynamic variant attributes', () => {
    render(<ProductCard product={product} />)

    expect(screen.getByText('Custom Tumbler')).toBeInTheDocument()
    expect(screen.getByText('$25.00')).toBeInTheDocument()
    expect(screen.getByText('Black, 500ml')).toBeInTheDocument()
  })

  it('calls onAddToCart with the product when the button is clicked', () => {
    const onAddToCart = vi.fn()
    render(<ProductCard product={product} onAddToCart={onAddToCart} />)

    fireEvent.click(screen.getByRole('button', { name: /add to cart/i }))

    expect(onAddToCart).toHaveBeenCalledWith(product)
    expect(onAddToCart).toHaveBeenCalledTimes(1)
  })
})
