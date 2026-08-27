import { useCallback, useEffect, useState } from 'react'
import getTelegramAdmins from '../api/telegramAdmins'
import type { TelegramAdminDto } from '../types/telegramAdmin'

type UseTelegramAdminsResult = {
  admins: TelegramAdminDto[]
  loading: boolean
  error: string | null
  refetch: () => void
}

export default function useTelegramAdmins(enabled: boolean): UseTelegramAdminsResult {
  const [admins, setAdmins] = useState<TelegramAdminDto[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAdmins = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getTelegramAdmins()
      setAdmins(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить список подписчиков')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (enabled) {
      fetchAdmins()
    }
  }, [enabled, fetchAdmins])

  return { admins, loading, error, refetch: fetchAdmins }
}
