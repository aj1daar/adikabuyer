import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import formatPrice from '../utils/formatPrice'
import {
  NEGOTIABLE_FROM_KG,
  USD_RATE,
  WEIGHT_RATE_USD_PER_KG,
  WEIGHT_STEPS,
  formatWeight,
} from '../utils/weightSurcharge'

type WeightTariffNoteProps = {
  /** Text of the quiet trigger; keep it short, it sits inside running copy. */
  label?: string
  className?: string
}

/**
 * A quiet link that opens the parcel-weight price list. The surcharge can't be shown as a
 * number anywhere — nothing in the catalog carries a weight — so the shop states the tariff
 * and settles the exact sum when the order is confirmed.
 */
export default function WeightTariffNote({
  label = 'Тариф за вес',
  className = '',
}: WeightTariffNoteProps) {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      return
    }
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }
    // The page behind an open sheet must not scroll — on a phone the two scrolls fight
    // and the sheet feels broken.
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', close)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', close)
    }
  }, [isOpen])

  return (
    <>
      {/* the pseudo-element grows the tap zone to a thumb's worth without moving the text */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`relative inline-flex items-center gap-1 font-grotesk text-xs font-bold text-ink/50 underline decoration-dotted underline-offset-4 transition after:absolute after:-inset-3 after:content-[''] hover:text-bubblegum-dark ${className}`}
      >
        {label}
        <span aria-hidden className="text-[0.9em]">?</span>
      </button>

      {createPortal(
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="weight-tariff-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-[70] flex h-dvh items-end justify-center bg-ink/50 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))] sm:items-center"
          >
            <motion.div
              key="weight-tariff-dialog"
              role="dialog"
              aria-modal="true"
              aria-label="Тариф за вес посылки"
              onClick={(event) => event.stopPropagation()}
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              className="max-h-full w-full max-w-sm overflow-y-auto overscroll-contain rounded-3xl border-4 border-black bg-white p-6 shadow-[8px_8px_0_0_#000]"
            >
              <h2 className="font-grotesk text-lg font-bold text-ink">Тариф за вес</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink/70">
                К цене товаров добавляется вес посылки — {WEIGHT_RATE_USD_PER_KG}&nbsp;$ за килограмм
                по курсу&nbsp;{USD_RATE.toString().replace('.', ',')}. Точную сумму посчитаем и
                назовём, когда подтвердим заказ.
              </p>

              <ul className="mt-4 flex flex-col gap-1">
                {WEIGHT_STEPS.map((step) => (
                  <li
                    key={step.kg}
                    className="flex items-center justify-between border-b border-ink/10 pb-1 font-grotesk text-sm text-ink/70 last:border-b-0"
                  >
                    <span>{formatWeight(step.kg)}</span>
                    <span className="font-bold text-ink">{formatPrice(step.fee)}</span>
                  </li>
                ))}
              </ul>

              <p className="mt-4 rounded-2xl border-2 border-black bg-bubblegum-light px-4 py-3 text-sm text-ink">
                От {NEGOTIABLE_FROM_KG}&nbsp;кг цена договорная — напишем и обсудим.
              </p>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="mt-5 min-h-11 w-full rounded-pill border-2 border-black bg-ink px-5 py-3 font-grotesk text-sm font-bold text-white shadow-[3px_3px_0_0_#E8799F] transition hover:bg-bubblegum-dark"
              >
                Понятно
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body,
      )}
    </>
  )
}
