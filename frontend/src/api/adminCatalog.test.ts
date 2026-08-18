import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createProduct, updateProduct, deleteProduct } from './adminCatalog'
import catalogClient from './catalogClient'
import type { ProductPayload } from '../types/admin'
import type { ProductDto } from '../types/catalog'

vi.mock('./catalogClient', () => ({
  default: { post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

const mockedPost = vi.mocked(catalogClient.post)
const mockedPut = vi.mocked(catalogClient.put)
const mockedDelete = vi.mocked(catalogClient.delete)

const payload: ProductPayload = {
  name: 'Custom Tumbler',
  description: null,
  category: null,
  basePrice: 25,
  active: true,
  imageUrl: null,
  variants: [],
}

const product: ProductDto = {
  id: 1,
  name: 'Custom Tumbler',
  description: null,
  category: null,
  basePrice: 25,
  displayPrice: 25,
  active: true,
  imageUrl: null,
  variants: [],
}

beforeEach(() => {
  mockedPost.mockReset()
  mockedPut.mockReset()
  mockedDelete.mockReset()
})

describe('createProduct', () => {
  it('posts the payload to /products and resolves with the response data', async () => {
    mockedPost.mockResolvedValueOnce({ data: product } as never)

    const result = await createProduct(payload)

    expect(mockedPost).toHaveBeenCalledWith('/products', payload)
    expect(result).toEqual(product)
  })
})

describe('updateProduct', () => {
  it('puts the payload to /products/:id and resolves with the response data', async () => {
    mockedPut.mockResolvedValueOnce({ data: product } as never)

    const result = await updateProduct(1, payload)

    expect(mockedPut).toHaveBeenCalledWith('/products/1', payload)
    expect(result).toEqual(product)
  })
})

describe('deleteProduct', () => {
  it('sends a delete request to /products/:id', async () => {
    mockedDelete.mockResolvedValueOnce({} as never)

    await deleteProduct(1)

    expect(mockedDelete).toHaveBeenCalledWith('/products/1')
  })
})
