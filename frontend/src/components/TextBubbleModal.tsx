import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'

type TextBubbleModalProps = {
  open: boolean
  title: string
  text: string
  onClose: () => void
}

/** Neo-Y2K speech bubble that pops the full text a card only had room to tease. */
export default function TextBubbleModal({ open, title, text, onClose }: TextBubbleModalProps) {
  useEffect(() => {
    if (!open) {
      return
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="text-bubble-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/50 p-4"
        >
          <motion.div
            key="text-bubble"
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, scale: 0.6, y: 60 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.7, y: 40 }}
            transition={{ type: 'spring', stiffness: 380, damping: 12, mass: 0.8 }}
            onClick={(event) => event.stopPropagation()}
            className="relative w-full max-w-xl rounded-3xl border-2 border-black bg-white p-8 shadow-[8px_8px_0_0_#000]"
          >
            {/* speech-bubble tail */}
            <span className="absolute -bottom-[11px] left-10 h-5 w-5 rotate-45 border-b-2 border-r-2 border-black bg-white" />

            <button
              type="button"
              onClick={onClose}
              aria-label="Закрыть"
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border-2 border-black bg-white text-ink shadow-[2px_2px_0_0_#000] transition hover:bg-bubblegum hover:text-white active:scale-90"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>

            <h2 className="pr-10 font-grotesk text-xl font-bold text-ink">{title}</h2>
            <p className="mt-3 whitespace-pre-line text-base leading-relaxed text-ink/80">{text}</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
