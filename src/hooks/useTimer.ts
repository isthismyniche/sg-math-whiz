import { useCallback, useRef, useState } from 'react'

export function useTimer() {
  const [elapsedMs, setElapsedMs] = useState(0)
  const startTimeRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)
  const isRunningRef = useRef(false)

  const tick = useCallback(() => {
    if (!isRunningRef.current || startTimeRef.current === null) return
    setElapsedMs(performance.now() - startTimeRef.current)
    rafRef.current = requestAnimationFrame(tick)
  }, [])

  const start = useCallback(() => {
    if (isRunningRef.current) return
    isRunningRef.current = true
    startTimeRef.current = performance.now()
    rafRef.current = requestAnimationFrame(tick)
  }, [tick])

  const stop = useCallback(() => {
    isRunningRef.current = false
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    // Capture final time precisely
    if (startTimeRef.current !== null) {
      setElapsedMs(performance.now() - startTimeRef.current)
    }
  }, [])

  const reset = useCallback(() => {
    isRunningRef.current = false
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    startTimeRef.current = null
    setElapsedMs(0)
  }, [])

  return { elapsedMs, start, stop, reset }
}

/** Format milliseconds as M:SS.s (e.g., "1:23.4") for display */
export function formatTime(ms: number): string {
  const totalSeconds = ms / 1000
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  if (minutes > 0) {
    return `${minutes}:${String(Math.floor(seconds)).padStart(2, '0')}.${Math.floor((seconds % 1) * 10)}`
  }
  return `${seconds.toFixed(1)}s`
}
