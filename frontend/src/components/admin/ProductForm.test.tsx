import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ProductForm from './ProductForm'
import type { ProductDto } from '../../types/catalog'

const existingProduct: ProductDto = {
  id: 1,
  name: 'Custom Tumbler',
  description: 'Insulated steel tumbler',
  category: 'Drinkware',
  basePrice: 25,
  active: true,
  variants: [
    {
      id: 10,
      productId: 1,
      sku: 'TUM-BLK-500',
      attributes: { color: 'black' },
      priceOverride: 22.5,
      stockQuantity: 4,
      active: true,
      status: 'IN_STOCK',
    },
  ],
}

describe('ProductForm', () => {
  it('renders empty fields in create mode', () => {
    render(<ProductForm onSubmit={vi.fn()} onClose={vi.fn()} />)

    expect(screen.getByPlaceholderText('Название')).toHaveValue('')
    expect(screen.getByRole('heading', { name: /новый товар/i })).toBeInTheDocument()
  })

  it('prefills fields with the existing product in edit mode', () => {
    render(<ProductForm product={existingProduct} onSubmit={vi.fn()} onClose={vi.fn()} />)

    expect(screen.getByPlaceholderText('Название')).toHaveValue('Custom Tumbler')
    expect(screen.getByDisplayValue('TUM-BLK-500')).toBeInTheDocument()
    expect(screen.getByDisplayValue('color')).toBeInTheDocument()
    expect(screen.getByDisplayValue('black')).toBeInTheDocument()
  })

  it('disables submit until name and base price are filled', () => {
    render(<ProductForm onSubmit={vi.fn()} onClose={vi.fn()} />)

    expect(screen.getByRole('button', { name: /сохранить/i })).toBeDisabled()

    fireEvent.change(screen.getByPlaceholderText('Название'), { target: { value: 'New Product' } })
    expect(screen.getByRole('button', { name: /сохранить/i })).toBeDisabled()

    fireEvent.change(screen.getByPlaceholderText('Базовая цена'), { target: { value: '15' } })
    expect(screen.getByRole('button', { name: /сохранить/i })).toBeEnabled()
  })

  it('calls onClose when Close is clicked', () => {
    const onClose = vi.fn()
    render(<ProductForm onSubmit={vi.fn()} onClose={onClose} />)

    fireEvent.click(screen.getByRole('button', { name: /закрыть/i }))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('adds a new variant row when Add variant is clicked', () => {
    render(<ProductForm onSubmit={vi.fn()} onClose={vi.fn()} />)

    expect(screen.queryByText('Вариант 1')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /добавить вариант/i }))

    expect(screen.getByText('Вариант 1')).toBeInTheDocument()
  })

  it('submits a correctly shaped payload with parsed numbers and filtered attributes', () => {
    const onSubmit = vi.fn()
    render(<ProductForm onSubmit={onSubmit} onClose={vi.fn()} />)

    fireEvent.change(screen.getByPlaceholderText('Название'), { target: { value: 'New Product' } })
    fireEvent.change(screen.getByPlaceholderText('Базовая цена'), { target: { value: '15' } })
    fireEvent.click(screen.getByRole('button', { name: /добавить вариант/i }))
    fireEvent.change(screen.getByPlaceholderText('SKU'), { target: { value: 'NEW-SKU-1' } })
    fireEvent.change(screen.getByPlaceholderText('Остаток'), { target: { value: '7' } })
    fireEvent.click(screen.getByRole('button', { name: /добавить атрибут/i }))
    fireEvent.change(screen.getByPlaceholderText('Ключ'), { target: { value: 'color' } })
    fireEvent.change(screen.getByPlaceholderText('Значение'), { target: { value: 'red' } })

    fireEvent.click(screen.getByRole('button', { name: /сохранить/i }))

    expect(onSubmit).toHaveBeenCalledWith({
      id: undefined,
      name: 'New Product',
      description: null,
      category: null,
      basePrice: 15,
      active: true,
      variants: [
        {
          id: undefined,
          sku: 'NEW-SKU-1',
          priceOverride: null,
          stockQuantity: 7,
          active: true,
          attributes: { color: 'red' },
        },
      ],
    })
  })

  it('removes a variant when Remove variant is clicked', () => {
    render(<ProductForm product={existingProduct} onSubmit={vi.fn()} onClose={vi.fn()} />)

    expect(screen.getByDisplayValue('TUM-BLK-500')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /удалить вариант/i }))

    expect(screen.queryByDisplayValue('TUM-BLK-500')).not.toBeInTheDocument()
  })
})
