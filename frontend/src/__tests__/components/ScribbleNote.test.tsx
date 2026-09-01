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

  it('rotates the arrow to point the requested way', () => {
    const up = render(<ScribbleNote text="го" direction="up" />).container
    const left = render(<ScribbleNote text="го" direction="left" />).container

    expect(up.querySelector('svg')?.getAttribute('style')).toContain('rotate(180deg)')
    expect(left.querySelector('svg')?.getAttribute('style')).toContain('rotate(90deg)')
  })
})
