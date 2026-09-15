import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import NotFoundState from '../../components/NotFoundState'

describe('NotFoundState', () => {
  it('renders the default heading, message and both ways back', () => {
    render(
      <MemoryRouter>
        <NotFoundState />
      </MemoryRouter>
    )

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('тутпусто')
    expect(screen.getByText(/такой страницы нет/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'В каталог' })).toHaveAttribute('href', '/catalog')
    expect(screen.getByRole('link', { name: 'На главную' })).toHaveAttribute('href', '/')
  })

  it('accepts a custom heading and message', () => {
    render(
      <MemoryRouter>
        <NotFoundState title="товар" accent="исчез" message="Этого товара больше нет." />
      </MemoryRouter>
    )

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('товарисчез')
    expect(screen.getByText('Этого товара больше нет.')).toBeInTheDocument()
  })
})
