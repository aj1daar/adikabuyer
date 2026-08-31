import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ProductForm from '../../../components/admin/ProductForm'
import uploadMedia from '../../../api/media'
import type { ProductDto } from '../../../types/catalog'

vi.mock('../../../api/media', () => ({
  default: vi.fn(),
}))

const mockedUploadMedia = vi.mocked(uploadMedia)

const existingProduct: ProductDto = {
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
      id: 10,
      productId: 1,
      sku: 'TUM-BLK-500',
      imageUrls: [],
      attributes: { color: 'black' },
      priceOverride: 22.5,
      displayPrice: 22.5,
      stockQuantity: 4,
      active: true,
      status: 'IN_STOCK',
    },
  ],
}

const fillFirstVariant = (sku: string, price: string) => {
  fireEvent.click(screen.getByRole('button', { name: /добавить вариант/i }))
  fireEvent.change(screen.getByPlaceholderText('Артикул / SKU (необязательно)'), {
    target: { value: sku },
  })
  fireEvent.change(screen.getByPlaceholderText('Закупочная цена'), { target: { value: price } })
}

beforeEach(() => {
  mockedUploadMedia.mockReset()
})

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
    expect(screen.getByRole('button', { name: 'Цвет' })).toBeInTheDocument()
  })

  it('shows the value placeholder when a loaded variant has a legacy value outside the known list', () => {
    render(<ProductForm product={existingProduct} onSubmit={vi.fn()} onClose={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Значение' })).toBeInTheDocument()
  })

  it('disables submit until name is filled and at least one priced variant exists', () => {
    render(<ProductForm onSubmit={vi.fn()} onClose={vi.fn()} />)

    expect(screen.getByRole('button', { name: /сохранить/i })).toBeDisabled()

    fireEvent.change(screen.getByPlaceholderText('Название'), { target: { value: 'New Product' } })
    expect(screen.getByRole('button', { name: /сохранить/i })).toBeDisabled()

    fillFirstVariant('NEW-SKU-1', '15')
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
    fillFirstVariant('NEW-SKU-1', '15')
    fireEvent.change(screen.getByPlaceholderText('Остаток'), { target: { value: '7' } })
    fireEvent.click(screen.getByRole('button', { name: /добавить атрибут/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Атрибут' }))
    fireEvent.click(screen.getByRole('button', { name: 'Цвет' }))
    fireEvent.click(screen.getByRole('button', { name: 'Значение' }))
    fireEvent.click(screen.getByRole('button', { name: 'Чёрный' }))

    fireEvent.click(screen.getByRole('button', { name: /сохранить/i }))

    expect(onSubmit).toHaveBeenCalledWith({
      id: undefined,
      name: 'New Product',
      description: null,
      category: null,
      active: true,
      colorSwatches: {},
      variants: [
        {
          id: undefined,
          sku: 'NEW-SKU-1',
          priceOverride: 15,
          stockQuantity: 7,
          active: true,
          imageUrls: [],
          status: 'IN_STOCK',
          attributes: { color: 'Чёрный' },
        },
      ],
    })
  })

  it('submits a preset attribute value chosen from the dropdown', () => {
    const onSubmit = vi.fn()
    render(<ProductForm onSubmit={onSubmit} onClose={vi.fn()} />)

    fireEvent.change(screen.getByPlaceholderText('Название'), { target: { value: 'New Product' } })
    fillFirstVariant('NEW-SKU-1', '15')
    fireEvent.click(screen.getByRole('button', { name: /добавить атрибут/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Атрибут' }))
    fireEvent.click(screen.getByRole('button', { name: 'Цвет' }))
    fireEvent.click(screen.getByRole('button', { name: 'Значение' }))
    fireEvent.click(screen.getByRole('button', { name: 'Леопардовый' }))

    fireEvent.click(screen.getByRole('button', { name: /сохранить/i }))

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        variants: [expect.objectContaining({ attributes: { color: 'Леопардовый' } })],
      })
    )
  })

  it('resets the attribute value when a different attribute key is chosen', () => {
    render(<ProductForm onSubmit={vi.fn()} onClose={vi.fn()} />)

    fillFirstVariant('NEW-SKU-1', '15')
    fireEvent.click(screen.getByRole('button', { name: /добавить атрибут/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Атрибут' }))
    fireEvent.click(screen.getByRole('button', { name: 'Цвет' }))
    fireEvent.click(screen.getByRole('button', { name: 'Значение' }))
    fireEvent.click(screen.getByRole('button', { name: 'Розовый' }))

    fireEvent.click(screen.getByRole('button', { name: 'Цвет' }))
    fireEvent.click(screen.getByRole('button', { name: 'Размер' }))

    expect(screen.getByRole('button', { name: 'Значение' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Розовый' })).not.toBeInTheDocument()
  })

  it('shows a number input for the volume attribute and submits it as a plain number', () => {
    const onSubmit = vi.fn()
    render(<ProductForm onSubmit={onSubmit} onClose={vi.fn()} />)

    fireEvent.change(screen.getByPlaceholderText('Название'), { target: { value: 'New Product' } })
    fillFirstVariant('NEW-SKU-1', '15')
    fireEvent.click(screen.getByRole('button', { name: /добавить атрибут/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Атрибут' }))
    fireEvent.click(screen.getByRole('button', { name: 'Объём' }))
    fireEvent.change(screen.getByPlaceholderText('Объём, мл'), { target: { value: '500' } })

    fireEvent.click(screen.getByRole('button', { name: /сохранить/i }))

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        variants: [expect.objectContaining({ attributes: { volume: '500' } })],
      })
    )
  })

  it('blocks submit and warns when a variant repeats the same attribute key', () => {
    const onSubmit = vi.fn()
    render(<ProductForm onSubmit={onSubmit} onClose={vi.fn()} />)

    fireEvent.change(screen.getByPlaceholderText('Название'), { target: { value: 'New Product' } })
    fillFirstVariant('NEW-SKU-1', '15')

    fireEvent.click(screen.getByRole('button', { name: /добавить атрибут/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Атрибут' }))
    fireEvent.click(screen.getByRole('button', { name: 'Объём' }))
    fireEvent.change(screen.getByPlaceholderText('Объём, мл'), { target: { value: '591' } })

    fireEvent.click(screen.getByRole('button', { name: /добавить атрибут/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Атрибут' }))
    fireEvent.click(screen.getAllByRole('button', { name: 'Объём' }).at(-1)!)

    fireEvent.click(screen.getByRole('button', { name: /сохранить/i }))

    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByText(/добавлен дважды/i)).toBeInTheDocument()
  })

  it('lets the admin add a custom attribute key and value not on the preset lists', () => {
    const onSubmit = vi.fn()
    render(<ProductForm onSubmit={onSubmit} onClose={vi.fn()} />)

    fireEvent.change(screen.getByPlaceholderText('Название'), { target: { value: 'New Product' } })
    fillFirstVariant('NEW-SKU-1', '15')
    fireEvent.click(screen.getByRole('button', { name: /добавить атрибут/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Атрибут' }))
    fireEvent.click(screen.getByRole('button', { name: '+ Другой атрибут' }))
    fireEvent.change(screen.getByPlaceholderText('Название атрибута'), { target: { value: 'материал' } })
    fireEvent.change(screen.getByPlaceholderText('Значение'), { target: { value: 'хлопок' } })

    fireEvent.click(screen.getByRole('button', { name: /сохранить/i }))

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        variants: [expect.objectContaining({ attributes: { материал: 'хлопок' } })],
      })
    )
  })

  it('returns to the preset attribute list when Список is clicked from custom-attribute mode', () => {
    render(<ProductForm onSubmit={vi.fn()} onClose={vi.fn()} />)

    fillFirstVariant('NEW-SKU-1', '15')
    fireEvent.click(screen.getByRole('button', { name: /добавить атрибут/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Атрибут' }))
    fireEvent.click(screen.getByRole('button', { name: '+ Другой атрибут' }))

    fireEvent.click(screen.getByRole('button', { name: 'Список' }))

    expect(screen.getByRole('button', { name: 'Атрибут' })).toBeInTheDocument()
  })

  it('submits PRE_ORDER status when Под заказ is selected for a variant', () => {
    const onSubmit = vi.fn()
    render(<ProductForm onSubmit={onSubmit} onClose={vi.fn()} />)

    fireEvent.change(screen.getByPlaceholderText('Название'), { target: { value: 'New Product' } })
    fillFirstVariant('NEW-SKU-1', '15')
    fireEvent.click(screen.getByRole('button', { name: 'Под заказ' }))

    fireEvent.click(screen.getByRole('button', { name: /сохранить/i }))

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        variants: [expect.objectContaining({ status: 'PRE_ORDER', stockQuantity: 0 })],
      })
    )
  })

  it('submits SOLD_OUT status when Солдаут is selected for a variant', () => {
    const onSubmit = vi.fn()
    render(<ProductForm onSubmit={onSubmit} onClose={vi.fn()} />)

    fireEvent.change(screen.getByPlaceholderText('Название'), { target: { value: 'New Product' } })
    fillFirstVariant('NEW-SKU-1', '15')
    fireEvent.click(screen.getByRole('button', { name: 'Солдаут' }))

    fireEvent.click(screen.getByRole('button', { name: /сохранить/i }))

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        variants: [expect.objectContaining({ status: 'SOLD_OUT' })],
      })
    )
  })

  it('forces stock to zero and disables the stock input when Под заказ is selected', () => {
    render(<ProductForm onSubmit={vi.fn()} onClose={vi.fn()} />)

    fillFirstVariant('NEW-SKU-1', '15')
    fireEvent.change(screen.getByPlaceholderText('Остаток'), { target: { value: '12' } })
    fireEvent.click(screen.getByRole('button', { name: 'Под заказ' }))

    expect(screen.getByPlaceholderText('Остаток')).toHaveValue(0)
    expect(screen.getByPlaceholderText('Остаток')).toBeDisabled()
  })

  it('re-enables the stock input when switching back to В наличии', () => {
    render(<ProductForm onSubmit={vi.fn()} onClose={vi.fn()} />)

    fillFirstVariant('NEW-SKU-1', '15')
    fireEvent.click(screen.getByRole('button', { name: 'Под заказ' }))
    fireEvent.click(screen.getByRole('button', { name: 'В наличии' }))

    expect(screen.getByPlaceholderText('Остаток')).toBeEnabled()
  })

  it('removes a variant when Remove variant is clicked', () => {
    render(<ProductForm product={existingProduct} onSubmit={vi.fn()} onClose={vi.fn()} />)

    expect(screen.getByDisplayValue('TUM-BLK-500')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /удалить вариант/i }))

    expect(screen.queryByDisplayValue('TUM-BLK-500')).not.toBeInTheDocument()
  })

  it('disables submit once the last variant is removed', () => {
    render(<ProductForm product={existingProduct} onSubmit={vi.fn()} onClose={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: /удалить вариант/i }))

    expect(screen.getByRole('button', { name: /сохранить/i })).toBeDisabled()
    expect(screen.getByText(/добавьте хотя бы один вариант/i)).toBeInTheDocument()
  })

  it('shows a colour-swatch section and opens the cropper when a swatch photo is picked', () => {
    render(<ProductForm product={existingProduct} onSubmit={vi.fn()} onClose={vi.fn()} />)

    expect(screen.getByText('Кружки цвета')).toBeInTheDocument()

    const input = screen.getByLabelText('Фото цвета black')
    fireEvent.change(input, { target: { files: [new File(['x'], 's.png', { type: 'image/png' })] } })

    expect(screen.getByText('Кружок цвета: black')).toBeInTheDocument()
  })

  it('uploads a variant image and includes it in the submit payload', async () => {
    mockedUploadMedia.mockResolvedValueOnce({ url: 'http://localhost:9000/adikabuyer-media/variant.png' })
    const onSubmit = vi.fn()
    render(<ProductForm product={existingProduct} onSubmit={onSubmit} onClose={vi.fn()} />)

    const input = document.querySelector('input[id$="-variant-0"]') as HTMLInputElement
    fireEvent.change(input, {
      target: { files: [new File(['content'], 'variant.png', { type: 'image/png' })] },
    })

    await waitFor(() =>
      expect(screen.getByAltText('Фото 1 варианта 1')).toHaveAttribute(
        'src',
        'http://localhost:9000/adikabuyer-media/variant.png'
      )
    )

    fireEvent.click(screen.getByRole('button', { name: /сохранить/i }))

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        variants: [
          expect.objectContaining({ imageUrls: ['http://localhost:9000/adikabuyer-media/variant.png'] }),
        ],
      })
    )
  })
})
