import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import ProductCardList from '../../../components/admin/ProductCardList'
import type { ProductDto } from '../../../types/catalog'

const variant = (id: number, sku: string, status: 'IN_STOCK' | 'PRE_ORDER' | 'SOLD_OUT', stock: number) => ({
  id,
  productId: 1,
  sku,
  imageUrls: [],
  attributes: { color: 'Чёрный', volume: 500 },
  priceOverride: 900,
  displayPrice: 1290,
  stockQuantity: stock,
  active: status !== 'SOLD_OUT',
  status,
})

const product: ProductDto = {
  id: 1,
  name: 'Термостакан «Полночь»',
  description: null,
  category: 'Термостаканы',
  basePrice: 900,
  displayPrice: 1290,
  active: true,
  imageUrl: null,
  variants: [variant(10, 'ЧЁРНЫЙ-500', 'IN_STOCK', 20), variant(11, 'ЧЁРНЫЙ-750', 'PRE_ORDER', 0)],
}

function renderList(products: ProductDto[] = [product]) {
  const handlers = { onEdit: vi.fn(), onDeleteProduct: vi.fn(), onDeleteVariant: vi.fn() }
  render(<ProductCardList products={products} {...handlers} />)
  return handlers
}

describe('ProductCardList', () => {
  it('shows every variant with its SKU, attributes, price, stock and status on the card', () => {
    renderList()

    const card = screen.getByRole('heading', { name: 'Термостакан «Полночь»' }).closest('li') as HTMLElement
    expect(within(card).getByText(/Термостаканы · вариантов: 2/)).toBeInTheDocument()
    expect(within(card).getByText('ЧЁРНЫЙ-500')).toBeInTheDocument()
    expect(within(card).getAllByText('color: Чёрный, volume: 500')).toHaveLength(2)
    expect(within(card).getByText('В наличии')).toBeInTheDocument()
    expect(within(card).getByText('Предзаказ')).toBeInTheDocument()
    expect(within(card).getByText('20')).toBeInTheDocument()
  })

  it('wires the product and variant actions to the right records', () => {
    const handlers = renderList()

    fireEvent.click(screen.getByRole('button', { name: 'Изменить' }))
    fireEvent.click(screen.getByRole('button', { name: 'Удалить товар' }))
    fireEvent.click(screen.getAllByRole('button', { name: 'Удалить вариант' })[1])

    expect(handlers.onEdit).toHaveBeenCalledWith(product)
    expect(handlers.onDeleteProduct).toHaveBeenCalledWith(product)
    expect(handlers.onDeleteVariant).toHaveBeenCalledWith(product, product.variants[1])
  })

  it('offers no variant delete when only one variant is left', () => {
    renderList([{ ...product, variants: [product.variants[0]] }])

    expect(screen.queryByRole('button', { name: 'Удалить вариант' })).not.toBeInTheDocument()
    expect(screen.getByText(/Единственный вариант/)).toBeInTheDocument()
  })

  it('marks a product whose variants are all sold out as archived', () => {
    renderList([{ ...product, variants: [variant(12, 'X', 'SOLD_OUT', 0)] }])

    expect(screen.getByText('В архиве')).toBeInTheDocument()
  })
})
