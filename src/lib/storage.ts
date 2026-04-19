import type { UserStats } from '../types'

const USER_ID_KEY = 'sg_math_whiz_user_id'
const DISPLAY_NAME_KEY = 'sg_math_whiz_display_name'
const STATS_CACHE_KEY = 'sg_stats_cache'
const STATS_TTL_MS = 2 * 60 * 1000

export function getUserId(): string | null {
  return localStorage.getItem(USER_ID_KEY)
}

export function getDisplayName(): string | null {
  return localStorage.getItem(DISPLAY_NAME_KEY)
}

export function setUser(userId: string, displayName: string): void {
  localStorage.setItem(USER_ID_KEY, userId)
  localStorage.setItem(DISPLAY_NAME_KEY, displayName)
}

export function clearUser(): void {
  localStorage.removeItem(USER_ID_KEY)
  localStorage.removeItem(DISPLAY_NAME_KEY)
}

const ATTEMPTED_PREFIX = 'sg_math_whiz_attempted_'

export function markTodayAttempted(): void {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Singapore' })
  localStorage.setItem(ATTEMPTED_PREFIX + today, '1')
}

export function isTodayAttempted(): boolean {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Singapore' })
  return localStorage.getItem(ATTEMPTED_PREFIX + today) === '1'
}

export function getCachedStats(): UserStats | null {
  try {
    const raw = localStorage.getItem(STATS_CACHE_KEY)
    if (!raw) return null
    const { data, ts } = JSON.parse(raw)
    if (Date.now() - ts > STATS_TTL_MS) return null
    return data as UserStats
  } catch {
    return null
  }
}

export function setCachedStats(stats: UserStats): void {
  localStorage.setItem(STATS_CACHE_KEY, JSON.stringify({ data: stats, ts: Date.now() }))
}

export function clearCachedStats(): void {
  localStorage.removeItem(STATS_CACHE_KEY)
}
