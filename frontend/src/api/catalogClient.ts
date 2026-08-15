import axios from 'axios'

const catalogClient = axios.create({
  baseURL: import.meta.env.VITE_CATALOG_API_URL ?? 'http://localhost:8081/api/catalog',
  headers: {
    'Content-Type': 'application/json',
  },
})

export default catalogClient
