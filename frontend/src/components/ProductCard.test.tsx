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

  it('keeps description and tags visible on mobile at the default density', () => {
    render(<ProductCard product={product} />, { wrapper: MemoryRouter })

    expect(screen.getByText('Insulated steel tumbler')).not.toHaveClass('max-sm:hidden')
    expect(screen.getByText('Black').closest('div')).not.toHaveClass('max-sm:hidden')
  })

  it('hides the description on mobile once 2 columns are selected, but keeps tags', () => {
    render(<ProductCard product={product} mobileColumns={2} />, { wrapper: MemoryRouter })

    expect(screen.getByText('Insulated steel tumbler')).toHaveClass('max-sm:hidden')
    expect(screen.getByText('Black').closest('div')).not.toHaveClass('max-sm:hidden')
  })

  it('hides description, category, and tags on mobile once 3 columns are selected', () => {
    render(<ProductCard product={product} mobileColumns={3} />, { wrapper: MemoryRouter })

    expect(screen.getByText('Insulated steel tumbler')).toHaveClass('max-sm:hidden')
    expect(screen.getByText('Drinkware')).toHaveClass('max-sm:hidden')
    expect(screen.getByText('Black').closest('div')).toHaveClass('max-sm:hidden')
    expect(screen.getByText('Custom Tumbler')).toBeInTheDocument()
  })

  it('shrinks the title on mobile once a compact density is selected', () => {
    const { rerender } = render(<ProductCard product={product} />, { wrapper: MemoryRouter })
    expect(screen.getByText('Custom Tumbler')).not.toHaveClass('max-sm:text-sm')

    rerender(<ProductCard product={product} mobileColumns={2} />)
    expect(screen.getByText('Custom Tumbler')).toHaveClass('max-sm:text-sm')
  })

  it('hides the quantity stepper and full-width cart button on mobile once compact', () => {
    render(<ProductCard product={product} mobileColumns={2} />, { wrapper: MemoryRouter })

    expect(screen.getByRole('button', { name: /^в корзину$/i }).parentElement).toHaveClass('max-sm:hidden')
  })

  it('shows a compact icon-only add-to-cart button once compact, that adds a single item', () => {
    render(<ProductCard product={product} mobileColumns={2} />, { wrapper: MemoryRouter })

    fireEvent.click(screen.getByRole('button', { name: 'Добавить в корзину' }))

    expect(useCartStore.getState().items[0].quantity).toBe(1)
  })

  it('does not show the compact icon-only add-to-cart button at the default density', () => {
    render(<ProductCard product={product} />, { wrapper: MemoryRouter })

    expect(screen.queryByRole('button', { name: 'Добавить в корзину' })).not.toBeInTheDocument()
  })

  it('hides the variant-count badge on mobile once 3 columns are selected', () => {
    const productWithVariants: ProductDto = {
      ...product,
      variants: [...product.variants, { ...product.variants[0], id: 2, sku: 'TUM-BLK-750' }],
    }

    render(<ProductCard product={productWithVariants} mobileColumns={3} />, { wrapper: MemoryRouter })

    expect(screen.getByText('Вариантов: 2')).toHaveClass('max-sm:hidden')
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
