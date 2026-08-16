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
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white px-6 text-center">
          <h1 className="font-grotesk text-xl font-semibold text-ink">Что-то пошло не так</h1>
          <p className="text-sm text-ink/60">
            Произошла непредвиденная ошибка. Попробуйте перезагрузить страницу.
          </p>
          <button
            type="button"
            onClick={this.handleReload}
            className="rounded-pill bg-ink px-6 py-3 text-sm font-semibold text-white transition hover:bg-bubblegum-dark"
          >
            Перезагрузить
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
