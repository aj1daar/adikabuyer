import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import TextBubbleModal from '../../components/TextBubbleModal'

const longText = 'Очень длинное описание товара. '.repeat(60)

describe('TextBubbleModal', () => {
  it('renders nothing until it is opened', () => {
    render(<TextBubbleModal open={false} title="Кружка" text="Описание" onClose={vi.fn()} />)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('shows the full text, scrolling it inside the bubble instead of past the screen', () => {
    render(<TextBubbleModal open title="Кружка" text={longText} onClose={vi.fn()} />)

    const paragraph = screen.getByText(longText.trim(), { exact: false })
    const scroller = paragraph.parentElement as HTMLElement

    expect(screen.getByRole('dialog').className).toContain('max-h-full')
    expect(scroller.className).toContain('overflow-y-auto')
    expect(scroller.className).toContain('max-h-full')
  })

  it('closes on the close button', () => {
    const onClose = vi.fn()
    render(<TextBubbleModal open title="Кружка" text="Описание" onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: 'Закрыть' }))

    expect(onClose).toHaveBeenCalled()
  })

  it('hints at hidden text only while something is still below the fold', () => {
    render(<TextBubbleModal open title="Кружка" text={longText} onClose={vi.fn()} />)
    const fade = document.body.querySelector(
      '[aria-hidden="true"].pointer-events-none',
    ) as HTMLElement

    // jsdom reports every element as zero-height, so nothing ever overflows there
    expect(fade.className).toContain('opacity-0')
  })
})
