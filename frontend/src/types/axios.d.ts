import 'axios'

declare module 'axios' {
  interface AxiosRequestConfig {
    /** The caller shows the error inline itself, so `notifyApiError` skips its toast. */
    skipErrorToast?: boolean
  }
}
