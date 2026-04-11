import { motion } from 'framer-motion'

interface QuestionRevealProps {
  text: string
  onRevealComplete: () => void
}

export function QuestionReveal({ text, onRevealComplete }: QuestionRevealProps) {
  // Split text into words for staggered reveal
  const words = text.split(' ')

  return (
    <div className="bg-bg-card rounded-2xl p-6 border border-text-secondary/10">
      <div className="font-display text-xl leading-relaxed text-text-primary">
        {words.map((word, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, filter: 'blur(4px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            transition={{
              delay: i * 0.06,
              duration: 0.3,
              ease: 'easeOut',
            }}
            onAnimationComplete={i === words.length - 1 ? onRevealComplete : undefined}
            className="inline-block mr-[0.3em]"
          >
            {word}
          </motion.span>
        ))}
      </div>
    </div>
  )
}
