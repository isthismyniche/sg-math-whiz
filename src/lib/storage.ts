const USER_ID_KEY = 'sg_math_whiz_user_id'
const DISPLAY_NAME_KEY = 'sg_math_whiz_display_name'

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
