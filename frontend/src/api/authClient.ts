import axios from 'axios'

const authClient = axios.create({
  baseURL: import.meta.env.VITE_AUTH_API_URL ?? 'http://localhost:8080/api/auth',
  headers: {
    'Content-Type': 'application/json',
  },
})

export default authClient
