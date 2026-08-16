import mediaClient from './mediaClient'
import type { MediaUploadResponse } from '../types/media'

export default async function uploadMedia(file: File): Promise<MediaUploadResponse> {
  const formData = new FormData()
  formData.append('file', file)
  const response = await mediaClient.post<MediaUploadResponse>('/upload', formData)
  return response.data
}
