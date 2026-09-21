import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import toast, { Toaster } from 'react-hot-toast'
import notifyAddedToCart from '../../utils/notifyAddedToCart'
import useCartStore from '../../store/useCartStore'

beforeEach(() => {
  useCartStore.setState({ items: [], isOpen: false })
})

afterEach(() => {
  act(() => toast.remove())
})

describe('notifyAddedToCart', () => {
  it('names the product and opens the cart from the toast', async () => {
    render(<Toaster />)

    act(() => notifyAddedToCart('Худи оверсайз', 7))
    fireEvent.click(await screen.findByRole('button', { name: 'Открыть' }))

    expect(screen.getByText('В корзине: Худи оверсайз')).toBeInTheDocument()
    expect(useCartStore.getState().isOpen).toBe(true)
  })

  it('refreshes one toast per variant instead of stacking repeats', async () => {
    render(<Toaster />)

    act(() => {
      notifyAddedToCart('Худи оверсайз', 7)
      notifyAddedToCart('Худи оверсайз', 7)
    })

    expect(await screen.findAllByRole('button', { name: 'Открыть' })).toHaveLength(1)
  })
})
