import { formatTime } from '../hooks/useTimer'

interface TimerProps {
  elapsedMs: number
  size?: 'sm' | 'lg'
}

export function Timer({ elapsedMs, size = 'lg' }: TimerProps) {
  const sizeClasses = size === 'lg' ? 'text-3xl' : 'text-xl'

  return (
    <div
      className={`font-mono ${sizeClasses} font-bold text-accent-amber tabular-nums`}
    >
      {formatTime(elapsedMs)}
    </div>
  )
}
