import catalogClient from './catalogClient'
import type { ProductPayload } from '../types/admin'
import type { ProductDto } from '../types/catalog'

export async function createProduct(payload: ProductPayload): Promise<ProductDto> {
  const response = await catalogClient.post<ProductDto>('/products', payload)
  return response.data
}

export async function updateProduct(id: number, payload: ProductPayload): Promise<ProductDto> {
  const response = await catalogClient.put<ProductDto>(`/products/${id}`, payload)
  return response.data
}

export async function deleteProduct(id: number): Promise<void> {
  await catalogClient.delete(`/products/${id}`)
}
