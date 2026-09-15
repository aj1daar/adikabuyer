import { describe, it, expect } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import toast from 'react-hot-toast'
import SiteToaster from '../../components/SiteToaster'

describe('SiteToaster', () => {
  it('renders error toasts as bubblegum stickers with a hard ink shadow', async () => {
    render(<SiteToaster />)

    act(() => {
      toast.error('Товар не найден.')
    })

    const message = await screen.findByText('Товар не найден.')
    const bubble = message.closest('[role="status"]')?.parentElement as HTMLElement
    expect(bubble.style.border).toBe('2px solid rgb(10, 10, 10)')
    expect(bubble.style.boxShadow).toBe('4px 4px 0 0 #0A0A0A')
    expect(bubble.style.background).toContain('rgb(243, 169, 192)')
    act(() => toast.remove())
  })
})
