import { PieChart } from 'react-minimal-pie-chart'

interface AnswerDistributionProps {
  correctCount: number
  wrongCount: number
}

export function AnswerDistribution({ correctCount, wrongCount }: AnswerDistributionProps) {
  const total = correctCount + wrongCount
  if (total === 0) return null

  const correctPct = Math.round((correctCount / total) * 100)

  const data = [
    { value: correctCount, color: 'var(--color-success)' },
    { value: wrongCount, color: 'var(--color-accent-red)' },
  ]

  return (
    <div className="mt-8">
      <h2 className="font-display text-2xl text-text-primary mb-5">
        How everyone did today
      </h2>

      <div className="bg-bg-card rounded-2xl p-6 flex flex-col items-center gap-6">
        <div className="relative" style={{ width: 160, height: 160 }}>
          <PieChart
            data={data}
            lineWidth={30}
            paddingAngle={wrongCount > 0 ? 4 : 0}
            startAngle={180}
            animate
            animationDuration={800}
            animationEasing="ease-out"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="font-display text-3xl text-accent-amber leading-none">
              {correctPct}%
            </span>
            <span className="text-text-secondary text-xs mt-0.5">correct</span>
          </div>
        </div>

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
