import type { AxiosError } from 'axios'

export type ApiErrorBody = {
  message?: string
  fieldErrors?: Record<string, string>
}

// The backend speaks English; customers and the admin read Russian. Known server messages
// are matched by prefix (most carry an id suffix), everything else falls back by status.
const KNOWN_MESSAGES: [prefix: string, russian: string][] = [
  ['Not enough stock for variant', 'Столько нет в наличии — уменьшите количество в корзине.'],
  ['Variant is no longer available', 'Один из товаров закончился — уберите его из корзины.'],
  ['Variant out of stock', 'Один из товаров закончился — уберите его из корзины.'],
  ['Unknown variant', 'Один из товаров больше не продаётся — уберите его из корзины.'],
  ['Variant not found', 'Вариант не найден.'],
  ['Product not found', 'Товар не найден.'],
  ['Order not found', 'Заказ не найден.'],
  ['Too many orders', 'Слишком много заказов подряд. Попробуйте через несколько минут.'],
  ['Too many login attempts', 'Слишком много попыток входа. Подождите минуту.'],
  ['Invalid credentials', 'Неверный логин или пароль.'],
  ['Catalog service is unavailable', 'Сервис временно недоступен. Попробуйте ещё раз.'],
  ['Customer name is required', 'Укажите имя.'],
  ['One or more variant SKUs already exist', 'Такой артикул (SKU) уже есть у другого варианта.'],
  ['A product needs at least one variant', 'Добавьте хотя бы один вариант.'],
  ["This is the product's only variant", 'Это единственный вариант — удалите товар целиком.'],
  ['Only JPEG, PNG, GIF or WebP', 'Поддерживаются только JPEG, PNG, GIF и WebP.'],
  ['Uploaded file is not a supported image', 'Поддерживаются только JPEG, PNG, GIF и WebP.'],
  ['Uploaded file exceeds', 'Файл слишком большой — максимум 5 МБ.'],
  ['File is empty', 'Файл пустой.'],
  ['Invalid value for parameter', 'Некорректная ссылка.'],
]

const FIELD_MESSAGES: Record<string, string> = {
  customerPhone: 'Проверьте номер телефона — только цифры, пробелы, «+», скобки и дефис.',
  customerName: 'Укажите имя.',
  region: 'Выберите, как получить заказ.',
}

const STATUS_MESSAGES: Record<number, string> = {
  400: 'Проверьте введённые данные.',
  401: 'Сессия истекла. Войдите снова.',
  403: 'Недостаточно прав для этого действия.',
  404: 'Не найдено.',
  409: 'Данные изменились — обновите страницу и попробуйте снова.',
  413: 'Слишком большой запрос.',
  429: 'Слишком много запросов. Попробуйте чуть позже.',
}

export const FALLBACK_MESSAGE = 'Произошла ошибка. Попробуйте ещё раз.'

/** Russian, user-facing text for a failed API call — never the raw English server or axios message. */
export default function apiErrorMessage(error: unknown): string {
  const axiosError = error as AxiosError<ApiErrorBody> | undefined
  const status = axiosError?.response?.status
  if (!axiosError?.response) {
    return axiosError?.isAxiosError ? 'Нет связи с сервером. Проверьте интернет и попробуйте ещё раз.' : FALLBACK_MESSAGE
  }
  if (status === 401) {
    return STATUS_MESSAGES[401]
  }

  const body = axiosError.response.data
  const serverMessage = typeof body?.message === 'string' ? body.message : ''
  const known = KNOWN_MESSAGES.find(([prefix]) => serverMessage.startsWith(prefix))
  if (known) {
    return known[1]
  }

  const field = Object.keys(body?.fieldErrors ?? {}).find((name) => name in FIELD_MESSAGES)
  if (field) {
    return FIELD_MESSAGES[field]
  }

  if (status !== undefined && status >= 500) {
    return 'Сервис временно недоступен. Попробуйте ещё раз.'
  }
  return (status !== undefined && STATUS_MESSAGES[status]) || FALLBACK_MESSAGE
}
