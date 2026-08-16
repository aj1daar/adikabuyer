import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import HeroSection from './HeroSection'

describe('HeroSection', () => {
  it('renders without crashing and shows the headline and call to action', () => {
    render(<HeroSection />)

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('made foryour style')
    expect(screen.getByRole('button', { name: /shop the drop/i })).toBeInTheDocument()
  })
})
