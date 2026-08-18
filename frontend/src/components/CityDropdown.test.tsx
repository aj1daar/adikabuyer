import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CityDropdown from './CityDropdown'

const cities = ['Бишкек', 'Ош', 'Талас'] as const

describe('CityDropdown', () => {
  it('shows the placeholder when nothing is selected', () => {
    render(<CityDropdown cities={cities} value="" onChange={vi.fn()} placeholder="Город доставки" />)

    expect(screen.getByText('Город доставки')).toBeInTheDocument()
    expect(screen.queryByText('Ош')).not.toBeInTheDocument()
  })

  it('opens the option list on click and shows every city', () => {
    render(<CityDropdown cities={cities} value="" onChange={vi.fn()} placeholder="Город доставки" />)

    fireEvent.click(screen.getByRole('button', { name: 'Город доставки' }))

    expect(screen.getByRole('button', { name: 'Бишкек' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ош' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Талас' })).toBeInTheDocument()
  })

  it('calls onChange with the picked city and closes the list', () => {
    const onChange = vi.fn()
    render(<CityDropdown cities={cities} value="" onChange={onChange} placeholder="Город доставки" />)

    fireEvent.click(screen.getByRole('button', { name: 'Город доставки' }))
    fireEvent.click(screen.getByRole('button', { name: 'Ош' }))

    expect(onChange).toHaveBeenCalledWith('Ош')
    expect(screen.queryByRole('button', { name: 'Талас' })).not.toBeInTheDocument()
  })

  it('shows the selected city as the trigger label and marks it pressed in the list', () => {
    render(<CityDropdown cities={cities} value="Ош" onChange={vi.fn()} placeholder="Город доставки" />)

    expect(screen.getByRole('button', { name: 'Ош' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Ош' }))

    expect(screen.getByRole('button', { name: 'Ош', pressed: true })).toBeInTheDocument()
  })

  it('closes when clicking outside the dropdown', () => {
    render(
      <div>
        <CityDropdown cities={cities} value="" onChange={vi.fn()} placeholder="Город доставки" />
        <button type="button">outside</button>
      </div>
    )

    fireEvent.click(screen.getByRole('button', { name: 'Город доставки' }))
    expect(screen.getByRole('button', { name: 'Талас' })).toBeInTheDocument()

    fireEvent.mouseDown(screen.getByRole('button', { name: 'outside' }))
    expect(screen.queryByRole('button', { name: 'Талас' })).not.toBeInTheDocument()
  })
})
