import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import HeroSection from './HeroSection'

function renderHeroSection() {
  return render(
    <MemoryRouter>
      <HeroSection />
    </MemoryRouter>
  )
}

describe('HeroSection', () => {
  it('renders without crashing and shows the headline and call to action', () => {
    renderHeroSection()

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('сделанодля тебя')
    expect(screen.getByRole('link', { name: /смотреть каталог/i })).toHaveAttribute('href', '/catalog')
  })

  it('links the secondary call to action to the about page', () => {
    renderHeroSection()

    expect(screen.getByRole('link', { name: /подробнее/i })).toHaveAttribute('href', '/about')
  })

  it('links the hero image to the Instagram profile', () => {
    renderHeroSection()

    const link = screen.getByRole('link', { name: /adika buyer в instagram/i })
    expect(link).toHaveAttribute('href', 'https://www.instagram.com/adika.buyer/')
    expect(link).toHaveAttribute('target', '_blank')
  })
})
