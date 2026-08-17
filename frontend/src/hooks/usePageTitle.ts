import { useEffect } from 'react'

const DEFAULT_TITLE = 'Adika Buyer — вещи под заказ'

export default function usePageTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} — Adika Buyer` : DEFAULT_TITLE
    return () => {
      document.title = DEFAULT_TITLE
    }
  }, [title])
}
