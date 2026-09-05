import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useCatalog from '../../hooks/useCatalog'
import useOrders from '../../hooks/useOrders'
import useTelegramAdmins from '../../hooks/useTelegramAdmins'
import useAuthStore from '../../store/useAuthStore'
import ProductForm from '../../components/admin/ProductForm'
import OrdersTable from '../../components/admin/OrdersTable'
import TelegramAdminsTable from '../../components/admin/TelegramAdminsTable'
import ConfirmDialog from '../../components/admin/ConfirmDialog'
import { createProduct, deleteProduct, deleteVariant, updateProduct } from '../../api/adminCatalog'
import { deleteOrder } from '../../api/adminOrders'
import type { ProductDto } from '../../types/catalog'
import type { OrderDto } from '../../types/order'
import type { ProductPayload } from '../../types/admin'
import formatPrice from '../../utils/formatPrice'
import usePageTitle from '../../hooks/usePageTitle'

type AdminTab = 'products' | 'orders' | 'telegram'

const VARIANT_STATUS_LABEL: Record<string, string> = {
  IN_STOCK: 'В наличии',
  PRE_ORDER: 'Предзаказ',
  SOLD_OUT: 'Солдаут',
}

const isArchived = (product: ProductDto) =>
  product.variants.length > 0 && product.variants.every((variant) => variant.status === 'SOLD_OUT')

type PendingDelete =
  | { kind: 'product'; product: ProductDto; title: string; message: string }
  | {
      kind: 'variant'
      product: ProductDto
      variant: ProductDto['variants'][number]
      title: string
      message: string
    }

export default function AdminDashboard() {
  usePageTitle('Админ-панель')
  const navigate = useNavigate()
  const clearToken = useAuthStore((state) => state.clearToken)
  const { products, loading, error, refetch } = useCatalog({ includeArchived: true })

  const [activeTab, setActiveTab] = useState<AdminTab>('products')
  const {
    orders,
    loading: ordersLoading,
    error: ordersError,
    refetch: refetchOrders,
  } = useOrders(activeTab === 'orders')
  const {
    admins: telegramAdmins,
    loading: telegramAdminsLoading,
    error: telegramAdminsError,
  } = useTelegramAdmins(activeTab === 'telegram')

  const [editingProduct, setEditingProduct] = useState<ProductDto | undefined>(undefined)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

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

  // nothing is deleted until it goes through ConfirmDialog — one stray click used to take
  // a whole product (and every variant under it) with no way back
  const requestProductDelete = (product: ProductDto) =>
    setPendingDelete({
      kind: 'product',
      product,
      title: 'Удалить товар?',
      message:
        `Товар «${product.name}»` +
        (product.variants.length > 0
          ? ` и все его варианты (${product.variants.length}) будут удалены навсегда, вместе с их фото.`
          : ' будет удалён навсегда.'),
    })

  const requestVariantDelete = (product: ProductDto, variant: ProductDto['variants'][number]) =>
    setPendingDelete({
      kind: 'variant',
      product,
      variant,
      title: 'Удалить вариант?',
      message:
        `Вариант «${variant.sku}» товара «${product.name}» будет удалён навсегда, вместе с его фото. ` +
        `Остальные варианты (${product.variants.length - 1}) останутся.`,
    })

  const confirmDelete = async () => {
    if (!pendingDelete) {
      return
    }
    setActionError(null)
    setIsDeleting(true)
    try {
      if (pendingDelete.kind === 'product') {
        await deleteProduct(pendingDelete.product.id)
      } else {
        await deleteVariant(pendingDelete.product.id, pendingDelete.variant.id)
      }
      setPendingDelete(null)
      refetch()
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : pendingDelete.kind === 'product'
            ? 'Не удалось удалить товар.'
            : 'Не удалось удалить вариант.'
      )
      setPendingDelete(null)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteOrder = async (order: OrderDto) => {
    setActionError(null)
    try {
      await deleteOrder(order.id)
      refetchOrders()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Не удалось удалить заказ.')
    }
  }

  return (
    <div className="min-h-screen bg-white px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between border-b-2 border-black pb-4">
          <h1 className="font-grotesk text-xl font-bold text-ink">Админ-панель</h1>
          <div className="flex items-center gap-3">
            {activeTab === 'products' && (
              <button
                type="button"
                onClick={openCreateForm}
                className="rounded-pill border-2 border-black bg-ink px-4 py-2 font-grotesk text-sm font-bold text-white hover:bg-bubblegum-dark"
              >
                Добавить товар
              </button>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-pill border-2 border-black bg-silver px-4 py-2 font-grotesk text-sm font-bold text-ink hover:bg-bubblegum hover:text-white"
            >
              Выйти
            </button>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('products')}
            aria-pressed={activeTab === 'products'}
            className={`rounded-pill border-2 border-black px-4 py-2 font-grotesk text-sm font-bold transition ${
              activeTab === 'products' ? 'bg-ink text-white' : 'bg-white text-ink hover:bg-bubblegum hover:text-white'
            }`}
          >
            Товары
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            aria-pressed={activeTab === 'orders'}
            className={`rounded-pill border-2 border-black px-4 py-2 font-grotesk text-sm font-bold transition ${
              activeTab === 'orders' ? 'bg-ink text-white' : 'bg-white text-ink hover:bg-bubblegum hover:text-white'
            }`}
          >
            Заказы
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('telegram')}
            aria-pressed={activeTab === 'telegram'}
            className={`rounded-pill border-2 border-black px-4 py-2 font-grotesk text-sm font-bold transition ${
              activeTab === 'telegram' ? 'bg-ink text-white' : 'bg-white text-ink hover:bg-bubblegum hover:text-white'
            }`}
          >
            Telegram
          </button>
        </div>

        {actionError && <p className="mt-4 text-sm text-red-500">{actionError}</p>}

        {activeTab === 'orders' && (
          <OrdersTable orders={orders} loading={ordersLoading} error={ordersError} onDelete={handleDeleteOrder} />
        )}

        {activeTab === 'telegram' && (
          <TelegramAdminsTable admins={telegramAdmins} loading={telegramAdminsLoading} error={telegramAdminsError} />
        )}

        {activeTab === 'products' && loading && products.length === 0 && (
          <p className="mt-4 text-ink/60">Загрузка товаров...</p>
        )}
        {activeTab === 'products' && error && <p className="mt-4 text-red-500">{error}</p>}

        {activeTab === 'products' && !error && (products.length > 0 || !loading) && (
          <div className={`mt-6 overflow-x-auto ${loading ? 'opacity-60' : ''} transition-opacity`}>
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b-2 border-black font-grotesk text-xs font-bold uppercase tracking-wide text-ink/50">
                  <th className="py-2 pr-4">Товар</th>
                  <th className="py-2 pr-4">Категория</th>
                  <th className="py-2 pr-4">Закупка</th>
                  <th className="py-2 pr-4">Цена клиенту</th>
                  <th className="py-2 pr-4">SKU</th>
                  <th className="py-2 pr-4">Атрибуты</th>
                  <th className="py-2 pr-4">Остаток</th>
                  <th className="py-2 pr-4">Статус</th>
                  <th className="py-2">Действия</th>
                </tr>
              </thead>
              {/* one <tbody> per product: a header row that owns the product-level actions,
                  then its variants indented under it. Variants used to render as loose
                  top-level rows, so a product with N variants read as N separate products —
                  and "Удалить" on any of them quietly took the whole product with it. */}
              {products.map((product) => (
                <tbody key={product.id} className="border-b-2 border-black/10">
                  <tr className="bg-silver/60">
                    <td className="py-2 pr-4 font-grotesk font-bold text-ink" colSpan={4}>
                      {product.name}
                      <span className="ml-2 font-grotesk text-[10px] font-bold uppercase tracking-wide text-ink/50">
                        {product.variants.length === 0
                          ? 'без вариантов'
                          : `вариантов: ${product.variants.length}`}
                      </span>
                      {isArchived(product) && (
                        <span className="ml-2 rounded-pill border border-black bg-white px-2 py-0.5 font-grotesk text-[10px] font-bold uppercase tracking-wide text-ink/60">
                          В архиве
                        </span>
                      )}
                    </td>
                    <td className="py-2 pr-4 text-ink/70" colSpan={4}>
                      {product.category ?? '—'}
                    </td>
                    <td className="py-2">
                      <button
                        type="button"
                        onClick={() => openEditForm(product)}
                        className="mr-3 font-grotesk text-xs font-bold text-bubblegum-dark hover:underline"
                      >
                        Изменить
                      </button>
                      <button
                        type="button"
                        onClick={() => requestProductDelete(product)}
                        className="whitespace-nowrap font-grotesk text-xs font-bold text-ink/50 hover:text-bubblegum-dark"
                      >
                        Удалить товар
                      </button>
                    </td>
                  </tr>

                  {product.variants.length === 0 && (
                    <tr className="border-b border-ink/5">
                      <td className="py-2 pr-4 pl-6 text-ink/40" colSpan={9}>
                        Нет вариантов
                      </td>
                    </tr>
                  )}

                  {product.variants.map((variant) => (
                    <tr key={variant.id} className="border-b border-ink/5">
                      <td className="py-2 pr-4 pl-6 text-ink/50">↳ вариант</td>
                      <td className="py-2 pr-4 text-ink/40">—</td>
                      <td className="py-2 pr-4 text-ink/70">
                        {formatPrice(variant.priceOverride ?? product.basePrice)}
                      </td>
                      <td className="py-2 pr-4 font-grotesk font-bold text-ink">
                        {formatPrice(variant.displayPrice ?? product.displayPrice)}
                      </td>
                      <td className="py-2 pr-4 text-ink/70">{variant.sku}</td>
                      <td className="py-2 pr-4 text-ink/70">
                        {Object.entries(variant.attributes)
                          .map(([key, value]) => `${key}: ${value}`)
                          .join(', ')}
                      </td>
                      <td className="py-2 pr-4 text-ink/70">{variant.stockQuantity}</td>
                      <td className="py-2 pr-4 text-ink/70">
                        {VARIANT_STATUS_LABEL[variant.status] ?? variant.status}
                      </td>
                      <td className="py-2">
                        {product.variants.length > 1 ? (
                          <button
                            type="button"
                            onClick={() => requestVariantDelete(product, variant)}
                            className="whitespace-nowrap text-xs text-ink/40 hover:text-bubblegum-dark"
                          >
                            Удалить вариант
                          </button>
                        ) : (
                          <span
                            title="Последний вариант — удаляется только вместе с товаром"
                            className="whitespace-nowrap text-xs text-ink/25"
                          >
                            Единственный вариант
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              ))}
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

      <ConfirmDialog
        open={pendingDelete !== null}
        title={pendingDelete?.title ?? ''}
        message={pendingDelete?.message ?? ''}
        busy={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  )
}
