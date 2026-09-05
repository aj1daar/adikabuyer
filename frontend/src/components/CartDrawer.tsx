import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import useCartStore, { type CartItem } from '../store/useCartStore'
import submitCheckout from '../api/checkout'
import formatPrice from '../utils/formatPrice'
import resolveDeliveryFee, { COURIER, DELIVERY_OPTIONS, PICKUP } from '../utils/deliveryFee'
import WeightTariffNote from './WeightTariffNote'
import { popIn } from '../utils/motion'

type DeliveryMode = 'together' | 'separate'

const toCheckoutItems = (list: CartItem[]) =>
  list.map((item) => ({
    variantId: item.variantId,
    productName: item.productName,
    sku: item.sku,
    attributes: item.attributes,
    unitPrice: item.unitPrice,
    quantity: item.quantity,
  }))

type CartItemRowProps = {
  item: CartItem
  onChangeQuantity: (variantId: number, delta: number) => void
  onRemove: (variantId: number) => void
}

function CartItemRow({ item, onChangeQuantity, onRemove }: CartItemRowProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9, y: -8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, height: 0, marginTop: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}
      transition={{ type: 'spring', stiffness: 340, damping: 20 }}
      className="flex items-center justify-between gap-3 overflow-hidden border-b border-ink/10 py-3">
      <div>
        <p className="font-grotesk text-sm font-bold text-ink">{item.productName}</p>
        <p className="text-xs text-ink/50">
          {Object.values(item.attributes).join(', ')}
        </p>
        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            onClick={() => onChangeQuantity(item.variantId, -1)}
            disabled={item.quantity <= 1}
            aria-label="Уменьшить количество"
            className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-black bg-white font-grotesk text-base font-bold text-ink transition hover:bg-bubblegum hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
          >
            −
          </button>
          <span className="min-w-6 text-center font-grotesk text-sm font-bold text-ink">
            {item.quantity}
          </span>
          <button
            type="button"
            onClick={() => onChangeQuantity(item.variantId, 1)}
            aria-label="Увеличить количество"
            className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-black bg-white font-grotesk text-base font-bold text-ink transition hover:bg-bubblegum hover:text-white"
          >
            +
          </button>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-grotesk text-sm font-bold text-ink">
          {formatPrice(item.unitPrice * item.quantity)}
        </span>
        <button
          type="button"
          onClick={() => onRemove(item.variantId)}
          className="-m-3 p-3 font-grotesk text-xs font-bold text-ink/40 transition hover:text-bubblegum-dark"
        >
          Удалить
        </button>
      </div>
    </motion.div>
  )
}

export default function CartDrawer() {
  const items = useCartStore((state) => state.items)
  const isOpen = useCartStore((state) => state.isOpen)
  const closeCart = useCartStore((state) => state.closeCart)
  const removeItem = useCartStore((state) => state.removeItem)
  const changeQuantity = useCartStore((state) => state.changeQuantity)
  const clearCart = useCartStore((state) => state.clearCart)
  const totalPrice = useCartStore((state) => state.totalPrice())

  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  // Two ways to get the order and no city to guess — start on the courier, the option
  // that actually costs money, so the total is never quietly optimistic.
  const [region, setRegion] = useState<string>(COURIER)
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>('together')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isSubmittingRef = useRef(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [orderPlaced, setOrderPlaced] = useState(false)

  const inStockItems = items.filter((item) => item.status !== 'PRE_ORDER')
  const preOrderItems = items.filter((item) => item.status === 'PRE_ORDER')
  const hasBothGroups = inStockItems.length > 0 && preOrderItems.length > 0

  useEffect(() => {
    if (!isOpen) {
      return
    }
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [isOpen])

  const canCheckout =
    items.length > 0 && customerName.trim() !== '' && customerPhone.trim() !== '' && region.trim() !== ''

  const isSplitDelivery = hasBothGroups && deliveryMode === 'separate'
  const singleDeliveryFee = region ? resolveDeliveryFee(region) : 0
  const deliveryFee = isSplitDelivery ? singleDeliveryFee * 2 : singleDeliveryFee
  const deliveryLabel = region === PICKUP ? 'Самовывоз' : 'Доставка'
  const grandTotal = totalPrice + deliveryFee

  const handleCheckout = async () => {
    if (!canCheckout || isSubmittingRef.current) {
      return
    }

    isSubmittingRef.current = true
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      if (isSplitDelivery) {
        await Promise.all([
          submitCheckout({ customerName, customerPhone, region, items: toCheckoutItems(inStockItems) }),
          submitCheckout({ customerName, customerPhone, region, items: toCheckoutItems(preOrderItems) }),
        ])
      } else {
        await submitCheckout({ customerName, customerPhone, region, items: toCheckoutItems(items) })
      }

      clearCart()
      setOrderPlaced(true)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Не удалось оформить заказ. Попробуйте ещё раз.')
    } finally {
      isSubmittingRef.current = false
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    closeCart()
    if (orderPlaced) {
      setOrderPlaced(false)
      setCustomerName('')
      setCustomerPhone('')
      setRegion(COURIER)
      setDeliveryMode('together')
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="cart-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-40 bg-ink/40"
          />
          <motion.aside
            key="cart-drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3, ease: 'easeOut' }}
            className="fixed right-0 top-0 z-50 flex h-dvh w-full max-w-sm flex-col border-l-4 border-black bg-white pt-[env(safe-area-inset-top)] shadow-[-8px_0_0_0_#000]"
          >
            <div className="flex items-center justify-between border-b-2 border-black px-6 py-4">
              <h2 className="font-grotesk text-lg font-bold text-ink">Корзина</h2>
              <button
                type="button"
                onClick={handleClose}
                className="-m-3 p-3 font-grotesk text-sm font-bold text-ink/50 transition hover:text-ink"
              >
                Закрыть
              </button>
            </div>

            {orderPlaced ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-4 text-center">
                <motion.span
                  {...popIn(0.05)}
                  className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-black bg-bubblegum-light font-grotesk text-3xl font-bold text-ink"
                >
                  ✓
                </motion.span>
                <h3 className="font-grotesk text-lg font-bold text-ink">Заказ принят!</h3>
                <p className="text-sm text-ink/60">
                  Мы свяжемся с вами по указанному номеру, чтобы уточнить детали заказа и доставку.
                  {isSplitDelivery && ' Товары в наличии и товары под заказ приедут отдельными доставками.'}
                </p>
                <button
                  type="button"
                  onClick={handleClose}
                  className="mt-2 rounded-pill border-2 border-black bg-ink px-6 py-3 font-grotesk text-sm font-bold text-white transition hover:bg-bubblegum-dark"
                >
                  Готово
                </button>
              </div>
            ) : (
              <>
            <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-4">
              {items.length === 0 && (
                <p className="text-sm text-ink/50">Корзина пуста.</p>
              )}
              {hasBothGroups ? (
                <>
                  <p className="mt-2 font-grotesk text-xs font-bold uppercase tracking-wide text-ink/50">
                    В наличии
                  </p>
                  <AnimatePresence initial={false}>
                    {inStockItems.map((item) => (
                      <CartItemRow
                        key={item.variantId}
                        item={item}
                        onChangeQuantity={changeQuantity}
                        onRemove={removeItem}
                      />
                    ))}
                  </AnimatePresence>
                  <p className="mt-4 font-grotesk text-xs font-bold uppercase tracking-wide text-ink/50">
                    Под заказ
                  </p>
                  <AnimatePresence initial={false}>
                    {preOrderItems.map((item) => (
                      <CartItemRow
                        key={item.variantId}
                        item={item}
                        onChangeQuantity={changeQuantity}
                        onRemove={removeItem}
                      />
                    ))}
                  </AnimatePresence>
                </>
              ) : (
                <AnimatePresence initial={false}>
                  {items.map((item) => (
                    <CartItemRow
                      key={item.variantId}
                      item={item}
                      onChangeQuantity={changeQuantity}
                      onRemove={removeItem}
                    />
                  ))}
                </AnimatePresence>
              )}

              {items.length > 0 && (
                <div className="mt-4 flex flex-col gap-3">
                  <input
                    type="text"
                    value={customerName}
                    onChange={(event) => setCustomerName(event.target.value)}
                    placeholder="Имя и фамилия"
                    className="rounded-pill border-2 border-black px-4 py-2 font-grotesk text-base font-semibold sm:text-sm text-ink outline-none focus:border-bubblegum-dark"
                  />
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(event) => setCustomerPhone(event.target.value)}
                    placeholder="Номер телефона"
                    className="rounded-pill border-2 border-black px-4 py-2 font-grotesk text-base font-semibold sm:text-sm text-ink outline-none focus:border-bubblegum-dark"
                  />
                  <div className="flex flex-col gap-1">
                    <span className="font-grotesk text-xs font-bold uppercase tracking-wide text-ink/50">
                      Как получить
                    </span>
                    <div className="flex overflow-hidden rounded-pill border-2 border-black">
                      {DELIVERY_OPTIONS.map((option, index) => (
                        <button
                          key={option.value}
                          type="button"
                          aria-pressed={region === option.value}
                          onClick={() => setRegion(option.value)}
                          className={`flex-1 px-3 py-2 font-grotesk text-sm font-bold transition ${
                            index > 0 ? 'border-l-2 border-black' : ''
                          } ${region === option.value ? 'bg-bubblegum text-ink' : 'bg-white text-ink/50'}`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-ink/50">
                      {DELIVERY_OPTIONS.find((option) => option.value === region)?.hint}
                    </p>
                  </div>
                  {hasBothGroups && (
                    <div className="flex flex-col gap-1">
                      <span className="font-grotesk text-xs font-bold uppercase tracking-wide text-ink/50">
                        Доставка
                      </span>
                      <div className="flex overflow-hidden rounded-pill border-2 border-black">
                        <button
                          type="button"
                          aria-pressed={deliveryMode === 'together'}
                          onClick={() => setDeliveryMode('together')}
                          className={`flex-1 px-3 py-2 font-grotesk text-sm font-bold transition ${
                            deliveryMode === 'together' ? 'bg-bubblegum text-ink' : 'bg-white text-ink/50'
                          }`}
                        >
                          Вместе
                        </button>
                        <button
                          type="button"
                          aria-pressed={deliveryMode === 'separate'}
                          onClick={() => setDeliveryMode('separate')}
                          className={`flex-1 border-l-2 border-black px-3 py-2 font-grotesk text-sm font-bold transition ${
                            deliveryMode === 'separate' ? 'bg-bubblegum text-ink' : 'bg-white text-ink/50'
                          }`}
                        >
                          Раздельно
                        </button>
                      </div>
                      <p className="text-xs text-ink/50">
                        {deliveryMode === 'together'
                          ? 'Одна доставка — когда будут готовы все товары, включая под заказ.'
                          : 'Две доставки — товары в наличии отправим сразу, под заказ отдельно, когда будут готовы.'}
                      </p>
                    </div>
                  )}
                  {submitError && <p className="text-xs text-red-500">{submitError}</p>}
                </div>
              )}
            </div>

            <div className="border-t-2 border-black px-6 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
              {items.length > 0 && (
                <p className="mb-3 text-xs text-ink/50">
                  Доставка займёт от 7 до 14 дней — заказы едут напрямую из США и Кореи.
                </p>
              )}
              <div className="mb-1 flex items-center justify-between font-grotesk text-sm text-ink/60">
                <span>Товары</span>
                <span>{formatPrice(totalPrice)}</span>
              </div>
              {isSplitDelivery ? (
                <>
                  <div className="mb-1 flex items-center justify-between font-grotesk text-sm text-ink/60">
                    <span>{deliveryLabel} — в наличии</span>
                    <span>{formatPrice(singleDeliveryFee)}</span>
                  </div>
                  <div className="mb-4 flex items-center justify-between font-grotesk text-sm text-ink/60">
                    <span>{deliveryLabel} — под заказ</span>
                    <span>{formatPrice(singleDeliveryFee)}</span>
                  </div>
                </>
              ) : (
                <div className="mb-4 flex items-center justify-between font-grotesk text-sm text-ink/60">
                  <span>{deliveryLabel}</span>
                  <span>{formatPrice(deliveryFee)}</span>
                </div>
              )}
              <div className="mb-1 flex items-center justify-between border-t border-ink/10 pt-3 font-grotesk text-base font-bold text-ink">
                <span>Итого</span>
                <span>{formatPrice(grandTotal)}</span>
              </div>
              <div className="mb-4 flex items-center justify-between gap-2 font-grotesk text-xs text-ink/45">
                <span>Плюс вес посылки — посчитаем при подтверждении</span>
                <WeightTariffNote label="Тариф" className="shrink-0" />
              </div>
              <button
                type="button"
                onClick={handleCheckout}
                disabled={!canCheckout || isSubmitting}
                className="w-full rounded-pill border-2 border-black bg-ink px-4 py-3 font-grotesk text-sm font-bold text-white transition hover:bg-bubblegum-dark disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isSubmitting ? 'Оформляем заказ...' : 'Оформить заказ'}
              </button>
            </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
