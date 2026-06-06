import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  createUserWithEmailAndPassword, updateProfile, sendEmailVerification
} from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../firebase/config'
import {
  ShoppingBag, Heart, Gift, ShieldCheck,
  User, Mail, Phone, MapPin, Lock, ArrowRight, Eye, EyeOff
} from 'lucide-react'

const VILLES = ['Conakry', 'Labé', 'Kankan', 'Kindia', "N'Zérékoré", 'Mamou', 'Faranah', 'Boké', 'Kissidougou']

export default function Inscription() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [erreur,  setErreur]  = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const [form, setForm] = useState({
    prenom:'', nom:'', email:'',
    whatsapp:'', ville:'Conakry',
    motDePasse:'', typeCompte:'acheteur',
  })

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    setErreur('')
  }

  // Formater le numéro WhatsApp guinéen : 624005418 → 224624005418
  function formaterWhatsApp(num) {
    let n = num.replace(/\s|-|\+/g, '')
    if (n.startsWith('00224')) return n.slice(2)
    if (n.startsWith('224'))   return n
    if (n.startsWith('0'))     return '224' + n.slice(1)
    return '224' + n
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setErreur('')

    if (!form.prenom || !form.nom || !form.email || !form.motDePasse) {
      setErreur('Remplis tous les champs obligatoires.')
      return
    }
    if (!form.whatsapp.trim()) {
      setErreur('Le numéro WhatsApp est obligatoire — il permet aux acheteurs de te contacter.')
      return
    }
    if (form.motDePasse.length < 6) {
      setErreur('Le mot de passe doit avoir au moins 6 caractères.')
      return
    }

    setLoading(true)
    try {
      const { user } = await createUserWithEmailAndPassword(auth, form.email, form.motDePasse)
      await updateProfile(user, { displayName: `${form.prenom} ${form.nom}` })

      const whatsappFormate = formaterWhatsApp(form.whatsapp)

      await setDoc(doc(db, 'utilisateurs', user.uid), {
        prenom:           form.prenom,
        nom:              form.nom,
        email:            form.email,
        telephone:        whatsappFormate,
        whatsapp:         whatsappFormate,
        ville:            form.ville,
        role:             'utilisateur',
        type_compte:      form.typeCompte,
        photo:            '',
        note:             0,
        nb_ventes:        0,
        nb_dons:          0,
        date_inscription: serverTimestamp(),
        est_verifie:      false,
      })

      // ✅ Envoyer email de vérification (GRATUIT - Firebase)
      try {
        await sendEmailVerification(user)
        setEmailSent(true)
      } catch (verifErr) {
        console.warn('Email vérif non envoyé:', verifErr)
        // On continue quand même - pas bloquant
        navigate('/home')
      }
    } catch (err) {
      console.error(err)
      if (err.code === 'auth/email-already-in-use') setErreur('Cet email est déjà utilisé.')
      else if (err.code === 'auth/invalid-email')    setErreur('Email invalide.')
      else setErreur('Erreur : ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const FEATURES = [
    { Icon: ShoppingBag, t:'Vends en quelques minutes', s:'Publie ton article facilement' },
    { Icon: Phone,       t:'Contact direct WhatsApp',    s:'Les acheteurs te contactent directement' },
    { Icon: Gift,        t:'Système de dons',             s:"Offre ce que tu n'utilises plus" },
    { Icon: ShieldCheck, t:'Communauté de confiance',     s:'Profils vérifiés, avis transparents' },
  ]

  // ── Écran après inscription : email envoyé ──
  if (emailSent) return (
    <div className="auth-layout">
      <aside className="auth-aside">
        <div style={{ position:'relative', zIndex:1, textAlign:'center' }}>
          <div className="auth-aside-logo">DEAL<span>OO</span></div>
          <div className="auth-aside-tag">Marketplace guinéenne</div>
        </div>
      </aside>

      <main className="auth-main">
        <div className="auth-box" style={{ textAlign:'center' }}>
          <div style={{ width:90, height:90, borderRadius:'50%',
            background:'var(--green-l)', display:'flex', alignItems:'center',
            justifyContent:'center', fontSize:42, margin:'0 auto 24px' }}>
            📧
          </div>
          <div className="auth-box-title">Vérifie ton email !</div>
          <p style={{ fontSize:15, color:'var(--t2)', lineHeight:1.65,
            marginBottom:28, marginTop:8 }}>
            On t'a envoyé un email à <b style={{ color:'var(--t1)' }}>{form.email}</b>.
            <br/>
            Clique sur le lien pour activer ton compte.
          </p>

          <div style={{ background:'var(--green-l)', border:'1px solid var(--green-m)',
            borderRadius:12, padding:'14px 18px', marginBottom:24, textAlign:'left' }}>
            <div style={{ fontSize:13, fontWeight:700, color:'var(--green-d)', marginBottom:6 }}>
              💡 Astuce
            </div>
            <div style={{ fontSize:13, color:'var(--green-d)', lineHeight:1.55 }}>
              Vérifie aussi ton dossier <b>Spam</b> ou <b>Courriers indésirables</b>.
              L'email peut prendre 1-2 minutes à arriver.
            </div>
          </div>

          <button onClick={() => navigate('/home')}
            className="btn btn-green btn-full btn-lg" style={{ marginBottom:10 }}>
            Continuer vers DEALOO →
          </button>
          <button onClick={() => { setEmailSent(false); navigate('/connexion') }}
            className="btn btn-outline btn-full">
            J'ai déjà vérifié — me connecter
          </button>

          <div style={{ marginTop:24, fontSize:12, color:'var(--t3)' }}>
            Tu peux utiliser DEALOO sans vérifier, mais ton compte sera marqué comme
            "non vérifié" tant que tu n'as pas cliqué sur le lien.
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
          <div className="auth-box-title">Créer un compte</div>
          <div className="auth-box-sub">Rejoins des milliers de Guinéens sur DEALOO</div>

          {erreur && <div className="alert-error">{erreur}</div>}

          <form onSubmit={handleSubmit} noValidate>
            <div className="field-row">
              <div className="field">
                <label className="field-label">Prénom *</label>
                <div className="input-icon">
                  <User size={17}/>
                  <input name="prenom" className="field-input" placeholder="Mamadou"
                    value={form.prenom} onChange={handleChange} required/>
                </div>
              </div>
              <div className="field">
                <label className="field-label">Nom *</label>
                <div className="input-icon">
                  <User size={17}/>
                  <input name="nom" className="field-input" placeholder="Kouyaté"
                    value={form.nom} onChange={handleChange} required/>
                </div>
              </div>
            </div>

            <div className="field">
              <label className="field-label">Email *</label>
              <div className="input-icon">
                <Mail size={17}/>
                <input name="email" type="email" className="field-input"
                  placeholder="ton@email.com" value={form.email}
                  onChange={handleChange} required/>
              </div>
            </div>

            <div className="field">
              <label className="field-label">
                Numéro WhatsApp *
                <span style={{ fontWeight:400, color:'var(--green-d)', marginLeft:6, fontSize:12 }}>
                  (pour être contacté)
                </span>
              </label>
              <div className="input-icon">
                <Phone size={17}/>
                <input name="whatsapp" type="tel" className="field-input"
                  placeholder="624 00 54 18" value={form.whatsapp}
                  onChange={handleChange} required/>
              </div>
              <div style={{ fontSize:12, color:'var(--t3)', marginTop:4 }}>
                Les acheteurs te contacteront sur ce numéro · +224 ajouté automatiquement
              </div>
            </div>

            <div className="field-row">
              <div className="field">
                <label className="field-label">Ville</label>
                <div className="input-icon">
                  <MapPin size={17}/>
                  <select name="ville" className="field-select" style={{ paddingLeft:38 }}
                    value={form.ville} onChange={handleChange}>
                    {VILLES.map(v => <option key={v}>{v}</option>)}
                  </select>
                </div>
              </div>
              <div className="field">
                <label className="field-label">Je suis</label>
                <select name="typeCompte" className="field-select"
                  value={form.typeCompte} onChange={handleChange}>
                  <option value="acheteur">Acheteur</option>
                  <option value="vendeur">Vendeur</option>
                  <option value="les-deux">Les deux</option>
                </select>
              </div>
            </div>

            <div className="field">
              <label className="field-label">Mot de passe *</label>
              <div className="input-icon">
                <Lock size={17}/>
                <input name="motDePasse" type={showPwd ? 'text' : 'password'}
                  className="field-input" placeholder="Minimum 6 caractères"
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

            <button type="submit" className="btn btn-green btn-full btn-lg" disabled={loading}
              style={{ marginTop:8 }}>
              {loading
                ? <><span className="spinner"/>&nbsp;Création...</>
                : <>Créer mon compte <ArrowRight size={18}/></>
              }
            </button>
          </form>

          <div className="auth-switch">
            Déjà un compte ? <Link to="/connexion">Se connecter</Link>
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
