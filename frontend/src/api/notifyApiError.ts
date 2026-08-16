import toast from 'react-hot-toast'
import type { AxiosError } from 'axios'

type ApiErrorBody = {
  message?: string
}

export default function notifyApiError(error: AxiosError<ApiErrorBody>): Promise<never> {
  const status = error.response?.status

  if (status === 401) {
    toast.error('Сессия истекла. Войдите снова.')
  } else {
    const message = error.response?.data?.message
    toast.error(message ?? 'Произошла ошибка. Попробуйте ещё раз.')
  }

  return Promise.reject(error)
}
