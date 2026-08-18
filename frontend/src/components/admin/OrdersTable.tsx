import formatPrice from '../../utils/formatPrice'
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

export default function OrdersTable({ orders, loading, error, onDelete }: OrdersTableProps) {
  return (
    <>
      {loading && orders.length === 0 && <p className="mt-4 text-ink/60">Загрузка заказов...</p>}
      {error && <p className="mt-4 text-red-500">{error}</p>}

      {!error && (orders.length > 0 || !loading) && (
        <div className={`mt-6 overflow-x-auto ${loading ? 'opacity-60' : ''} transition-opacity`}>
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
                      className="text-xs text-ink/40 hover:text-bubblegum-dark"
                    >
                      Удалить
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {orders.length === 0 && <p className="mt-4 text-ink/60">Заказов пока нет.</p>}
        </div>
      )}
    </>
  )
}
