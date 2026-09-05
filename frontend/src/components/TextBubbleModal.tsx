import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
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
  const bodyRef = useRef<HTMLDivElement | null>(null)
  const textRef = useRef<HTMLParagraphElement | null>(null)
  // Scrollbars are hidden site-wide, so a long description would otherwise give no hint
  // that it continues below the fold — this drives a fade that says "there is more".
  const [hasMoreBelow, setHasMoreBelow] = useState(false)

  const syncOverflow = useCallback(() => {
    const element = bodyRef.current
    if (!element) {
      return
    }
    setHasMoreBelow(element.scrollHeight - element.scrollTop - element.clientHeight > 8)
  }, [])

  useLayoutEffect(() => {
    if (!open) {
      return
    }
    syncOverflow()
    // Phones change the usable height on their own — toolbars collapsing, rotation — and
    // the text reflows when Unbounded finally loads, which grows the paragraph without
    // ever resizing the viewport. Watch both boxes, and the font too.
    const observer = new ResizeObserver(syncOverflow)
    for (const box of [bodyRef.current, textRef.current]) {
      if (box) {
        observer.observe(box)
      }
    }
    window.addEventListener('resize', syncOverflow)
    document.fonts?.ready.then(syncOverflow).catch(() => {})
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', syncOverflow)
    }
  }, [open, text, syncOverflow])

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
          className="fixed inset-0 z-[60] flex h-dvh items-center justify-center bg-ink/50 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))]"
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
            className="relative flex max-h-full w-full max-w-xl flex-col rounded-3xl border-2 border-black bg-white p-6 shadow-[8px_8px_0_0_#000] sm:p-8"
          >
            {/* speech-bubble tail */}
            <span className="absolute -bottom-[11px] left-10 h-5 w-5 rotate-45 border-b-2 border-r-2 border-black bg-white" />

            <button
              type="button"
              onClick={onClose}
              aria-label="Закрыть"
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border-2 border-black bg-white text-ink shadow-[2px_2px_0_0_#000] transition after:absolute after:-inset-2 after:content-[''] hover:bg-bubblegum hover:text-white active:scale-90"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>

            <h2 className="shrink-0 pr-10 font-grotesk text-xl font-bold text-ink">{title}</h2>

            {/* The text sets the bubble's height until it would outgrow the screen; past that
                it scrolls inside, with the rail hidden like everywhere else on the site. */}
            {/* The scroller has to be a flex item itself — a percentage max-height inside a
                flex-sized box is not reliably definite, and the text then spills out. */}
            <div className="relative mt-3 flex min-h-0 flex-1 flex-col">
              <div
                ref={bodyRef}
                onScroll={syncOverflow}
                className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
              >
                <p
                  ref={textRef}
                  className="whitespace-pre-line break-words text-base leading-relaxed text-ink/80"
                >
                  {text}
                </p>
              </div>
              <div
                aria-hidden="true"
                className={`pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white to-transparent transition-opacity duration-200 ${
                  hasMoreBelow ? 'opacity-100' : 'opacity-0'
                }`}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
