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
  it('renders a dropdown trigger for color, size, and volume', () => {
    renderFilterBar()

    expect(screen.getByRole('button', { name: /цвет/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /размер/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /объём/i })).toBeInTheDocument()
  })

  it('applies the selected color once Save is clicked inside the color dropdown', () => {
    const { onColorChange } = renderFilterBar()

    fireEvent.click(screen.getByRole('button', { name: /цвет/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Розовый' }))
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }))

    expect(onColorChange).toHaveBeenCalledWith('pink')
  })

  it('applies the selected size once Save is clicked inside the size dropdown', () => {
    const { onSizeChange } = renderFilterBar()

    fireEvent.click(screen.getByRole('button', { name: /размер/i }))
    fireEvent.click(screen.getByRole('button', { name: 'M' }))
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }))

    expect(onSizeChange).toHaveBeenCalledWith('M')
  })
})
