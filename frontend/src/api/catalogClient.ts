import axios, { type InternalAxiosRequestConfig } from 'axios'
import useAuthStore from '../store/useAuthStore'

const catalogClient = axios.create({
  baseURL: import.meta.env.VITE_CATALOG_API_URL ?? 'http://localhost:8080/api/catalog',
  headers: {
    'Content-Type': 'application/json',
  },
})

export function attachAuthHeader(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}

export function handleAuthError(error: { response?: { status?: number } }): Promise<never> {
  if (error.response?.status === 401) {
    useAuthStore.getState().clearToken()
  }
  return Promise.reject(error)
}

catalogClient.interceptors.request.use(attachAuthHeader)
catalogClient.interceptors.response.use((response) => response, handleAuthError)

export default catalogClient
