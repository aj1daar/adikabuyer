import toast from 'react-hot-toast'
import type { AxiosError } from 'axios'
import apiErrorMessage, { type ApiErrorBody } from '../utils/apiErrorMessage'

export default function notifyApiError(error: AxiosError<ApiErrorBody>): Promise<never> {
  if (error.code === 'ERR_CANCELED' || error.config?.skipErrorToast) {
    return Promise.reject(error)
  }

  toast.error(apiErrorMessage(error))

  return Promise.reject(error)
}
