import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ProductLabels from '../../components/ProductLabels'

describe('ProductLabels', () => {
  it('renders nothing without labels', () => {
    const { container } = render(<ProductLabels labels={[]} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders one uppercase sticker per label', () => {
    render(<ProductLabels labels={['Limited', 'С принтом']} />)
    expect(screen.getByText('Limited')).toBeInTheDocument()
    expect(screen.getByText('С принтом')).toBeInTheDocument()
  })

  it('stacks vertically on the card and flows in a row on the page', () => {
    const { rerender, container } = render(<ProductLabels labels={['Limited']} />)
    expect((container.firstElementChild as HTMLElement).className).toContain('flex-col')

    rerender(<ProductLabels labels={['Limited']} size="page" />)
    expect((container.firstElementChild as HTMLElement).className).toContain('flex-row')
  })
})
