import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ScrollFadeRow from '../../components/ScrollFadeRow'

function sizeRow(element: HTMLElement, { client, scroll, left }: { client: number; scroll: number; left: number }) {
  Object.defineProperty(element, 'clientWidth', { value: client, configurable: true })
  Object.defineProperty(element, 'scrollWidth', { value: scroll, configurable: true })
  Object.defineProperty(element, 'scrollLeft', { value: left, configurable: true, writable: true })
  fireEvent.scroll(element)
}

describe('ScrollFadeRow', () => {
  it('adds no fade when everything fits', () => {
    render(<ScrollFadeRow>row</ScrollFadeRow>)
    const row = screen.getByText('row')
    sizeRow(row, { client: 300, scroll: 300, left: 0 })

    expect(row).not.toHaveAttribute('data-fade')
  })

  it('fades the right edge at the start, both mid-scroll and the left at the end', () => {
    render(<ScrollFadeRow>row</ScrollFadeRow>)
    const row = screen.getByText('row')

    sizeRow(row, { client: 300, scroll: 900, left: 0 })
    expect(row).toHaveAttribute('data-fade', 'right')

    sizeRow(row, { client: 300, scroll: 900, left: 200 })
    expect(row).toHaveAttribute('data-fade', 'both')

    sizeRow(row, { client: 300, scroll: 900, left: 600 })
    expect(row).toHaveAttribute('data-fade', 'left')
  })
})
