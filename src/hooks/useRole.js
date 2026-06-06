import { useState, useEffect } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useAuth } from '../context/AuthContext'

export function useRole() {
  const { user, profil, loading: authLoading } = useAuth()
  const [role, setRole]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Tant que l'auth charge, on attend
    if (authLoading) {
      setLoading(true)
      return
    }

    // Pas connecté → pas de rôle
    if (!user) {
      setRole(null)
      setLoading(false)
      return
    }

    // ✅ Optimisation : si on a déjà le profil dans AuthContext, on l'utilise direct
    // Évite le flash blanc le temps du fetch séparé
    if (profil?.role) {
      setRole(profil.role)
      setLoading(false)
      return
    }

    // Sinon → onSnapshot temps réel sur le profil
    // (si l'admin change le rôle, mise à jour instantanée)
    const unsub = onSnapshot(
      doc(db, 'utilisateurs', user.uid),
      (snap) => {
        if (snap.exists()) {
          setRole(snap.data().role || 'utilisateur')
        } else {
          setRole('utilisateur')
        }
        setLoading(false)
      },
      () => {
        setRole('utilisateur')
        setLoading(false)
      }
    )

    return () => unsub()
  }, [user, profil, authLoading])

  return {
    role,
    loading,
    isAdmin:      ['admin', 'superadmin'].includes(role),
    isSuperAdmin: role === 'superadmin',
    isModo:       ['moderateur', 'admin', 'superadmin'].includes(role),
  }
}
