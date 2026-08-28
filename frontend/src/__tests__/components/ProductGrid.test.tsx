import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ProductGrid from '../../components/ProductGrid'
import useCartStore from '../../store/useCartStore'
import type { ProductDto } from '../../types/catalog'

const buildProduct = (id: number, name: string): ProductDto => ({
  id,
  name,
  description: null,
  category: null,
  basePrice: 10,
  displayPrice: 10,
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
      />,
      { wrapper: MemoryRouter }
    )

    expect(screen.getByText('Tumbler')).toBeInTheDocument()
    expect(screen.getByText('Gym Shorts')).toBeInTheDocument()
  })

  it('renders nothing when the product list is empty', () => {
    const { container } = render(<ProductGrid products={[]} />, { wrapper: MemoryRouter })

    expect(container.querySelector('.grid')?.children).toHaveLength(0)
  })

  it('defaults to a single mobile column', () => {
    const { container } = render(<ProductGrid products={[]} />, { wrapper: MemoryRouter })

    expect(container.querySelector('.grid')).toHaveClass('grid-cols-1')
  })

  it('applies the requested mobile column count', () => {
    const { container } = render(<ProductGrid products={[]} mobileColumns={3} />, { wrapper: MemoryRouter })

    expect(container.querySelector('.grid')).toHaveClass('grid-cols-3')
  })
})
