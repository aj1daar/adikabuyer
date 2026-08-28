import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import NavigationBar from '../../components/NavigationBar'
import useCartStore from '../../store/useCartStore'

beforeEach(() => {
  useCartStore.setState({ items: [], isOpen: false })
})

function renderNavigationBar() {
  return render(
    <MemoryRouter>
      <NavigationBar />
    </MemoryRouter>
  )
}

describe('NavigationBar', () => {
  it('links the logo to the landing page', () => {
    renderNavigationBar()

    expect(screen.getByRole('link', { name: /adika buyer/i })).toHaveAttribute('href', '/')
  })

  it('renders Catalog and About Us navigation links', () => {
    renderNavigationBar()

    const catalogLinks = screen.getAllByRole('link', { name: /каталог/i })
    const aboutLinks = screen.getAllByRole('link', { name: /о нас/i })

    expect(catalogLinks.some((link) => link.getAttribute('href') === '/catalog')).toBe(true)
    expect(aboutLinks.some((link) => link.getAttribute('href') === '/about')).toBe(true)
  })

  it('toggles the cart drawer when the cart button is clicked', () => {
    renderNavigationBar()

    expect(useCartStore.getState().isOpen).toBe(false)

    screen.getByRole('button', { name: /корзина/i }).click()

    expect(useCartStore.getState().isOpen).toBe(true)
  })
})
