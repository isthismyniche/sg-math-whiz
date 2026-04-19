import { useEffect, useState } from 'react'

interface AnswerDistributionProps {
  correctCount: number
  wrongCount: number
}

const R = 54
const STROKE_WIDTH = 20
const CENTER = 80
const CIRCUMFERENCE = 2 * Math.PI * R
const GAP = 8

export function AnswerDistribution({ correctCount, wrongCount }: AnswerDistributionProps) {
  const [animated, setAnimated] = useState(false)
  const total = correctCount + wrongCount

  useEffect(() => {
    const id = requestAnimationFrame(() => setAnimated(true))
    return () => cancelAnimationFrame(id)
  }, [])

  if (total === 0) return null

  const correctPct = correctCount / total
  const wrongPct = wrongCount / total

  // Arc lengths minus half a gap on each side
  const correctArc = Math.max(0, correctPct * CIRCUMFERENCE - GAP)
  const wrongArc = Math.max(0, wrongPct * CIRCUMFERENCE - GAP)

  // Offset: correct starts at top (−90°), wrong follows
  const correctOffset = CIRCUMFERENCE * 0.25 + GAP / 2
  const wrongOffset = correctOffset - correctPct * CIRCUMFERENCE

  const displayPct = Math.round(correctPct * 100)

  return (
    <div className="mt-8">
      <h2 className="font-display text-2xl text-text-primary mb-5">
        How everyone did today
      </h2>

      <div className="bg-bg-card rounded-2xl p-6 flex flex-col items-center gap-6">
        {/* Donut */}
        <div className="relative" style={{ width: 160, height: 160 }}>
          <svg
            width="160"
            height="160"
            viewBox="0 0 160 160"
            style={{ transform: 'rotate(0deg)' }}
          >
            {/* Track */}
            <circle
              cx={CENTER}
              cy={CENTER}
              r={R}
              fill="none"
              stroke="var(--color-bg-secondary)"
              strokeWidth={STROKE_WIDTH}
            />
            {/* Wrong arc */}
            {wrongCount > 0 && (
              <circle
                cx={CENTER}
                cy={CENTER}
                r={R}
                fill="none"
                stroke="var(--color-accent-red)"
                strokeWidth={STROKE_WIDTH}
                strokeLinecap="butt"
                strokeDasharray={`${animated ? wrongArc : 0} ${CIRCUMFERENCE}`}
                strokeDashoffset={wrongOffset}
                style={{
                  transition: animated ? 'stroke-dasharray 0.8s cubic-bezier(0.4,0,0.2,1) 0.15s' : 'none',
                  transform: 'rotate(-90deg)',
                  transformOrigin: '80px 80px',
                }}
              />
            )}
            {/* Correct arc (on top) */}
            {correctCount > 0 && (
              <circle
                cx={CENTER}
                cy={CENTER}
                r={R}
                fill="none"
                stroke="var(--color-success)"
                strokeWidth={STROKE_WIDTH}
                strokeLinecap="butt"
                strokeDasharray={`${animated ? correctArc : 0} ${CIRCUMFERENCE}`}
                strokeDashoffset={correctOffset}
                style={{
                  transition: animated ? 'stroke-dasharray 0.8s cubic-bezier(0.4,0,0.2,1)' : 'none',
                  transform: 'rotate(-90deg)',
                  transformOrigin: '80px 80px',
                }}
              />
            )}
          </svg>

          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="font-display text-3xl text-accent-amber leading-none">
              {displayPct}%
            </span>
            <span className="text-text-secondary text-xs mt-0.5">correct</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex gap-8">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-success flex-shrink-0" />
            <span className="text-text-secondary text-sm">
              Correct{' '}
              <span className="text-text-primary font-semibold">{correctCount}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-accent-red flex-shrink-0" />
            <span className="text-text-secondary text-sm">
              Wrong{' '}
              <span className="text-text-primary font-semibold">{wrongCount}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
