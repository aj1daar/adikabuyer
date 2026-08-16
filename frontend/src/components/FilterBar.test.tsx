import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import FilterBar from './FilterBar'

function renderFilterBar(overrides: Partial<Parameters<typeof FilterBar>[0]> = {}) {
  const onColorChange = vi.fn()
  const onSizeChange = vi.fn()
  const onVolumeChange = vi.fn()

  render(
    <FilterBar
      color=""
      size=""
      volume=""
      onColorChange={onColorChange}
      onSizeChange={onSizeChange}
      onVolumeChange={onVolumeChange}
      {...overrides}
    />
  )

  return { onColorChange, onSizeChange, onVolumeChange }
}

describe('FilterBar', () => {
  it('renders pills for color, size, and volume', () => {
    renderFilterBar()

    expect(screen.getByRole('button', { name: 'Чёрный' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'M' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '500 мл' })).toBeInTheDocument()
  })

  it('calls onColorChange with the option value when a color pill is clicked', () => {
    const { onColorChange } = renderFilterBar()

    fireEvent.click(screen.getByRole('button', { name: 'Розовый' }))

    expect(onColorChange).toHaveBeenCalledWith('pink')
  })

  it('marks the selected pill as pressed', () => {
    renderFilterBar({ size: 'M' })

    expect(screen.getByRole('button', { name: 'M' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'S' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('calls onSizeChange with an empty string when the selected pill is clicked again', () => {
    const { onSizeChange } = renderFilterBar({ size: 'L' })

    fireEvent.click(screen.getByRole('button', { name: 'L' }))

    expect(onSizeChange).toHaveBeenCalledWith('')
  })
})
