import axios from 'axios'
import { attachAuthHeader, handleAuthError } from './catalogClient'

const mediaClient = axios.create({
  baseURL: import.meta.env.VITE_MEDIA_API_URL ?? 'http://localhost:8080/api/media',
})

mediaClient.interceptors.request.use(attachAuthHeader)
mediaClient.interceptors.response.use((response) => response, handleAuthError)

export default mediaClient
