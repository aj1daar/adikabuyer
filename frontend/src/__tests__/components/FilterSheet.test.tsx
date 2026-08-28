import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitForElementToBeRemoved } from '@testing-library/react'
import FilterSheet from '../../components/FilterSheet'
import useFilterSheetStore from '../../store/useFilterSheetStore'

function renderFilterSheet(overrides: Partial<Parameters<typeof FilterSheet>[0]> = {}) {
  const onCategoryChange = vi.fn()
  const onColorChange = vi.fn()
  const onSizeChange = vi.fn()
  const onVolumeChange = vi.fn()

  render(
    <FilterSheet
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

beforeEach(() => {
  useFilterSheetStore.setState({ isOpen: false })
})

describe('FilterSheet', () => {
  it('renders a mobile-only trigger button', () => {
    renderFilterSheet()

    expect(screen.getByRole('button', { name: 'Фильтры' })).toBeInTheDocument()
  })

  it('shows the active filter count on the trigger once a filter is applied', () => {
    renderFilterSheet({ color: 'Чёрный', size: 'M' })

    expect(screen.getByRole('button', { name: 'Фильтры (2)' })).toBeInTheDocument()
  })

  it('opens the sheet and marks the filter-sheet store open', () => {
    renderFilterSheet()

    fireEvent.click(screen.getByRole('button', { name: 'Фильтры' }))

    expect(screen.getByRole('dialog', { name: 'Фильтры' })).toBeInTheDocument()
    expect(useFilterSheetStore.getState().isOpen).toBe(true)
  })

  it('keeps each filter group collapsed as a dropdown until its header is tapped', () => {
    renderFilterSheet()

    fireEvent.click(screen.getByRole('button', { name: 'Фильтры' }))

    expect(screen.queryByRole('button', { name: 'Чёрный' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Цвет' }))
    expect(screen.getByRole('button', { name: 'Чёрный' })).toBeInTheDocument()
  })

  it('closes without applying when Закрыть is clicked, discarding the draft', async () => {
    const { onColorChange } = renderFilterSheet()

    fireEvent.click(screen.getByRole('button', { name: 'Фильтры' }))
    fireEvent.click(screen.getByRole('button', { name: 'Цвет' }))
    fireEvent.click(screen.getByRole('button', { name: 'Чёрный' }))
    fireEvent.click(screen.getByRole('button', { name: 'Закрыть' }))

    expect(onColorChange).not.toHaveBeenCalled()
    expect(useFilterSheetStore.getState().isOpen).toBe(false)
    await waitForElementToBeRemoved(() => screen.queryByRole('dialog'))
  })

  it('applies every selected filter at once when confirmed', () => {
    const { onCategoryChange, onColorChange, onSizeChange, onVolumeChange } = renderFilterSheet({
      categoryOptions: [{ label: 'Drinkware', value: 'Drinkware' }],
    })

    fireEvent.click(screen.getByRole('button', { name: 'Фильтры' }))
    fireEvent.click(screen.getByRole('button', { name: 'Категория' }))
    fireEvent.click(screen.getByRole('button', { name: 'Drinkware' }))
    fireEvent.click(screen.getByRole('button', { name: 'Цвет' }))
    fireEvent.click(screen.getByRole('button', { name: 'Чёрный' }))
    fireEvent.click(screen.getByRole('button', { name: 'Размер' }))
    fireEvent.click(screen.getByRole('button', { name: 'M' }))
    fireEvent.click(screen.getByRole('button', { name: 'Объём' }))
    fireEvent.change(screen.getByPlaceholderText('От'), { target: { value: '300' } })
    fireEvent.change(screen.getByPlaceholderText('До'), { target: { value: '600' } })
    fireEvent.click(screen.getByRole('button', { name: 'Показать товары' }))

    expect(onCategoryChange).toHaveBeenCalledWith('Drinkware')
    expect(onColorChange).toHaveBeenCalledWith('Чёрный')
    expect(onSizeChange).toHaveBeenCalledWith('M')
    expect(onVolumeChange).toHaveBeenCalledWith('300', '600')
    expect(useFilterSheetStore.getState().isOpen).toBe(false)
  })

  it('deselects an option when tapped again before confirming', () => {
    const { onColorChange } = renderFilterSheet()

    fireEvent.click(screen.getByRole('button', { name: 'Фильтры' }))
    fireEvent.click(screen.getByRole('button', { name: 'Цвет' }))
    const option = screen.getByRole('button', { name: 'Чёрный' })
    fireEvent.click(option)
    fireEvent.click(option)
    fireEvent.click(screen.getByRole('button', { name: 'Показать товары' }))

    expect(onColorChange).toHaveBeenCalledWith('')
  })

  it('resets the draft selection without touching applied filters until confirmed', () => {
    const { onColorChange } = renderFilterSheet()

    fireEvent.click(screen.getByRole('button', { name: 'Фильтры' }))
    fireEvent.click(screen.getByRole('button', { name: 'Цвет' }))
    fireEvent.click(screen.getByRole('button', { name: 'Чёрный' }))
    fireEvent.click(screen.getByRole('button', { name: 'Сбросить' }))
    fireEvent.click(screen.getByRole('button', { name: 'Показать товары' }))

    expect(onColorChange).toHaveBeenCalledWith('')
  })

  it('does not render a category section when there are no category options', () => {
    renderFilterSheet()

    fireEvent.click(screen.getByRole('button', { name: 'Фильтры' }))

    expect(screen.queryByRole('button', { name: 'Категория' })).not.toBeInTheDocument()
  })
})
