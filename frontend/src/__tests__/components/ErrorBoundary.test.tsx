import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ErrorBoundary from '../../components/ErrorBoundary'

function ThrowingComponent(): never {
  throw new Error('Boom')
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('ErrorBoundary', () => {
  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <p>All good</p>
      </ErrorBoundary>
    )

    expect(screen.getByText('All good')).toBeInTheDocument()
  })

  it('renders a fallback message when a child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    )

    expect(screen.getByRole('heading', { name: /что-то пошло не так/i })).toBeInTheDocument()
    expect(screen.queryByText('All good')).not.toBeInTheDocument()
  })

  it('reloads the page when the reload button is clicked', () => {
    const reloadSpy = vi.fn()
    Object.defineProperty(window, 'location', {
      value: { reload: reloadSpy },
      writable: true,
      configurable: true,
    })

    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    )

    fireEvent.click(screen.getByRole('button', { name: /перезагрузить/i }))

    expect(reloadSpy).toHaveBeenCalledTimes(1)
  })
})
