import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import FilterDropdown from '../../components/FilterDropdown'

const options = [
  { label: 'Чёрный', value: 'black' },
  { label: 'Белый', value: 'white' },
  { label: 'Розовый', value: 'pink' },
]

function renderDropdown(overrides: Partial<Parameters<typeof FilterDropdown>[0]> = {}) {
  const onApply = vi.fn()

  render(<FilterDropdown label="Цвет" options={options} value="" onApply={onApply} {...overrides} />)

  return { onApply }
}

describe('FilterDropdown', () => {
  it('renders the trigger with the filter label and hides the popover by default', () => {
    renderDropdown()

    expect(screen.getByRole('button', { name: 'Цвет' })).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('button', { name: 'Чёрный' })).not.toBeInTheDocument()
  })

  it('applies a pick at once and closes the list', () => {
    const { onApply } = renderDropdown()

    fireEvent.click(screen.getByRole('button', { name: 'Цвет' }))
    fireEvent.click(screen.getByRole('button', { name: 'Белый' }))

    expect(onApply).toHaveBeenCalledWith('white')
    expect(screen.queryByRole('button', { name: 'Чёрный' })).not.toBeInTheDocument()
  })

  it('names the active value on the trigger', () => {
    renderDropdown({ value: 'black' })

    expect(screen.getByRole('button', { name: 'Цвет: Чёрный' })).toHaveClass('bg-black')
  })

  it('clears the filter from «Любой» or by picking the active value again', () => {
    const { onApply } = renderDropdown({ value: 'black' })

    fireEvent.click(screen.getByRole('button', { name: 'Цвет: Чёрный' }))
    fireEvent.click(screen.getByRole('button', { name: 'Любой' }))
    expect(onApply).toHaveBeenLastCalledWith('')

    fireEvent.click(screen.getByRole('button', { name: 'Цвет: Чёрный' }))
    fireEvent.click(screen.getByRole('button', { name: 'Чёрный' }))
    expect(onApply).toHaveBeenLastCalledWith('')
  })

  it('closes without changing anything on an outside click or Escape', () => {
    const { onApply } = renderDropdown()

    fireEvent.click(screen.getByRole('button', { name: 'Цвет' }))
    fireEvent.mouseDown(document.body)
    expect(screen.queryByRole('button', { name: 'Чёрный' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Цвет' }))
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('button', { name: 'Чёрный' })).not.toBeInTheDocument()
    expect(onApply).not.toHaveBeenCalled()
  })
})
