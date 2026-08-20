import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import OptionDropdown from './OptionDropdown'

const options = [
  { label: 'Чёрный', value: 'black' },
  { label: 'Белый', value: 'white' },
]

describe('OptionDropdown', () => {
  it('shows the placeholder when nothing is selected', () => {
    render(<OptionDropdown options={options} value="" onChange={vi.fn()} placeholder="Выберите" />)

    expect(screen.getByText('Выберите')).toBeInTheDocument()
    expect(screen.queryByText('Белый')).not.toBeInTheDocument()
  })

  it('shows the selected option label as the trigger, not its value', () => {
    render(<OptionDropdown options={options} value="black" onChange={vi.fn()} placeholder="Выберите" />)

    expect(screen.getByRole('button', { name: 'Чёрный' })).toBeInTheDocument()
  })

  it('opens the option list on click and shows every option label', () => {
    render(<OptionDropdown options={options} value="" onChange={vi.fn()} placeholder="Выберите" />)

    fireEvent.click(screen.getByRole('button', { name: 'Выберите' }))

    expect(screen.getByRole('button', { name: 'Чёрный' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Белый' })).toBeInTheDocument()
  })

  it('calls onChange with the option value and closes the list', () => {
    const onChange = vi.fn()
    render(<OptionDropdown options={options} value="" onChange={onChange} placeholder="Выберите" />)

    fireEvent.click(screen.getByRole('button', { name: 'Выберите' }))
    fireEvent.click(screen.getByRole('button', { name: 'Белый' }))

    expect(onChange).toHaveBeenCalledWith('white')
    expect(screen.queryByRole('button', { name: 'Чёрный' })).not.toBeInTheDocument()
  })

  it('marks the selected option as pressed in the list', () => {
    render(<OptionDropdown options={options} value="white" onChange={vi.fn()} placeholder="Выберите" />)

    fireEvent.click(screen.getByRole('button', { name: 'Белый' }))

    expect(screen.getByRole('button', { name: 'Белый', pressed: true })).toBeInTheDocument()
  })

  it('closes when clicking outside the dropdown', () => {
    render(
      <div>
        <OptionDropdown options={options} value="" onChange={vi.fn()} placeholder="Выберите" />
        <button type="button">outside</button>
      </div>
    )

    fireEvent.click(screen.getByRole('button', { name: 'Выберите' }))
    expect(screen.getByRole('button', { name: 'Белый' })).toBeInTheDocument()

    fireEvent.mouseDown(screen.getByRole('button', { name: 'outside' }))
    expect(screen.queryByRole('button', { name: 'Белый' })).not.toBeInTheDocument()
  })
})
