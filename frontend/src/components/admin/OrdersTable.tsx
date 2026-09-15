import formatPrice from '../../utils/formatPrice'
import useIsMobileViewport from '../../hooks/useIsMobileViewport'
import type { OrderDto } from '../../types/order'

type OrdersTableProps = {
  orders: OrderDto[]
  loading: boolean
  error: string | null
  onDelete: (order: OrderDto) => void
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function summarizeItems(order: OrderDto): string {
  return order.items
    .map((item) => `${item.quantity}x ${item.productName}`)
    .join(', ')
}

/** `tel:` needs the bare number: keep the leading + and digits only. */
function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`
}

export default function OrdersTable({ orders, loading, error, onDelete }: OrdersTableProps) {
  const isMobile = useIsMobileViewport()

  return (
    <>
      {loading && orders.length === 0 && <p className="mt-4 text-ink/60">Загрузка заказов...</p>}
      {error && <p className="mt-4 text-red-500">{error}</p>}

      {!error && (orders.length > 0 || !loading) && (
        <div className={`mt-6 overflow-x-auto ${loading ? 'opacity-60' : ''} transition-opacity`}>
          {isMobile ? (
            <ul className="flex flex-col gap-4 pb-1 pr-1">
              {orders.map((order) => (
                <li key={order.id} className="rounded-2xl border-2 border-black bg-white p-4 shadow-[4px_4px_0_0_#000]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-words font-grotesk text-base font-bold text-ink">{order.customerName}</p>
                      <p className="mt-0.5 text-xs text-ink/50">{formatDate(order.createdAt)}</p>
                    </div>
                    <p className="shrink-0 rounded-pill border-2 border-black bg-bubblegum-light px-3 py-1 font-grotesk text-sm font-bold text-ink">
                      {formatPrice(order.grandTotal)}
                    </p>
                  </div>

                  <p className="mt-3 break-words text-sm text-ink/70">{summarizeItems(order)}</p>
                  <p className="mt-1 font-grotesk text-xs font-bold uppercase tracking-wide text-ink/50">{order.region}</p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <a
                      href={telHref(order.customerPhone)}
                      className="flex min-h-11 items-center rounded-pill border-2 border-black bg-ink px-4 py-2 font-grotesk text-sm font-bold text-white shadow-[3px_3px_0_0_#E8799F] hover:bg-bubblegum-dark"
                    >
                      {order.customerPhone}
                    </a>
                    <button
                      type="button"
                      onClick={() => onDelete(order)}
                      className="min-h-11 rounded-pill border-2 border-black bg-white px-4 py-2 font-grotesk text-sm font-bold text-ink hover:bg-bubblegum hover:text-white"
                    >
                      Удалить
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b-2 border-black font-grotesk text-xs font-bold uppercase tracking-wide text-ink/50">
                  <th className="py-2 pr-4">Дата</th>
                  <th className="py-2 pr-4">Клиент</th>
                  <th className="py-2 pr-4">Телефон</th>
                  <th className="py-2 pr-4">Город</th>
                  <th className="py-2 pr-4">Товары</th>
                  <th className="py-2 pr-4">Итого</th>
                  <th className="py-2">Действия</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-ink/5">
                    <td className="py-2 pr-4 text-ink/70">{formatDate(order.createdAt)}</td>
                    <td className="py-2 pr-4 text-ink">{order.customerName}</td>
                    <td className="py-2 pr-4 text-ink/70">{order.customerPhone}</td>
                    <td className="py-2 pr-4 text-ink/70">{order.region}</td>
                    <td className="py-2 pr-4 text-ink/70">{summarizeItems(order)}</td>
                    <td className="py-2 pr-4 font-grotesk font-bold text-ink">{formatPrice(order.grandTotal)}</td>
                    <td className="py-2">
                      <button
                        type="button"
                        onClick={() => onDelete(order)}
                        className="relative after:absolute after:-inset-x-1 after:-inset-y-2.5 after:content-[''] text-xs text-ink/40 hover:text-bubblegum-dark"
                      >
                        Удалить
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {orders.length === 0 && <p className="mt-4 text-ink/60">Заказов пока нет.</p>}
        </div>
      )}
    </>
  )
}
