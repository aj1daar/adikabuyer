import axios from 'axios'

const orderClient = axios.create({
  baseURL: import.meta.env.VITE_ORDER_API_URL ?? 'http://localhost:8082/api/orders',
  headers: {
    'Content-Type': 'application/json',
  },
})

export default orderClient
