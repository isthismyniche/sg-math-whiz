import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './hooks/useAuth'
import { NicknameModal } from './components/NicknameModal'
import { HomePage } from './pages/HomePage'

function Placeholder({ name }: { name: string }) {
  return (
    <div className="flex-1 flex items-center justify-center font-display text-3xl text-text-primary">
      {name}
    </div>
  )
}

function AppRoutes() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent-amber border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <NicknameModal />
  }

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/challenge" element={<Placeholder name="Today's Challenge" />} />
      <Route path="/result" element={<Placeholder name="Result" />} />
      <Route path="/solution/:id" element={<Placeholder name="Solution" />} />
      <Route path="/leaderboard" element={<Placeholder name="Leaderboard" />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-dvh flex flex-col bg-bg-primary text-text-primary font-body">
          <AppRoutes />
        </div>
      </AuthProvider>
    </BrowserRouter>
  )
}
