import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ProductCard from '../../components/ProductCard'
import useCartStore from '../../store/useCartStore'
import type { ProductDto } from '../../types/catalog'

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

  it('hides the description, tags, and category on mobile once 2 columns are selected', () => {
    render(<ProductCard product={product} mobileColumns={2} />, { wrapper: MemoryRouter })

    expect(screen.getByText('Insulated steel tumbler')).toHaveClass('max-sm:hidden')
    expect(screen.getByText('Black').closest('div')).toHaveClass('max-sm:hidden')
    expect(screen.getByText('Drinkware')).toHaveClass('max-sm:hidden')
    expect(screen.getByText('Custom Tumbler').closest('a')).not.toHaveClass('max-sm:hidden')
  })

  it('additionally hides the name on mobile once 3 columns are selected', () => {
    render(<ProductCard product={product} mobileColumns={3} />, { wrapper: MemoryRouter })

    expect(screen.getByText('Insulated steel tumbler')).toHaveClass('max-sm:hidden')
    expect(screen.getByText('Drinkware')).toHaveClass('max-sm:hidden')
    expect(screen.getByText('Black').closest('div')).toHaveClass('max-sm:hidden')
    expect(screen.getByText('Custom Tumbler').closest('a')).toHaveClass('max-sm:hidden')
  })

  it('shrinks and truncates the title to one line on mobile once a compact density is selected', () => {
    const { rerender } = render(<ProductCard product={product} />, { wrapper: MemoryRouter })
    expect(screen.getByText('Custom Tumbler')).not.toHaveClass('max-sm:truncate')

    rerender(<ProductCard product={product} mobileColumns={2} />)
    expect(screen.getByText('Custom Tumbler')).toHaveClass('max-sm:truncate', 'max-sm:text-xs')
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

  it('keeps the colour-swatch row visible even in the compact 2-column density', () => {
    const swatchProduct: ProductDto = {
      ...product,
      colorSwatches: { Black: 'black-swatch.jpg' },
    }

    render(<ProductCard product={swatchProduct} mobileColumns={2} />, { wrapper: MemoryRouter })

    expect(screen.getByRole('button', { name: 'Black' }).parentElement).not.toHaveClass('max-sm:hidden')
  })

  it('puts the price and compact add-to-cart button in separate rows once compact', () => {
    render(<ProductCard product={product} mobileColumns={2} />, { wrapper: MemoryRouter })

    const priceRow = screen.getByText('25 KGS').parentElement
    expect(priceRow).not.toContainElement(screen.getByRole('button', { name: 'Добавить в корзину' }))
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

  it('swaps the image, tags and price to the picked colour', () => {
    const swatchProduct: ProductDto = {
      ...product,
      imageUrl: 'default.jpg',
      colorSwatches: { Black: 'black-swatch.jpg', White: 'white-swatch.jpg' },
      variants: [
        {
          ...product.variants[0],
          id: 1,
          attributes: { color: 'Black' },
          imageUrls: ['black-photo.jpg'],
          displayPrice: 25,
        },
        {
          ...product.variants[0],
          id: 2,
          sku: 'TUM-WHT',
          attributes: { color: 'White' },
          imageUrls: ['white-photo.jpg'],
          displayPrice: 40,
        },
      ],
    }

    render(<ProductCard product={swatchProduct} />, { wrapper: MemoryRouter })

    expect(screen.getByAltText('Custom Tumbler')).toHaveAttribute('src', 'default.jpg')
    expect(screen.getByText('Black')).toBeInTheDocument()
    expect(screen.getByText('25 KGS')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'White' }))

    expect(screen.getByAltText('Custom Tumbler')).toHaveAttribute('src', 'white-photo.jpg')
    expect(screen.getByText('White')).toBeInTheDocument()
    expect(screen.queryByText('Black')).not.toBeInTheDocument()
    expect(screen.getByText('40 KGS')).toBeInTheDocument()
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
