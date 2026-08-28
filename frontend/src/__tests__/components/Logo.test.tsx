import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Logo from '../../components/Logo'

describe('Logo', () => {
  it('renders with an accessible name', () => {
    render(<Logo />)

    expect(screen.getByRole('img', { name: 'Adika Buyer' })).toBeInTheDocument()
  })

  it('applies the given className to the svg element', () => {
    render(<Logo className="h-10 w-auto" />)

    expect(screen.getByRole('img', { name: 'Adika Buyer' })).toHaveClass('h-10', 'w-auto')
  })
})
