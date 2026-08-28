import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import Pagination from '../../components/Pagination'

describe('Pagination', () => {
  it('renders nothing when everything fits on a single page', () => {
    const { container } = render(
      <Pagination page={0} pageSize={12} totalCount={10} onPageChange={vi.fn()} />
    )

    expect(container).toBeEmptyDOMElement()
  })

  it('renders a button per page and marks the current one', () => {
    render(<Pagination page={1} pageSize={12} totalCount={36} onPageChange={vi.fn()} />)

    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '2' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('button', { name: '3' })).toBeInTheDocument()
  })

  it('calls onPageChange with the clicked page number', () => {
    const onPageChange = vi.fn()
    render(<Pagination page={0} pageSize={12} totalCount={36} onPageChange={onPageChange} />)

    screen.getByRole('button', { name: '3' }).click()

    expect(onPageChange).toHaveBeenCalledWith(2)
  })

  it('disables the previous button on the first page and the next button on the last page', () => {
    const { rerender } = render(
      <Pagination page={0} pageSize={12} totalCount={36} onPageChange={vi.fn()} />
    )
    expect(screen.getByRole('button', { name: 'Предыдущая страница' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Следующая страница' })).not.toBeDisabled()

    rerender(<Pagination page={2} pageSize={12} totalCount={36} onPageChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Предыдущая страница' })).not.toBeDisabled()
    expect(screen.getByRole('button', { name: 'Следующая страница' })).toBeDisabled()
  })

  it('collapses distant page numbers behind an ellipsis', () => {
    render(<Pagination page={0} pageSize={12} totalCount={12 * 20} onPageChange={vi.fn()} />)

    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '20' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '10' })).not.toBeInTheDocument()
    expect(screen.getAllByText('…').length).toBeGreaterThan(0)
  })
})
