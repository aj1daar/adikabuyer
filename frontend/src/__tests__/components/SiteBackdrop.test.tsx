import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import SiteBackdrop from '../../components/SiteBackdrop'

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <SiteBackdrop />
    </MemoryRouter>
  ).container

const shapeCount = (container: HTMLElement) => container.querySelectorAll('span').length

describe('SiteBackdrop', () => {
  it('is a decorative, non-interactive fixed layer', () => {
    const root = renderAt('/').firstElementChild as HTMLElement

    expect(root).toHaveAttribute('aria-hidden', 'true')
    expect(root.className).toContain('pointer-events-none')
    expect(root.className).toContain('fixed')
  })

  it('draws a different shape arrangement per route but keeps the grid on all', () => {
    expect(shapeCount(renderAt('/'))).toBe(6)
    expect(shapeCount(renderAt('/catalog'))).toBe(5)
    expect(shapeCount(renderAt('/catalog/7'))).toBe(5)
    expect(shapeCount(renderAt('/about'))).toBe(4)
  })

  it('falls back to the home arrangement on an unknown route', () => {
    expect(shapeCount(renderAt('/whatever'))).toBe(6)
  })
})
