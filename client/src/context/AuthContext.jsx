import { createContext, useContext, useEffect, useState } from 'react'
import { auth } from '../firebase'
import { onAuthStateChanged } from 'firebase/auth'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // this runs whenever the user logs in or out
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  return (
    <AuthContext.Provider value={{ currentUser }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

// easy hook for any page to get the current user
export function useAuth() {
  return useContext(AuthContext)
}
