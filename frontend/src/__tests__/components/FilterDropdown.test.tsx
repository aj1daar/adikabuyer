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

    expect(screen.getByRole('button', { name: /цвет/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Чёрный' })).not.toBeInTheDocument()
  })

  it('opens the popover and rotates the chevron when the trigger is clicked', () => {
    renderDropdown()

    const trigger = screen.getByRole('button', { name: /цвет/i })
    fireEvent.click(trigger)

    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('button', { name: 'Чёрный' })).toBeInTheDocument()
    expect(trigger.querySelector('svg')).toHaveClass('rotate-180')
  })

  it('does not call onApply until Save is clicked', () => {
    const { onApply } = renderDropdown()

    fireEvent.click(screen.getByRole('button', { name: /цвет/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Белый' }))

    expect(onApply).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }))

    expect(onApply).toHaveBeenCalledWith('white')
  })

  it('closes the popover after Save', () => {
    renderDropdown()

    fireEvent.click(screen.getByRole('button', { name: /цвет/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Белый' }))
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }))

    expect(screen.queryByRole('button', { name: 'Белый' })).not.toBeInTheDocument()
  })

  it('clears the local selection when Reset is clicked, without applying it', () => {
    const { onApply } = renderDropdown({ value: 'pink' })

    fireEvent.click(screen.getByRole('button', { name: /цвет/i }))
    expect(screen.getByRole('button', { name: 'Розовый' })).toHaveAttribute('aria-pressed', 'true')

    fireEvent.click(screen.getByRole('button', { name: 'Сбросить' }))

    expect(screen.getByRole('button', { name: 'Розовый' })).toHaveAttribute('aria-pressed', 'false')
    expect(onApply).not.toHaveBeenCalled()
  })

  it('discards the draft and restores the applied value when reopened after clicking outside', () => {
    renderDropdown({ value: 'black' })

    fireEvent.click(screen.getByRole('button', { name: /цвет/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Розовый' }))
    fireEvent.mouseDown(document.body)

    expect(screen.queryByRole('button', { name: 'Розовый' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /цвет/i }))

    expect(screen.getByRole('button', { name: 'Чёрный' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Розовый' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('shows the trigger as active once a value is applied', () => {
    renderDropdown({ value: 'black' })

    expect(screen.getByRole('button', { name: /цвет/i })).toHaveClass('bg-black')
  })
})
