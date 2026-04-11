import type { ReactNode } from 'react'

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex-1 flex flex-col w-full max-w-md mx-auto px-5 py-6">
      {children}
    </div>
  )
}
