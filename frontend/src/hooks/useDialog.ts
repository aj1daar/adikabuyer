import { useEffect, useRef, type RefObject } from 'react'

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

// open dialogs, topmost last — only the top one answers Escape and Tab, so a cropper
// opened over the product form (or a confirm over the admin) closes on its own
const openDialogs: RefObject<HTMLElement | null>[] = []

/**
 * Modal behaviour for an overlay panel: focus moves into it on open (the element marked
 * `data-autofocus`, else the first focusable one, else the panel itself — give it
 * `tabIndex={-1}`), Tab and Shift+Tab stay inside, Escape calls `onEscape`, and focus goes
 * back to whatever opened it on close. Pass no `onEscape` where closing would throw away
 * unsaved input.
 */
export default function useDialog(
  panelRef: RefObject<HTMLElement | null>,
  open: boolean,
  onEscape?: () => void,
) {
  const onEscapeRef = useRef(onEscape)
  useEffect(() => {
    onEscapeRef.current = onEscape
  })

  useEffect(() => {
    if (!open) {
      return
    }
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    openDialogs.push(panelRef)

    // a frame later: the panel may mount inside an AnimatePresence enter animation
    const frame = requestAnimationFrame(() => {
      const panel = panelRef.current
      if (!panel || panel.contains(document.activeElement)) {
        return
      }
      const target =
        panel.querySelector<HTMLElement>('[data-autofocus]') ?? panel.querySelector<HTMLElement>(FOCUSABLE) ?? panel
      target.focus({ preventScroll: true })
    })

    const onKeyDown = (event: KeyboardEvent) => {
      const panel = panelRef.current
      if (!panel || openDialogs[openDialogs.length - 1] !== panelRef) {
        return
      }
      if (event.key === 'Escape') {
        if (onEscapeRef.current) {
          event.preventDefault()
          onEscapeRef.current()
        }
        return
      }
      if (event.key !== 'Tab') {
        return
      }
      const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE))
      if (focusable.length === 0) {
        event.preventDefault()
        panel.focus()
        return
      }
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement
      if (event.shiftKey && (active === first || !panel.contains(active))) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && (active === last || !panel.contains(active))) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)

    return () => {
      cancelAnimationFrame(frame)
      document.removeEventListener('keydown', onKeyDown)
      const index = openDialogs.lastIndexOf(panelRef)
      if (index >= 0) {
        openDialogs.splice(index, 1)
      }
      if (opener && opener.isConnected) {
        opener.focus({ preventScroll: true })
      }
    }
  }, [open, panelRef])
}
