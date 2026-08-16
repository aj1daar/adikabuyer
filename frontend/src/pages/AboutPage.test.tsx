import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import AboutPage from './AboutPage'

describe('AboutPage', () => {
  it('renders the about heading', () => {
    render(
      <MemoryRouter>
        <AboutPage />
      </MemoryRouter>
    )

    expect(screen.getByRole('heading', { name: /о нас/i })).toBeInTheDocument()
  })

  it('renders the Our Story section', () => {
    render(
      <MemoryRouter>
        <AboutPage />
      </MemoryRouter>
    )

    expect(screen.getByRole('heading', { name: /наша история/i })).toBeInTheDocument()
  })

  it('renders the How to Order section with all three steps', () => {
    render(
      <MemoryRouter>
        <AboutPage />
      </MemoryRouter>
    )

    expect(screen.getByRole('heading', { name: /как сделать заказ/i })).toBeInTheDocument()
    expect(screen.getByText('Выбери товар')).toBeInTheDocument()
    expect(screen.getByText('Оформи заказ')).toBeInTheDocument()
    expect(screen.getByText('Получи заказ')).toBeInTheDocument()
  })
})
