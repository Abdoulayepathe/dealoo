import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useRole } from '../hooks/useRole'

// ── Route protégée générique (connexion requise) ─────────────
export function RequireAuth({ children }) {
  const { user, loading } = useAuth()

  if (loading) return <LoadingScreen />
  if (!user)   return <Navigate to="/connexion" replace />
  return children
}

// ── Route Admin (role = admin ou superadmin) ─────────────────
export function RequireAdmin({ children }) {
  const { user, loading: authLoading } = useAuth()
  const { isAdmin, loading: roleLoading } = useRole()

  if (authLoading || roleLoading) return <LoadingScreen />

  if (!user)    return <Navigate to="/connexion" replace />
  if (!isAdmin) return <AccessDenied role="admin" />

  return children
}

// ── Route Super Admin (role = superadmin uniquement) ─────────
export function RequireSuperAdmin({ children }) {
  const { user, loading: authLoading } = useAuth()
  const { isSuperAdmin, loading: roleLoading } = useRole()

  if (authLoading || roleLoading) return <LoadingScreen />

  if (!user)        return <Navigate to="/connexion" replace />
  if (!isSuperAdmin) return <AccessDenied role="superadmin" />

  return children
}

// ── Loading screen ───────────────────────────────────────────
function LoadingScreen() {
  return (
    <div style={{ minHeight:'100vh', background:'#0A0A0F', display:'flex',
      alignItems:'center', justifyContent:'center', flexDirection:'column', gap:16 }}>
      <div style={{ width:48, height:48, border:'3px solid rgba(255,255,255,.1)',
        borderTopColor:'#00C896', borderRadius:'50%',
        animation:'spin 1s linear infinite' }}/>
      <div style={{ color:'rgba(255,255,255,.5)', fontSize:14 }}>Vérification des accès...</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

// ── Accès refusé ─────────────────────────────────────────────
function AccessDenied({ role }) {
  return (
    <div style={{ minHeight:'100vh', background:'#0A0A0F', display:'flex',
      alignItems:'center', justifyContent:'center', flexDirection:'column',
      gap:16, padding:'40px 20px', textAlign:'center' }}>
      <div style={{ fontSize:64 }}>🔒</div>
      <div style={{ fontSize:24, fontWeight:800, color:'#fff' }}>
        Accès refusé
      </div>
      <div style={{ fontSize:15, color:'rgba(255,255,255,.45)', maxWidth:400, lineHeight:1.6 }}>
        Tu n'as pas les permissions pour accéder à cette page.
        {role === 'superadmin'
          ? ' Cette section est réservée au Super Administrateur.'
          : ' Cette section est réservée aux administrateurs.'}
      </div>
      <div style={{ background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.2)',
        borderRadius:14, padding:'14px 20px', fontSize:13,
        color:'#FCA5A5', maxWidth:400 }}>
        ⚠️ Si tu es bien administrateur, demande à un Super Admin de mettre à jour
        ton rôle dans Firestore.
      </div>
      <a href="/home"
        style={{ background:'#00C896', color:'#0A0A0F', borderRadius:12,
          padding:'11px 24px', fontSize:14, fontWeight:700,
          textDecoration:'none', marginTop:8 }}>
        ← Retour à l'accueil
      </a>
    </div>
  )
}
