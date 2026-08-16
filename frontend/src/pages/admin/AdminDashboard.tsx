import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useCatalog from '../../hooks/useCatalog'
import useAuthStore from '../../store/useAuthStore'
import ProductForm from '../../components/admin/ProductForm'
import { createProduct, deleteProduct, updateProduct } from '../../api/adminCatalog'
import type { ProductDto } from '../../types/catalog'
import type { ProductPayload } from '../../types/admin'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const clearToken = useAuthStore((state) => state.clearToken)
  const { products, loading, error, refetch } = useCatalog()

  const [editingProduct, setEditingProduct] = useState<ProductDto | undefined>(undefined)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const handleLogout = () => {
    clearToken()
    navigate('/admin/login', { replace: true })
  }

  const openCreateForm = () => {
    setEditingProduct(undefined)
    setIsFormOpen(true)
  }

  const openEditForm = (product: ProductDto) => {
    setEditingProduct(product)
    setIsFormOpen(true)
  }

  const closeForm = () => {
    setIsFormOpen(false)
    setActionError(null)
  }

  const handleSubmit = async (payload: ProductPayload) => {
    setIsSubmitting(true)
    setActionError(null)
    try {
      if (payload.id) {
        await updateProduct(payload.id, payload)
      } else {
        await createProduct(payload)
      }
      setIsFormOpen(false)
      refetch()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Не удалось сохранить товар.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (product: ProductDto) => {
    setActionError(null)
    try {
      await deleteProduct(product.id)
      refetch()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Не удалось удалить товар.')
    }
  }

  return (
    <div className="min-h-screen bg-white px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between border-b border-ink/10 pb-4">
          <h1 className="font-grotesk text-xl font-semibold text-ink">Админ-панель</h1>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={openCreateForm}
              className="rounded-pill bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-bubblegum-dark"
            >
              Добавить товар
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-pill bg-silver px-4 py-2 text-sm font-medium text-ink hover:bg-silver-dark"
            >
              Выйти
            </button>
          </div>
        </div>

        {actionError && <p className="mt-4 text-sm text-red-500">{actionError}</p>}
        {loading && <p className="mt-4 text-ink/60">Загрузка товаров...</p>}
        {error && <p className="mt-4 text-red-500">{error}</p>}

        {!loading && !error && (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-ink/10 text-xs uppercase tracking-wide text-ink/50">
                  <th className="py-2 pr-4">Товар</th>
                  <th className="py-2 pr-4">Категория</th>
                  <th className="py-2 pr-4">Цена</th>
                  <th className="py-2 pr-4">SKU</th>
                  <th className="py-2 pr-4">Атрибуты</th>
                  <th className="py-2 pr-4">Остаток</th>
                  <th className="py-2 pr-4">Статус</th>
                  <th className="py-2">Действия</th>
                </tr>
              </thead>
              <tbody>
                {products.flatMap((product) =>
                  product.variants.length > 0
                    ? product.variants.map((variant) => (
                        <tr key={variant.id} className="border-b border-ink/5">
                          <td className="py-2 pr-4 text-ink">{product.name}</td>
                          <td className="py-2 pr-4 text-ink/70">{product.category ?? '—'}</td>
                          <td className="py-2 pr-4 text-ink/70">${product.basePrice.toFixed(2)}</td>
                          <td className="py-2 pr-4 text-ink/70">{variant.sku}</td>
                          <td className="py-2 pr-4 text-ink/70">
                            {Object.entries(variant.attributes)
                              .map(([key, value]) => `${key}: ${value}`)
                              .join(', ')}
                          </td>
                          <td className="py-2 pr-4 text-ink/70">{variant.stockQuantity}</td>
                          <td className="py-2 pr-4 text-ink/70">
                            {variant.status === 'PRE_ORDER' ? 'Предзаказ' : 'В наличии'}
                          </td>
                          <td className="py-2">
                            <button
                              type="button"
                              onClick={() => openEditForm(product)}
                              className="mr-3 text-xs text-bubblegum-dark hover:underline"
                            >
                              Изменить
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(product)}
                              className="text-xs text-ink/40 hover:text-bubblegum-dark"
                            >
                              Удалить
                            </button>
                          </td>
                        </tr>
                      ))
                    : [
                        <tr key={product.id} className="border-b border-ink/5">
                          <td className="py-2 pr-4 text-ink">{product.name}</td>
                          <td className="py-2 pr-4 text-ink/70">{product.category ?? '—'}</td>
                          <td className="py-2 pr-4 text-ink/70">${product.basePrice.toFixed(2)}</td>
                          <td className="py-2 pr-4 text-ink/40" colSpan={4}>
                            Нет вариантов
                          </td>
                          <td className="py-2">
                            <button
                              type="button"
                              onClick={() => openEditForm(product)}
                              className="mr-3 text-xs text-bubblegum-dark hover:underline"
                            >
                              Изменить
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(product)}
                              className="text-xs text-ink/40 hover:text-bubblegum-dark"
                            >
                              Удалить
                            </button>
                          </td>
                        </tr>,
                      ]
                )}
              </tbody>
            </table>

            {products.length === 0 && <p className="mt-4 text-ink/60">Товары не найдены.</p>}
          </div>
        )}
      </div>

      {isFormOpen && (
        <ProductForm
          product={editingProduct}
          onSubmit={handleSubmit}
          onClose={closeForm}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  )
}
