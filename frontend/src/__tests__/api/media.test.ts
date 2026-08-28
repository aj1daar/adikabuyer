import { describe, it, expect, vi, beforeEach } from 'vitest'
import uploadMedia from '../../api/media'
import mediaClient from '../../api/mediaClient'
import type { MediaUploadResponse } from '../../types/media'

vi.mock('../../api/mediaClient', () => ({
  default: { post: vi.fn() },
}))

const mockedPost = vi.mocked(mediaClient.post)

const response: MediaUploadResponse = { url: 'http://localhost:9000/adikabuyer-media/photo.png' }

beforeEach(() => {
  mockedPost.mockReset()
})

describe('uploadMedia', () => {
  it('posts the file as multipart form data to the upload endpoint', async () => {
    mockedPost.mockResolvedValueOnce({ data: response } as never)
    const file = new File(['content'], 'photo.png', { type: 'image/png' })

    await uploadMedia(file)

    expect(mockedPost).toHaveBeenCalledTimes(1)
    const [url, formData] = mockedPost.mock.calls[0]
    expect(url).toBe('/upload')
    expect(formData).toBeInstanceOf(FormData)
    expect((formData as FormData).get('file')).toBe(file)
  })

  it('resolves with the response data', async () => {
    mockedPost.mockResolvedValueOnce({ data: response } as never)
    const file = new File(['content'], 'photo.png', { type: 'image/png' })

    const result = await uploadMedia(file)

    expect(result).toEqual(response)
  })

  it('propagates the error when the upload fails', async () => {
    mockedPost.mockRejectedValueOnce(new Error('Upload failed'))
    const file = new File(['content'], 'photo.png', { type: 'image/png' })

    await expect(uploadMedia(file)).rejects.toThrow('Upload failed')
  })
})
