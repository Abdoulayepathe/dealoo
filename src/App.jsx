import { Routes, Route, Navigate } from 'react-router-dom'
import { RequireAdmin, RequireSuperAdmin } from './components/ProtectedRoute'
import Connexion     from './pages/Connexion'
import Inscription   from './pages/Inscription'
import Accueil       from './pages/Accueil'
import Explorer      from './pages/Explorer'
import FicheArticle  from './pages/FicheArticle'
import Publier       from './pages/Publier'
import Favoris       from './pages/Favoris'
import Notifications from './pages/Notifications'
import Profil        from './pages/Profil'
import Admin         from './pages/Admin'
import SuperAdmin    from './pages/SuperAdmin'

export default function App() {
  return (
    <Routes>
      {/* Publiques */}
      <Route path="/"              element={<Navigate to="/home" replace />} />
      <Route path="/connexion"     element={<Connexion />} />
      <Route path="/inscription"   element={<Inscription />} />
      <Route path="/home"          element={<Accueil />} />
      <Route path="/explorer"      element={<Explorer />} />
      <Route path="/article/:id"   element={<FicheArticle />} />

      {/* Utilisateur connecté */}
      <Route path="/publier"       element={<Publier />} />
      <Route path="/favoris"       element={<Favoris />} />
      <Route path="/notifications" element={<Notifications />} />
      <Route path="/profil"        element={<Profil />} />

      {/* Admin uniquement */}
      <Route path="/admin" element={
        <RequireAdmin><Admin /></RequireAdmin>
      }/>

      {/* Super Admin uniquement */}
      <Route path="/superadmin" element={
        <RequireSuperAdmin><SuperAdmin /></RequireSuperAdmin>
      }/>

      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  )
}
