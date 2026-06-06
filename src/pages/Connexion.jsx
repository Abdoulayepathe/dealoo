import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebase/config'
import {
  ShoppingBag, MapPin, Gift, ShieldCheck,
  Mail, Lock, Eye, EyeOff
} from 'lucide-react'

export default function Connexion() {
  const navigate = useNavigate()
  const [form, setForm]       = useState({ email:'', motDePasse:'' })
  const [loading, setLoading] = useState(false)
  const [erreur,  setErreur]  = useState('')
  const [showPwd, setShowPwd] = useState(false)

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    setErreur('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setErreur('')
    try {
      await signInWithEmailAndPassword(auth, form.email, form.motDePasse)
      navigate('/home')
    } catch (err) {
      if (['auth/invalid-credential','auth/wrong-password'].includes(err.code))
        setErreur('Email ou mot de passe incorrect.')
      else if (err.code === 'auth/user-not-found')
        setErreur('Aucun compte avec cet email.')
      else if (err.code === 'auth/too-many-requests')
        setErreur('Trop de tentatives. Réessaie dans quelques minutes.')
      else setErreur('Erreur : ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const FEATURES = [
    { Icon: ShoppingBag, t:"Des milliers d'articles", s:'Mode, téléphones, voitures...' },
    { Icon: MapPin,      t:'Toute la Guinée',          s:'Conakry, Labé, Kankan...' },
    { Icon: Gift,        t:'Dons gratuits',            s:"Récupère ce dont tu as besoin" },
    { Icon: ShieldCheck, t:'Profils vérifiés',         s:'Communauté de confiance' },
  ]

  return (
    <div className="auth-layout">
      {/* Panneau gauche */}
      <aside className="auth-aside">
        <div style={{ position:'relative', zIndex:1, textAlign:'center' }}>
          <div className="auth-aside-logo">DEAL<span>OO</span></div>
          <div className="auth-aside-tag">Marketplace guinéenne</div>
        </div>
        <div className="auth-aside-features">
          {FEATURES.map(f => (
            <div key={f.t} className="auth-aside-feat">
              <div className="auth-feat-ico">
                <f.Icon size={22} color="#00C896" strokeWidth={2}/>
              </div>
              <div>
                <div className="auth-feat-title">{f.t}</div>
                <div className="auth-feat-sub">{f.s}</div>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Formulaire */}
      <main className="auth-main">
        <div className="auth-box">
          <div className="auth-box-title">Content de te revoir</div>
          <div className="auth-box-sub">Connecte-toi à ton compte DEALOO</div>

          {erreur && <div className="alert-error">{erreur}</div>}

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label className="field-label">Email</label>
              <div className="input-icon">
                <Mail size={17}/>
                <input name="email" type="email" className="field-input"
                  placeholder="ton@email.com" value={form.email}
                  onChange={handleChange} required/>
              </div>
            </div>

            <div className="field">
              <label className="field-label">Mot de passe</label>
              <div className="input-icon">
                <Lock size={17}/>
                <input name="motDePasse" type={showPwd ? 'text' : 'password'}
                  className="field-input" placeholder="••••••••"
                  value={form.motDePasse} onChange={handleChange} required
                  style={{ paddingRight:42 }}/>
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)',
                    background:'none', border:'none', cursor:'pointer', color:'var(--t3)',
                    display:'flex' }}>
                  {showPwd ? <EyeOff size={17}/> : <Eye size={17}/>}
                </button>
              </div>
            </div>

            <div style={{ textAlign:'right', marginBottom:20 }}>
              <Link to="/mot-de-passe-oublie"
                style={{ fontSize:13, color:'var(--green)', fontWeight:600, textDecoration:'none' }}>
                Mot de passe oublié ?
              </Link>
            </div>

            <button type="submit" className="btn btn-green btn-full btn-lg" disabled={loading}>
              {loading ? <><span className="spinner"/>&nbsp;Connexion...</> : 'Se connecter'}
            </button>
          </form>

          <div className="auth-switch">
            Pas de compte ? <Link to="/inscription">S'inscrire gratuitement</Link>
          </div>
        </div>
      </main>

      <style>{`
        .input-icon { position: relative; display: flex; align-items: center; }
        .input-icon > svg {
          position: absolute; left: 13px; color: var(--t3);
          pointer-events: none; z-index: 1;
        }
        .input-icon .field-input { padding-left: 38px; }
      `}</style>
    </div>
  )
}
