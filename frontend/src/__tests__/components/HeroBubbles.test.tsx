import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import HeroBubbles from '../../components/HeroBubbles'

describe('HeroBubbles', () => {
  it('renders each bubble and stays mobile-only and decorative', () => {
    const { container } = render(
      <HeroBubbles bubbles={[{ text: 'жми сюда 🔥' }, { text: 'залетай к нам ✨', tone: 'pink' }]} />
    )

    expect(screen.getByText('жми сюда 🔥')).toBeInTheDocument()
    expect(screen.getByText('залетай к нам ✨')).toBeInTheDocument()

    const root = container.firstElementChild as HTMLElement
    expect(root).toHaveAttribute('aria-hidden', 'true')
    expect(root.className).toContain('sm:hidden')
  })
})
