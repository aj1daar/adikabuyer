import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import ProductGrid from './ProductGrid'
import useCartStore from '../store/useCartStore'
import type { ProductDto } from '../types/catalog'

const buildProduct = (id: number, name: string): ProductDto => ({
  id,
  name,
  description: null,
  category: null,
  basePrice: 10,
  active: true,
  imageUrl: null,
  variants: [],
})

beforeEach(() => {
  useCartStore.setState({ items: [], isOpen: false })
})

describe('ProductGrid', () => {
  it('renders one card per product', () => {
    render(
      <ProductGrid
        products={[buildProduct(1, 'Tumbler'), buildProduct(2, 'Gym Shorts')]}
      />
    )

    expect(screen.getByText('Tumbler')).toBeInTheDocument()
    expect(screen.getByText('Gym Shorts')).toBeInTheDocument()
  })

  it('renders nothing when the product list is empty', () => {
    const { container } = render(<ProductGrid products={[]} />)

    expect(container.querySelector('.grid')?.children).toHaveLength(0)
  })
})
