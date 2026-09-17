import { useState } from 'react'
import formatPrice from '../../utils/formatPrice'
import ConfirmDialog from './ConfirmDialog'
import type { OrderDto, OrderUpdatePayload } from '../../types/order'
import {
  ORDER_FILTERS,
  ORDER_NEXT_ACTION,
  ORDER_STATUS_BADGE,
  ORDER_STATUS_LABEL,
  isFinalStatus,
  matchesOrderFilter,
  nextStatus,
  type OrderFilter,
} from '../../utils/orderStatus'

type OrdersTableProps = {
  orders: OrderDto[]
  loading: boolean
  error: string | null
  /** resolves true when the change was saved */
  onUpdate: (order: OrderDto, payload: OrderUpdatePayload) => Promise<boolean>
  onDelete: (order: OrderDto) => Promise<void> | void
}

type PendingConfirm = { kind: 'cancel' | 'delete'; order: OrderDto }

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
  return order.items.map((item) => `${item.quantity}x ${item.productName}`).join(', ')
}

/** `tel:` needs the bare number: keep the leading + and digits only. */
function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`
}

type OrderDetailsFormProps = {
  order: OrderDto
  onSave: (payload: OrderUpdatePayload) => Promise<boolean>
  onClose: () => void
}

function OrderDetailsForm({ order, onSave, onClose }: OrderDetailsFormProps) {
  const [weightFee, setWeightFee] = useState(order.weightFee == null ? '' : String(order.weightFee))
  const [note, setNote] = useState(order.adminNote ?? '')
  const [saving, setSaving] = useState(false)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    const payload: OrderUpdatePayload = { adminNote: note }
    if (weightFee.trim() !== '') {
      payload.weightFee = Number(weightFee)
    }
    const saved = await onSave(payload)
    setSaving(false)
    if (saved) {
      onClose()
    }
  }

  return (
    <form onSubmit={submit} className="mt-3 flex flex-col gap-3 rounded-2xl border-2 border-black bg-silver/60 p-3">
      <label className="flex flex-col gap-1">
        <span className="font-grotesk text-xs font-bold uppercase tracking-wide text-ink/60">Вес посылки, KGS</span>
        <input
          type="number"
          inputMode="numeric"
          min={0}
          step="1"
          value={weightFee}
          onChange={(event) => setWeightFee(event.target.value)}
          placeholder="Согласованная сумма за вес"
          className="min-h-11 rounded-pill border-2 border-black bg-white px-4 font-grotesk text-base font-semibold text-ink outline-none focus:border-bubblegum-dark sm:text-sm"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="font-grotesk text-xs font-bold uppercase tracking-wide text-ink/60">Заметка</span>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          maxLength={1000}
          rows={3}
          placeholder="Что договорились с клиентом"
          className="rounded-2xl border-2 border-black bg-white px-4 py-2 font-grotesk text-base text-ink outline-none focus:border-bubblegum-dark sm:text-sm"
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={saving}
          className="min-h-11 rounded-pill border-2 border-black bg-ink px-5 font-grotesk text-sm font-bold text-white shadow-[3px_3px_0_0_#E8799F] hover:bg-bubblegum-dark disabled:opacity-40"
        >
          {saving ? 'Сохраняем...' : 'Сохранить'}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="min-h-11 rounded-pill border-2 border-black bg-white px-5 font-grotesk text-sm font-bold text-ink hover:bg-silver"
        >
          Отмена
        </button>
      </div>
    </form>
  )
}

/**
 * The Заказы tab: one Neo-Y2K card per order with its number, status sticker and the next
 * step one tap away, a status filter on top, and an inline editor for the agreed weight fee
 * and a note. Cancelling (which returns the stock) and deleting both ask first.
 */
export default function OrdersTable({ orders, loading, error, onUpdate, onDelete }: OrdersTableProps) {
  const [filter, setFilter] = useState<OrderFilter>('all')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [pending, setPending] = useState<PendingConfirm | null>(null)

  const visible = orders.filter((order) => matchesOrderFilter(order.status, filter))

  const advance = async (order: OrderDto) => {
    const next = nextStatus(order.status)
    if (!next) {
      return
    }
    setBusyId(order.id)
    await onUpdate(order, { status: next })
    setBusyId(null)
  }

  const confirmPending = async () => {
    if (!pending) {
      return
    }
    setBusyId(pending.order.id)
    if (pending.kind === 'cancel') {
      await onUpdate(pending.order, { status: 'CANCELLED' })
    } else {
      await onDelete(pending.order)
    }
    setBusyId(null)
    setPending(null)
  }

  return (
    <>
      {loading && orders.length === 0 && <p className="mt-4 text-ink/60">Загрузка заказов...</p>}
      {error && <p className="mt-4 text-red-500">{error}</p>}

      {!error && (orders.length > 0 || !loading) && (
        <div className={`mt-6 ${loading ? 'opacity-60' : ''} transition-opacity`}>
          <div role="group" aria-label="Фильтр заказов" className="mb-4 flex flex-wrap gap-2">
            {ORDER_FILTERS.map((option) => {
              const count = orders.filter((order) => matchesOrderFilter(order.status, option.value)).length
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={filter === option.value}
                  onClick={() => setFilter(option.value)}
                  className={`min-h-11 rounded-pill border-2 border-black px-4 font-grotesk text-sm font-bold transition ${
                    filter === option.value ? 'bg-ink text-white' : 'bg-white text-ink hover:bg-bubblegum hover:text-white'
                  }`}
                >
                  {option.label} ({count})
                </button>
              )
            })}
          </div>

          <ul className="grid grid-cols-1 gap-4 pb-1 pr-1 lg:grid-cols-2">
            {visible.map((order) => {
              const next = nextStatus(order.status)
              const busy = busyId === order.id
              return (
                <li key={order.id} className="flex flex-col rounded-2xl border-2 border-black bg-white p-4 shadow-[4px_4px_0_0_#000]">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-pill border-2 border-black bg-white px-3 py-0.5 font-grotesk text-sm font-bold text-ink">
                      №{order.number}
                    </span>
                    <span
                      className={`rounded-pill border-2 border-black px-3 py-0.5 font-grotesk text-xs font-bold uppercase tracking-wide ${ORDER_STATUS_BADGE[order.status]}`}
                    >
                      {ORDER_STATUS_LABEL[order.status]}
                    </span>
                    <span className="ml-auto text-xs text-ink/50">{formatDate(order.createdAt)}</span>
                  </div>

                  <div className="mt-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-words font-grotesk text-base font-bold text-ink">{order.customerName}</p>
                      <a href={telHref(order.customerPhone)} className="font-grotesk text-sm font-bold text-bubblegum-dark underline-offset-4 hover:underline">
                        {order.customerPhone}
                      </a>
                      <p className="mt-0.5 font-grotesk text-xs font-bold uppercase tracking-wide text-ink/50">{order.region}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="rounded-pill border-2 border-black bg-bubblegum-light px-3 py-1 font-grotesk text-sm font-bold text-ink">
                        {formatPrice(order.finalTotal ?? order.grandTotal)}
                      </p>
                      <p className="mt-1 text-xs text-ink/50">
                        {order.weightFee == null ? 'без учёта веса' : `вкл. вес ${formatPrice(order.weightFee)}`}
                      </p>
                    </div>
                  </div>

                  <p className="mt-3 break-words text-sm text-ink/70">{summarizeItems(order)}</p>
                  {order.adminNote && (
                    <p className="mt-2 break-words rounded-xl border-2 border-dashed border-black/30 px-3 py-2 text-sm text-ink/80">
                      {order.adminNote}
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap gap-2">
                    {next && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => advance(order)}
                        className="min-h-11 rounded-pill border-2 border-black bg-ink px-4 font-grotesk text-sm font-bold text-white shadow-[3px_3px_0_0_#E8799F] hover:bg-bubblegum-dark disabled:opacity-40"
                      >
                        → {ORDER_NEXT_ACTION[order.status]}
                      </button>
                    )}
                    <button
                      type="button"
                      aria-expanded={editingId === order.id}
                      onClick={() => setEditingId(editingId === order.id ? null : order.id)}
                      className="min-h-11 rounded-pill border-2 border-black bg-white px-4 font-grotesk text-sm font-bold text-ink hover:bg-silver"
                    >
                      Вес и заметка
                    </button>
                    {!isFinalStatus(order.status) && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setPending({ kind: 'cancel', order })}
                        className="min-h-11 rounded-pill border-2 border-black bg-white px-4 font-grotesk text-sm font-bold text-ink hover:bg-bubblegum hover:text-white disabled:opacity-40"
                      >
                        Отменить
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setPending({ kind: 'delete', order })}
                      className="min-h-11 rounded-pill border-2 border-black/30 bg-white px-4 font-grotesk text-sm font-bold text-ink/60 hover:border-black hover:text-bubblegum-dark disabled:opacity-40"
                    >
                      Удалить
                    </button>
                  </div>

                  {editingId === order.id && (
                    <OrderDetailsForm
                      order={order}
                      onSave={(payload) => onUpdate(order, payload)}
                      onClose={() => setEditingId(null)}
                    />
                  )}
                </li>
              )
            })}
          </ul>

          {orders.length === 0 && <p className="mt-4 text-ink/60">Заказов пока нет.</p>}
          {orders.length > 0 && visible.length === 0 && <p className="mt-4 text-ink/60">В этом разделе заказов нет.</p>}
        </div>
      )}

      <ConfirmDialog
        open={pending !== null}
        title={pending?.kind === 'cancel' ? `Отменить заказ №${pending.order.number}?` : `Удалить заказ №${pending?.order.number ?? ''}?`}
        message={
          pending?.kind === 'cancel'
            ? 'Заказ получит статус «Отменён», а его товары вернутся в наличие.'
            : pending && !isFinalStatus(pending.order.status)
              ? 'Заказ исчезнет из списка навсегда, а его товары вернутся в наличие.'
              : 'Заказ исчезнет из списка навсегда.'
        }
        confirmLabel={pending?.kind === 'cancel' ? 'Отменить заказ' : 'Удалить'}
        busy={busyId !== null}
        onConfirm={confirmPending}
        onCancel={() => setPending(null)}
      />
    </>
  )
}
