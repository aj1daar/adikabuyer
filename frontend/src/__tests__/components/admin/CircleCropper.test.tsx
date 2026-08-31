import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CircleCropper from '../../../components/admin/CircleCropper'

const file = new File(['x'], 'photo.png', { type: 'image/png' })

describe('CircleCropper', () => {
  it('renders the title and a zoom control', () => {
    render(<CircleCropper file={file} title="Кружок цвета: Чёрный" onCancel={vi.fn()} onConfirm={vi.fn()} />)

    expect(screen.getByText('Кружок цвета: Чёрный')).toBeInTheDocument()
    expect(screen.getByRole('slider', { name: /приблизить/i })).toBeInTheDocument()
  })

  it('calls onCancel when Отмена is clicked', () => {
    const onCancel = vi.fn()
    render(<CircleCropper file={file} onCancel={onCancel} onConfirm={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: /отмена/i }))

    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('disables the confirm button while busy', () => {
    render(<CircleCropper file={file} busy onCancel={vi.fn()} onConfirm={vi.fn()} />)

    expect(screen.getByRole('button', { name: /загрузка/i })).toBeDisabled()
  })

  it('zooms in when two pointers spread apart (pinch)', () => {
    const { container } = render(
      <CircleCropper file={file} onCancel={vi.fn()} onConfirm={vi.fn()} />
    )
    const surface = container.querySelector('.touch-none') as HTMLElement
    const slider = screen.getByRole('slider', { name: /приблизить/i }) as HTMLInputElement

    expect(Number(slider.value)).toBe(1)

    fireEvent.pointerDown(surface, { pointerId: 1, clientX: 120, clientY: 130 })
    fireEvent.pointerDown(surface, { pointerId: 2, clientX: 140, clientY: 130 })
    fireEvent.pointerMove(surface, { pointerId: 2, clientX: 200, clientY: 130 })

    expect(Number(slider.value)).toBeGreaterThan(1)
  })
})
