import { createContext, useContext, useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/config'

const AuthContext = createContext({ user: null, profil: null, loading: true })

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [profil,  setProfil]  = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let unsubAuth = () => {}
    let unsubProfil = () => {}

    // ── Observer Firebase Auth ──
    import('../firebase/auth')
      .then(({ observerAuth }) => {
        unsubAuth = observerAuth(async (firebaseUser) => {
          setUser(firebaseUser)

          // Nettoyer l'ancien listener profil
          unsubProfil()

          if (firebaseUser) {
            // ✅ Écouter le profil en TEMPS RÉEL
            // Si l'admin change le rôle, on le sait immédiatement
            unsubProfil = onSnapshot(
              doc(db, 'utilisateurs', firebaseUser.uid),
              (snap) => {
                setProfil(snap.exists() ? snap.data() : null)
                setLoading(false)
              },
              () => {
                setProfil(null)
                setLoading(false)
              }
            )
          } else {
            setProfil(null)
            setLoading(false)
          }
        })
      })
      .catch(() => {
        // Firebase non configuré → on continue sans auth
        setLoading(false)
      })

    return () => {
      unsubAuth()
      unsubProfil()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, profil, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
