import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ConfirmDialog from '../../../components/admin/ConfirmDialog'

function renderDialog(busy = false) {
  const props = { onConfirm: vi.fn(), onCancel: vi.fn() }
  render(<ConfirmDialog open title="Удалить заказ №1042?" message="Навсегда." busy={busy} {...props} />)
  return props
}

describe('ConfirmDialog', () => {
  it('is a labelled modal dialog', () => {
    renderDialog()

    expect(screen.getByRole('dialog', { name: 'Удалить заказ №1042?' })).toHaveAttribute('aria-modal', 'true')
  })

  it('cancels on Escape', () => {
    const { onCancel, onConfirm } = renderDialog()

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('ignores Escape while the action is in flight', () => {
    const { onCancel } = renderDialog(true)

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(onCancel).not.toHaveBeenCalled()
  })
})
