import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import useCartStore from '../store/useCartStore'
import submitCheckout from '../api/checkout'

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
  const [region, setRegion] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

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

  const handleCheckout = async () => {
    if (!canCheckout) {
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const response = await submitCheckout({
        customerName,
        customerPhone,
        region,
        items: items.map((item) => ({
          variantId: item.variantId,
          productName: item.productName,
          sku: item.sku,
          attributes: item.attributes,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
        })),
      })

      clearCart()
      closeCart()
      window.location.href = response.whatsappUrl
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Не удалось оформить заказ. Попробуйте ещё раз.')
    } finally {
      setIsSubmitting(false)
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
            onClick={closeCart}
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
                onClick={closeCart}
                className="-m-3 p-3 font-grotesk text-sm font-bold text-ink/50 transition hover:text-ink"
              >
                Закрыть
              </button>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-4">
              {items.length === 0 && (
                <p className="text-sm text-ink/50">Корзина пуста.</p>
              )}
              {items.map((item) => (
                <div
                  key={item.variantId}
                  className="flex items-center justify-between gap-3 border-b border-ink/10 py-3"
                >
                  <div>
                    <p className="font-grotesk text-sm font-bold text-ink">{item.productName}</p>
                    <p className="text-xs text-ink/50">
                      {Object.values(item.attributes).join(', ')}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => changeQuantity(item.variantId, -1)}
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
                        onClick={() => changeQuantity(item.variantId, 1)}
                        aria-label="Увеличить количество"
                        className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-black bg-white font-grotesk text-base font-bold text-ink transition hover:bg-bubblegum hover:text-white"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-grotesk text-sm font-bold text-ink">
                      {(item.unitPrice * item.quantity).toFixed(2)} ⃀
                    </span>
                    <button
                      type="button"
                      onClick={() => removeItem(item.variantId)}
                      className="-m-3 p-3 font-grotesk text-xs font-bold text-ink/40 transition hover:text-bubblegum-dark"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              ))}

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
                  <input
                    type="text"
                    value={region}
                    onChange={(event) => setRegion(event.target.value)}
                    placeholder="Город"
                    className="rounded-pill border-2 border-black px-4 py-2 font-grotesk text-base font-semibold sm:text-sm text-ink outline-none focus:border-bubblegum-dark"
                  />
                  {submitError && <p className="text-xs text-red-500">{submitError}</p>}
                </div>
              )}
            </div>

            <div className="border-t-2 border-black px-6 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
              <div className="mb-4 flex items-center justify-between font-grotesk text-base font-bold text-ink">
                <span>Итого</span>
                <span>{totalPrice.toFixed(2)} ⃀</span>
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
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
