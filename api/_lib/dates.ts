/**
 * Get today's date in Singapore timezone (Asia/Singapore, UTC+8).
 * Returns YYYY-MM-DD string.
 */
export function getTodaySGT(): string {
  return new Date().toLocaleDateString('en-CA', {
    timeZone: 'Asia/Singapore',
  })
}
