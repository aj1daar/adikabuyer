import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ProductCard from './ProductCard'
import useCartStore from '../store/useCartStore'
import type { ProductDto } from '../types/catalog'

const product: ProductDto = {
  id: 1,
  name: 'Custom Tumbler',
  description: 'Insulated steel tumbler',
  category: 'Drinkware',
  basePrice: 25,
  displayPrice: 25,
  active: true,
  imageUrl: null,
  variants: [
    {
      id: 1,
      productId: 1,
      sku: 'TUM-BLK-500',
      imageUrls: [],
      attributes: { color: 'Black', size: '500ml' },
      priceOverride: null,
      displayPrice: 25,
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
  it('renders product title, price, and each variant attribute as a separate tag', () => {
    render(<ProductCard product={product} />, { wrapper: MemoryRouter })

    expect(screen.getByText('Custom Tumbler')).toBeInTheDocument()
    expect(screen.getByText('25 KGS')).toBeInTheDocument()
    expect(screen.getByText('Black')).toBeInTheDocument()
    expect(screen.getByText('500ml')).toBeInTheDocument()
  })

  it('formats the volume attribute with a мл suffix', () => {
    const productWithVolume: ProductDto = {
      ...product,
      variants: [{ ...product.variants[0], attributes: { volume: 500 } }],
    }

    render(<ProductCard product={productWithVolume} />, { wrapper: MemoryRouter })

    expect(screen.getByText('500 мл')).toBeInTheDocument()
  })

  it('renders the product image when imageUrl is set and initials otherwise', () => {
    const { rerender } = render(<ProductCard product={product} />, { wrapper: MemoryRouter })
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.getByText('CT')).toBeInTheDocument()

    rerender(
      <ProductCard product={{ ...product, imageUrl: 'http://localhost:9000/adikabuyer-media/photo.jpg' }} />,
    )
    const image = screen.getByRole('img', { name: 'Custom Tumbler' })
    expect(image).toHaveAttribute('src', 'http://localhost:9000/adikabuyer-media/photo.jpg')
  })

  it('adds the selected quantity and resets the stepper afterwards', () => {
    render(<ProductCard product={product} />, { wrapper: MemoryRouter })

    const plus = screen.getByRole('button', { name: 'Увеличить количество' })
    fireEvent.click(plus)
    fireEvent.click(plus)
    expect(screen.getByText('3')).toBeInTheDocument()

    const minus = screen.getByRole('button', { name: 'Уменьшить количество' })
    fireEvent.click(minus)

    fireEvent.click(screen.getByRole('button', { name: /в корзину/i }))

    expect(useCartStore.getState().items[0].quantity).toBe(2)
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(minus).toBeDisabled()
  })

  it('adds the primary variant to the cart store when the button is clicked', () => {
    render(<ProductCard product={product} />, { wrapper: MemoryRouter })

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
        status: 'IN_STOCK',
      },
    ])
  })
})
