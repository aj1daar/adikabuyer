import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { useRef, useState } from 'react'
import useDialog from '../../hooks/useDialog'

function Dialog({ label, onEscape, children }: { label: string; onEscape?: () => void; children?: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  useDialog(ref, true, onEscape)
  return (
    <div ref={ref} role="dialog" aria-label={label} tabIndex={-1}>
      {children}
    </div>
  )
}

function Harness({ onEscape }: { onEscape?: () => void }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        open
      </button>
      {open && (
        <Dialog label="outer" onEscape={onEscape ?? (() => setOpen(false))}>
          <button type="button">first</button>
          <button type="button">last</button>
        </Dialog>
      )}
    </>
  )
}

const flushFrame = () => act(() => vi.advanceTimersByTime(20))

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame'] })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useDialog', () => {
  it('moves focus into the dialog and back to the opener when it closes', () => {
    render(<Harness />)
    const opener = screen.getByRole('button', { name: 'open' })
    opener.focus()

    fireEvent.click(opener)
    flushFrame()
    expect(screen.getByRole('button', { name: 'first' })).toHaveFocus()

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(opener).toHaveFocus()
  })

  it('keeps Tab and Shift+Tab inside the dialog', () => {
    render(<Harness />)
    fireEvent.click(screen.getByRole('button', { name: 'open' }))
    flushFrame()
    const first = screen.getByRole('button', { name: 'first' })
    const last = screen.getByRole('button', { name: 'last' })

    last.focus()
    fireEvent.keyDown(document, { key: 'Tab' })
    expect(first).toHaveFocus()

    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true })
    expect(last).toHaveFocus()
  })

  it('lets only the topmost of stacked dialogs answer Escape', () => {
    const outer = vi.fn()
    const inner = vi.fn()
    // opened one after the other, like the cropper over the product form
    const { rerender } = render(<Dialog label="outer" onEscape={outer} />)
    rerender(
      <Dialog label="outer" onEscape={outer}>
        <Dialog label="inner" onEscape={inner}>
          <button type="button">inner button</button>
        </Dialog>
      </Dialog>,
    )

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(inner).toHaveBeenCalledTimes(1)
    expect(outer).not.toHaveBeenCalled()
  })

  it('ignores Escape when no handler is given', () => {
    render(
      <Dialog label="form">
        <button type="button">only</button>
      </Dialog>,
    )

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(screen.getByRole('dialog', { name: 'form' })).toBeInTheDocument()
  })
})
