import { Component, type ErrorInfo, type ReactNode } from 'react'

type ErrorBoundaryProps = {
  children: ReactNode
}

type ErrorBoundaryState = {
  hasError: boolean
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled UI error', error, errorInfo)
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      // Neo-Y2K like the 404 page, but self-contained: this renders when the app itself has
      // crashed, so no router links or animation library — plain markup that can't fail too
      return (
        <div
          className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-white px-6 text-center"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(194,71,117,0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(194,71,117,0.07) 1px, transparent 1px)',
            backgroundSize: '22px 22px',
          }}
        >
          <span className="rotate-[-4deg] rounded-pill border-2 border-black bg-gradient-to-r from-bubblegum to-bubblegum-light px-5 py-1.5 font-grotesk text-sm font-bold uppercase tracking-wider text-ink shadow-[3px_3px_0_0_#000]">
            упс
          </span>
          <h1 className="font-grotesk text-display font-semibold leading-[0.95] tracking-[-0.03em] text-ink sm:text-[clamp(3rem,6.5vw,5rem)]">
            что-то
            <br />
            <span className="text-bubblegum-dark">сломалось</span>
          </h1>
          <p className="max-w-md text-lg text-ink/70">
            Произошла непредвиденная ошибка. Перезагрузите страницу — корзина никуда не денется.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={this.handleReload}
              className="flex min-h-11 items-center rounded-pill border-2 border-black bg-ink px-8 py-3 font-grotesk text-sm font-bold text-white shadow-[4px_4px_0_0_#E8799F] transition hover:bg-bubblegum-dark"
            >
              Перезагрузить
            </button>
            <a
              href="/"
              className="flex min-h-11 items-center rounded-pill border-2 border-black bg-white px-8 py-3 font-grotesk text-sm font-bold text-ink transition hover:bg-bubblegum-dark hover:text-white"
            >
              На главную
            </a>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
