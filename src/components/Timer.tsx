import { useMemo } from 'react'

interface TimerProps {
  elapsedMs: number
}

export function Timer({ elapsedMs }: TimerProps) {
  const totalSeconds = Math.floor(elapsedMs / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  // Sweep hand: one full rotation per 60 seconds
  const sweepDegrees = useMemo(() => (totalSeconds % 60) * 6, [totalSeconds])

  // Always M:SS format for stable width
  const timeStr = `${minutes}:${String(seconds).padStart(2, '0')}`

  return (
    <div className="inline-flex items-center gap-3">
      {/* Analog clock face */}
      <svg
        width="44"
        height="44"
        viewBox="0 0 40 40"
        className="shrink-0"
        aria-hidden="true"
      >
        {/* Clock circle — pencil stroke style */}
        <circle
          cx="20"
          cy="20"
          r="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-text-secondary/40"
        />

        {/* Hour tick marks */}
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => {
          const angle = (i * 30 - 90) * (Math.PI / 180)
          const inner = i % 3 === 0 ? 13 : 14.5
          const outer = 16.5
          return (
            <line
              key={i}
              x1={20 + inner * Math.cos(angle)}
              y1={20 + inner * Math.sin(angle)}
              x2={20 + outer * Math.cos(angle)}
              y2={20 + outer * Math.sin(angle)}
              stroke="currentColor"
              strokeWidth={i % 3 === 0 ? '1.5' : '0.75'}
              className="text-text-secondary/30"
              strokeLinecap="round"
            />
          )
        })}

        {/* Center dot */}
        <circle
          cx="20"
          cy="20"
          r="1.5"
          className="fill-accent-amber"
        />

        {/* Sweep hand */}
        <line
          x1="20"
          y1="20"
          x2="20"
          y2="5.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          className="text-accent-amber"
          style={{
            transform: `rotate(${sweepDegrees}deg)`,
            transformOrigin: '20px 20px',
            transition: 'transform 1s linear',
          }}
        />
      </svg>

      {/* Digital readout — serif, quiet, fixed width */}
      <span className="font-serif text-xl text-text-secondary tracking-wide tabular-nums min-w-[3.5rem]">
        {timeStr}
      </span>
    </div>
  )
}
