import { describe, it, expect } from 'vitest'
import pluralRu from '../../utils/pluralRu'

const forms: [string, string, string] = ['товар', 'товара', 'товаров']

describe('pluralRu', () => {
  it('picks the right Russian form', () => {
    expect([0, 1, 2, 4, 5, 11, 12, 14, 21, 22, 25, 101, 111].map((n) => pluralRu(n, forms))).toEqual([
      'товаров', 'товар', 'товара', 'товара', 'товаров', 'товаров', 'товаров', 'товаров', 'товар', 'товара', 'товаров', 'товар', 'товаров',
    ])
  })
})
