import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ScribbleNote from '../../components/ScribbleNote'

describe('ScribbleNote', () => {
  it('shows the callout text and stays decorative and non-interactive', () => {
    const { container } = render(<ScribbleNote text="жми сюда 🔥" />)

    expect(screen.getByText('жми сюда 🔥')).toBeInTheDocument()
    const root = container.firstElementChild as HTMLElement
    expect(root).toHaveAttribute('aria-hidden', 'true')
    expect(root.className).toContain('pointer-events-none')
    expect(root.className).toContain('sm:block')
  })

  it('mirrors the arrow vertically when pointing up', () => {
    const { container } = render(<ScribbleNote text="го" direction="up" />)
    expect(container.querySelector('svg')?.getAttribute('class')).toContain('-scale-y-100')
  })
})
