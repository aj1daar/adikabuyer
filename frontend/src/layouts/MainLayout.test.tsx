import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { ReactNode } from 'react'
import MainLayout from './MainLayout'
import useCartStore from '../store/useCartStore'

beforeEach(() => {
  useCartStore.setState({ items: [], isOpen: false })
})

function renderLayout(children: ReactNode) {
  return render(
    <MemoryRouter>
      <MainLayout>{children}</MainLayout>
    </MemoryRouter>
  )
}

describe('MainLayout', () => {
  it('renders children inside the layout', () => {
    renderLayout(<p>Catalog content</p>)

    expect(screen.getByText('Catalog content')).toBeInTheDocument()
  })

  it('shows the current cart item count in the trigger button', () => {
    useCartStore.setState({
      items: [
        {
          variantId: 1,
          productId: 1,
          productName: 'Tumbler',
          sku: 'TUM-1',
          attributes: {},
          unitPrice: 10,
          quantity: 3,
        },
      ],
    })

    renderLayout(<p>Content</p>)

    expect(screen.getByRole('button', { name: /корзина \(3\)/i })).toBeInTheDocument()
  })

  it('toggles the cart drawer open state when clicked', () => {
    renderLayout(<p>Content</p>)

    expect(useCartStore.getState().isOpen).toBe(false)

    fireEvent.click(screen.getByRole('button', { name: /корзина/i }))

    expect(useCartStore.getState().isOpen).toBe(true)
  })
})
