import { describe, it, expect } from 'vitest'
import type { AxiosError } from 'axios'
import apiErrorMessage, { FALLBACK_MESSAGE, type ApiErrorBody } from '../../utils/apiErrorMessage'

function axiosError(status: number | undefined, data?: ApiErrorBody): AxiosError<ApiErrorBody> {
  return {
    isAxiosError: true,
    name: 'AxiosError',
    message: `Request failed with status code ${status}`,
    toJSON: () => ({}),
    response: status === undefined ? undefined : { status, data: data ?? {}, statusText: '', headers: {}, config: {} as never },
  } as AxiosError<ApiErrorBody>
}

describe('apiErrorMessage', () => {
  it.each([
    ['Not enough stock for variant: 152', 'Столько нет в наличии — уменьшите количество в корзине.'],
    ['Variant is no longer available: 143', 'Один из товаров закончился — уберите его из корзины.'],
    ['Product not found: 999999', 'Товар не найден.'],
    ['Too many orders. Please try again later.', 'Слишком много заказов подряд. Попробуйте через несколько минут.'],
    ["Invalid value for parameter 'id'", 'Некорректная ссылка.'],
  ])('translates "%s"', (serverMessage, russian) => {
    expect(apiErrorMessage(axiosError(409, { message: serverMessage }))).toBe(russian)
  })

  it('explains a rejected phone number from the checkout field errors', () => {
    const error = axiosError(400, { message: 'One or more fields are invalid', fieldErrors: { customerPhone: 'must be a phone number' } })

    expect(apiErrorMessage(error)).toBe('Проверьте номер телефона — только цифры, пробелы, «+», скобки и дефис.')
  })

  it('uses the status fallback for validation errors on fields it has no copy for', () => {
    const error = axiosError(400, { message: 'One or more fields are invalid', fieldErrors: { 'items[0].quantity': 'must be greater than 0' } })

    expect(apiErrorMessage(error)).toBe('Проверьте введённые данные.')
  })

  it('reports a rate limit in Russian', () => {
    expect(apiErrorMessage(axiosError(429))).toBe('Слишком много запросов. Попробуйте чуть позже.')
  })

  it('reports gateway failures as the service being unavailable', () => {
    expect(apiErrorMessage(axiosError(502, { message: 'Bad Gateway' }))).toBe('Сервис временно недоступен. Попробуйте ещё раз.')
  })

  it('falls back to a generic message for things that are not API errors', () => {
    expect(apiErrorMessage(new Error('boom'))).toBe(FALLBACK_MESSAGE)
    expect(apiErrorMessage(undefined)).toBe(FALLBACK_MESSAGE)
  })
})
