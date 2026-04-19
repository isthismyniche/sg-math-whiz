import { useEffect, useState } from 'react'
import { apiGet } from '../lib/api'
import { isTodayAttempted } from '../lib/storage'
import type { UserStats } from '../types'

export function useUserStats() {
  const [stats, setStats] = useState<UserStats | null>(() => {
    // Optimistic: if localStorage says we attempted today, reflect that immediately
    if (isTodayAttempted()) {
      return { displayName: '', currentStreak: 0, bestStreak: 0, totalAttempts: 0, totalCorrect: 0, attemptedToday: true }
    }
    return null
  })
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
