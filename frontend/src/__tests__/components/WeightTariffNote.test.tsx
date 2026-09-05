import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, waitForElementToBeRemoved } from '@testing-library/react'
import WeightTariffNote from '../../components/WeightTariffNote'
import { WEIGHT_STEPS } from '../../utils/weightSurcharge'

describe('WeightTariffNote', () => {
  it('keeps the tariff behind a quiet trigger until it is asked for', () => {
    render(<WeightTariffNote />)

    expect(screen.getByRole('button', { name: /тариф за вес/i })).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('opens the shop price list with every weight step', () => {
    render(<WeightTariffNote />)
    fireEvent.click(screen.getByRole('button', { name: /тариф за вес/i }))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('0,1 кг')).toBeInTheDocument()
    expect(screen.getByText('110 KGS')).toBeInTheDocument()
    expect(screen.getByText('0,9 кг')).toBeInTheDocument()
    expect(screen.getByText('970 KGS')).toBeInTheDocument()
    expect(screen.getByText(/от 1\s*кг цена договорная/i)).toBeInTheDocument()
  })

  it('quotes the shop table verbatim, rounded by hand rather than computed', () => {
    expect(WEIGHT_STEPS.map((step) => step.fee)).toEqual([110, 220, 330, 440, 550, 650, 750, 870, 970])
  })

  it('escapes its container: the sheet is portalled straight to the body', () => {
    // it opens from inside the cart drawer, whose transform would otherwise trap a
    // position:fixed child inside the drawer's own box
    const { container } = render(<WeightTariffNote />)
    fireEvent.click(screen.getByRole('button', { name: /тариф за вес/i }))

    const dialog = screen.getByRole('dialog')
    expect(container.contains(dialog)).toBe(false)
    expect(document.body.contains(dialog)).toBe(true)
  })

  it('locks the page behind it while open and gives the scroll back on close', async () => {
    render(<WeightTariffNote />)
    fireEvent.click(screen.getByRole('button', { name: /тариф за вес/i }))
    expect(document.body.style.overflow).toBe('hidden')

    fireEvent.click(screen.getByRole('button', { name: 'Понятно' }))
    await waitForElementToBeRemoved(() => screen.queryByRole('dialog'))
    expect(document.body.style.overflow).not.toBe('hidden')
  })

  it('closes again on Понятно', async () => {
    render(<WeightTariffNote />)
    fireEvent.click(screen.getByRole('button', { name: /тариф за вес/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Понятно' }))

    // the exit animation keeps the node around for a beat before it unmounts
    await waitForElementToBeRemoved(() => screen.queryByRole('dialog'))
  })
})
