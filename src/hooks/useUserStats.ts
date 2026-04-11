import { useEffect, useState } from 'react'
import { apiGet } from '../lib/api'
import type { UserStats } from '../types'

export function useUserStats() {
  const [stats, setStats] = useState<UserStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    apiGet<UserStats>('/api/me')
      .then(setStats)
      .catch(() => {
        // silently fail — streak will show as 0
      })
      .finally(() => setIsLoading(false))
  }, [])

  return { stats, isLoading }
}
