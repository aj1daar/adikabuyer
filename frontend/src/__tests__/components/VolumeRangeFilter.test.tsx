import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import VolumeRangeFilter from '../../components/VolumeRangeFilter'

describe('VolumeRangeFilter', () => {
  it('shows a plain Объём label when no range is set', () => {
    render(<VolumeRangeFilter min="" max="" onApply={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Объём' })).toBeInTheDocument()
  })

  it('shows the active range in the trigger label', () => {
    render(<VolumeRangeFilter min="300" max="600" onApply={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Объём: 300–600 мл' })).toBeInTheDocument()
  })

  it('applies the entered min and max once Save is clicked', () => {
    const onApply = vi.fn()
    render(<VolumeRangeFilter min="" max="" onApply={onApply} />)

    fireEvent.click(screen.getByRole('button', { name: 'Объём' }))
    fireEvent.change(screen.getByPlaceholderText('От'), { target: { value: '300' } })
    fireEvent.change(screen.getByPlaceholderText('До'), { target: { value: '600' } })
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }))

    expect(onApply).toHaveBeenCalledWith('300', '600')
  })

  it('applies empty strings when Сбросить is clicked', () => {
    const onApply = vi.fn()
    render(<VolumeRangeFilter min="300" max="600" onApply={onApply} />)

    fireEvent.click(screen.getByRole('button', { name: /объём/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Сбросить' }))
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }))

    expect(onApply).toHaveBeenCalledWith('', '')
  })

  it('closes when clicking outside the dropdown', () => {
    render(
      <div>
        <VolumeRangeFilter min="" max="" onApply={vi.fn()} />
        <button type="button">outside</button>
      </div>
    )

    fireEvent.click(screen.getByRole('button', { name: 'Объём' }))
    expect(screen.getByPlaceholderText('От')).toBeInTheDocument()

    fireEvent.mouseDown(screen.getByRole('button', { name: 'outside' }))
    expect(screen.queryByPlaceholderText('От')).not.toBeInTheDocument()
  })
})
