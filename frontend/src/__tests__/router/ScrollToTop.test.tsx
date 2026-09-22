import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, act } from '@testing-library/react'
import { MemoryRouter, Routes, Route, useNavigate } from 'react-router-dom'
import ScrollToTop from '../../router/ScrollToTop'

let navigate: ReturnType<typeof useNavigate>

function NavigateGrabber() {
  navigate = useNavigate()
  return null
}

function renderApp() {
  render(
    <MemoryRouter initialEntries={['/catalog']}>
      <ScrollToTop />
      <NavigateGrabber />
      <Routes>
        <Route path="/catalog" element={<p>catalog</p>} />
        <Route path="/catalog/:id" element={<p>product</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

const scrollTo = vi.fn((options: ScrollToOptions) => {
  Object.defineProperty(window, 'scrollY', { value: options.top ?? 0, configurable: true })
})

const scrollPageTo = (y: number) => {
  Object.defineProperty(window, 'scrollY', { value: y, configurable: true })
  window.dispatchEvent(new Event('scroll'))
}

beforeEach(() => {
  window.scrollTo = scrollTo as unknown as typeof window.scrollTo
  scrollTo.mockClear()
  scrollPageTo(0)
})

afterEach(() => {
  scrollPageTo(0)
})

describe('ScrollToTop', () => {
  it('opens a new page at the top', () => {
    renderApp()
    scrollPageTo(1200)

    act(() => navigate('/catalog/5'))

    expect(scrollTo).toHaveBeenLastCalledWith({ top: 0, left: 0, behavior: 'instant' })
  })

  it('returns to the saved position when going back', () => {
    renderApp()
    scrollPageTo(1200)
    act(() => navigate('/catalog/5'))

    act(() => navigate(-1))

    expect(scrollTo).toHaveBeenLastCalledWith({ top: 1200, left: 0, behavior: 'instant' })
    expect(window.scrollY).toBe(1200)
  })

  it('leaves the scroll position alone when only the query string changes', () => {
    renderApp()
    scrollPageTo(800)
    scrollTo.mockClear()

    act(() => navigate('/catalog?color=Чёрный', { replace: true }))

    expect(scrollTo).not.toHaveBeenCalled()
  })
})
