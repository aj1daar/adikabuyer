import axios from 'axios'
import { attachAuthHeader, handleAuthError } from './catalogClient'
import notifyApiError from './notifyApiError'

const orderClient = axios.create({
  baseURL: import.meta.env.VITE_ORDER_API_URL ?? 'http://localhost:8080/api/orders',
  headers: {
    'Content-Type': 'application/json',
  },
})

orderClient.interceptors.request.use(attachAuthHeader)
orderClient.interceptors.response.use((response) => response, handleAuthError)
orderClient.interceptors.response.use((response) => response, notifyApiError)

export default orderClient
