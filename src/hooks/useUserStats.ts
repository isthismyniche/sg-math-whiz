import { useEffect, useState } from 'react'
import { apiGet } from '../lib/api'
import { getCachedStats, setCachedStats } from '../lib/storage'
import type { UserStats } from '../types'

export function useUserStats() {
  const cached = getCachedStats()
  const [stats, setStats] = useState<UserStats | null>(cached)
  const [isLoading, setIsLoading] = useState(cached === null)

  useEffect(() => {
    apiGet<UserStats>('/api/me')
      .then((data) => {
        setStats(data)
        setCachedStats(data)
      })
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  return { stats, isLoading }
}
