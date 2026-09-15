import { useCallback, useEffect, useState } from 'react'
import getOrders from '../api/adminOrders'
import type { OrderDto } from '../types/order'
import apiErrorMessage from '../utils/apiErrorMessage'

type UseOrdersResult = {
  orders: OrderDto[]
  loading: boolean
  error: string | null
  refetch: () => void
}

export default function useOrders(enabled: boolean): UseOrdersResult {
  const [orders, setOrders] = useState<OrderDto[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getOrders()
      setOrders(data)
    } catch (err) {
      setError(apiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (enabled) {
      fetchOrders()
    }
  }, [enabled, fetchOrders])

  return { orders, loading, error, refetch: fetchOrders }
}
