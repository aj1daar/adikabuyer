import authClient from './authClient'
import type { LoginRequest, LoginResponse } from '../types/auth'

export default async function login(payload: LoginRequest): Promise<LoginResponse> {
  const response = await authClient.post<LoginResponse>('/login', payload)
  return response.data
}
