import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import MobileColumnsToggle from '../../components/MobileColumnsToggle'

describe('MobileColumnsToggle', () => {
  it('renders a button for 1, 2, and 3 columns', () => {
    render(<MobileColumnsToggle value={1} onChange={vi.fn()} />)

    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '2' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '3' })).toBeInTheDocument()
  })

  it('marks the current value as pressed', () => {
    render(<MobileColumnsToggle value={2} onChange={vi.fn()} />)

    expect(screen.getByRole('button', { name: '2', pressed: true })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '1', pressed: false })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '3', pressed: false })).toBeInTheDocument()
  })

  it('calls onChange with the picked column count', () => {
    const onChange = vi.fn()
    render(<MobileColumnsToggle value={1} onChange={onChange} />)

    fireEvent.click(screen.getByRole('button', { name: '3' }))

    expect(onChange).toHaveBeenCalledWith(3)
  })
})
