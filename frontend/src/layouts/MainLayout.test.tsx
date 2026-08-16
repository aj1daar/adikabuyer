import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import MainLayout from './MainLayout'
import useCartStore from '../store/useCartStore'

beforeEach(() => {
  useCartStore.setState({ items: [], isOpen: false })
})

describe('MainLayout', () => {
  it('renders children inside the layout', () => {
    render(
      <MainLayout>
        <p>Catalog content</p>
      </MainLayout>
    )

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

    render(
      <MainLayout>
        <p>Content</p>
      </MainLayout>
    )

    expect(screen.getByRole('button', { name: /cart \(3\)/i })).toBeInTheDocument()
  })

  it('toggles the cart drawer open state when clicked', () => {
    render(
      <MainLayout>
        <p>Content</p>
      </MainLayout>
    )

    expect(useCartStore.getState().isOpen).toBe(false)

    fireEvent.click(screen.getByRole('button', { name: /cart/i }))

    expect(useCartStore.getState().isOpen).toBe(true)
  })
})
