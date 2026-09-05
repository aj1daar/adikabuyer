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

/** Drops one variant, keeping the product. Rejected by the backend for the last variant. */
export async function deleteVariant(productId: number, variantId: number): Promise<ProductDto> {
  const response = await catalogClient.delete<ProductDto>(`/products/${productId}/variants/${variantId}`)
  return response.data
}
