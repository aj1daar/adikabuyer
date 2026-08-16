import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SearchBar from './SearchBar'

describe('SearchBar', () => {
  it('renders the current value', () => {
    render(<SearchBar value="tumbler" onChange={vi.fn()} />)

    expect(screen.getByPlaceholderText('Искать товары...')).toHaveValue('tumbler')
  })

  it('calls onChange when typing', () => {
    const onChange = vi.fn()
    render(<SearchBar value="" onChange={onChange} />)

    fireEvent.change(screen.getByPlaceholderText('Искать товары...'), { target: { value: 'cup' } })

    expect(onChange).toHaveBeenCalledWith('cup')
  })

  it('does not show the clear button when the value is empty', () => {
    render(<SearchBar value="" onChange={vi.fn()} />)

    expect(screen.queryByLabelText('Очистить поиск')).not.toBeInTheDocument()
  })

  it('clears the value when the clear button is clicked', () => {
    const onChange = vi.fn()
    render(<SearchBar value="tumbler" onChange={onChange} />)

    fireEvent.click(screen.getByLabelText('Очистить поиск'))

    expect(onChange).toHaveBeenCalledWith('')
  })
})
