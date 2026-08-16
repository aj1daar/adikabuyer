import axios from 'axios'
import notifyApiError from './notifyApiError'

const orderClient = axios.create({
  baseURL: import.meta.env.VITE_ORDER_API_URL ?? 'http://localhost:8080/api/orders',
  headers: {
    'Content-Type': 'application/json',
  },
})

orderClient.interceptors.response.use((response) => response, notifyApiError)

export default orderClient
