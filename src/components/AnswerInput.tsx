import { useState } from 'react'
import { motion } from 'framer-motion'

interface AnswerInputProps {
  onSubmit: (answer: number) => void
  disabled?: boolean
}

export function AnswerInput({ onSubmit, disabled }: AnswerInputProps) {
  const [value, setValue] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const num = parseFloat(value)
    if (isNaN(num)) return
    onSubmit(num)
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.3 }}
      onSubmit={handleSubmit}
      className="space-y-3"
    >
      <input
        type="number"
        inputMode="decimal"
        step="any"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Your answer"
        autoFocus
        disabled={disabled}
        className="w-full rounded-xl bg-bg-card border-2 border-text-secondary/20 px-5 py-4 font-mono text-2xl text-center text-text-primary placeholder:text-text-secondary/30 focus:outline-none focus:border-accent-amber transition-colors disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        className="w-full rounded-xl bg-accent-red py-4 px-4 font-body font-semibold text-lg text-text-primary transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Submit Answer
      </button>
    </motion.form>
  )
}
