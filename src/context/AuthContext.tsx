import { createContext, useCallback, useEffect, useState, type ReactNode } from 'react'
import { getUserId, getDisplayName, setUser as storeUser } from '../lib/storage'
import { apiPost } from '../lib/api'

interface AuthState {
  userId: string | null
  displayName: string | null
  isLoading: boolean
}

interface AuthContextValue extends AuthState {
  register: (displayName: string) => Promise<void>
  isAuthenticated: boolean
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    userId: null,
    displayName: null,
    isLoading: true,
  })

  useEffect(() => {
    const userId = getUserId()
    const displayName = getDisplayName()
    setState({
      userId,
      displayName,
      isLoading: false,
    })
  }, [])

  const register = useCallback(async (displayName: string) => {
    const userId = crypto.randomUUID()

    await apiPost('/api/register', { userId, displayName })

    storeUser(userId, displayName)
    setState({ userId, displayName, isLoading: false })
  }, [])

  return (
    <AuthContext.Provider
      value={{
        ...state,
        register,
        isAuthenticated: !!state.userId,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
