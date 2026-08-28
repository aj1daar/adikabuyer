import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import FilterBar from '../../components/FilterBar'

function renderFilterBar(overrides: Partial<Parameters<typeof FilterBar>[0]> = {}) {
  const onCategoryChange = vi.fn()
  const onColorChange = vi.fn()
  const onSizeChange = vi.fn()
  const onVolumeChange = vi.fn()

  render(
    <FilterBar
      category=""
      color=""
      size=""
      volumeMin=""
      volumeMax=""
      categoryOptions={[]}
      onCategoryChange={onCategoryChange}
      onColorChange={onColorChange}
      onSizeChange={onSizeChange}
      onVolumeChange={onVolumeChange}
      {...overrides}
    />
  )

  return { onCategoryChange, onColorChange, onSizeChange, onVolumeChange }
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

    expect(onColorChange).toHaveBeenCalledWith('Розовый')
  })

  it('applies the selected size once Save is clicked inside the size dropdown', () => {
    const { onSizeChange } = renderFilterBar()

    fireEvent.click(screen.getByRole('button', { name: /размер/i }))
    fireEvent.click(screen.getByRole('button', { name: 'M' }))
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }))

    expect(onSizeChange).toHaveBeenCalledWith('M')
  })

  it('applies the entered volume range once Save is clicked', () => {
    const { onVolumeChange } = renderFilterBar()

    fireEvent.click(screen.getByRole('button', { name: /объём/i }))
    fireEvent.change(screen.getByPlaceholderText('От'), { target: { value: '300' } })
    fireEvent.change(screen.getByPlaceholderText('До'), { target: { value: '600' } })
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }))

    expect(onVolumeChange).toHaveBeenCalledWith('300', '600')
  })

  it('does not render a category dropdown when there are no category options', () => {
    renderFilterBar()

    expect(screen.queryByRole('button', { name: /категория/i })).not.toBeInTheDocument()
  })

  it('renders and applies a category dropdown when options are given', () => {
    const { onCategoryChange } = renderFilterBar({
      categoryOptions: [{ label: 'Drinkware', value: 'Drinkware' }],
    })

    fireEvent.click(screen.getByRole('button', { name: /категория/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Drinkware' }))
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }))

    expect(onCategoryChange).toHaveBeenCalledWith('Drinkware')
  })
})
