import orderClient from './orderClient'
import type { TelegramAdminDto } from '../types/telegramAdmin'

export default async function getTelegramAdmins(): Promise<TelegramAdminDto[]> {
  const response = await orderClient.get<TelegramAdminDto[]>('/telegram-admins')
  return response.data
}
