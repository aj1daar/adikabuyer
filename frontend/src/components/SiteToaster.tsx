import { Toaster } from 'react-hot-toast'

const INK = '#0A0A0A'
const BUBBLEGUM = '#E8799F'
const BUBBLEGUM_LIGHT = '#F3A9C0'

/**
 * react-hot-toast restyled as Neo-Y2K stickers: thick ink border, hard offset shadow,
 * Unbounded type, bubblegum for errors. Sits just under the 98px sticky header (plus the
 * notch) so a toast never covers the logo or the cart button.
 */
export default function SiteToaster() {
  return (
    <Toaster
      position="top-center"
      containerStyle={{ top: 'calc(env(safe-area-inset-top) + 110px)' }}
      toastOptions={{
        style: {
          border: `2px solid ${INK}`,
          borderRadius: '1.25rem',
          boxShadow: `4px 4px 0 0 ${INK}`,
          background: '#FFFFFF',
          color: INK,
          fontFamily: '"Unbounded", system-ui, sans-serif',
          fontSize: '13px',
          fontWeight: 700,
          lineHeight: 1.35,
          padding: '10px 14px',
          maxWidth: 'min(calc(100vw - 32px), 420px)',
        },
        success: {
          iconTheme: { primary: BUBBLEGUM, secondary: '#FFFFFF' },
        },
        error: {
          style: { background: BUBBLEGUM_LIGHT },
          iconTheme: { primary: INK, secondary: BUBBLEGUM_LIGHT },
        },
      }}
    />
  )
}
