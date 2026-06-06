import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  collection, query, where, getDocs, onSnapshot,
  doc, updateDoc, deleteDoc, orderBy
} from 'firebase/firestore'
import { signOut, updateEmail, updatePassword } from 'firebase/auth'
import { auth, db } from '../firebase/config'
import { useAuth } from '../context/AuthContext'
import { useFavoris } from '../context/FavorisContext'
import { useArticles } from '../hooks/useArticles'
import { fmtPrix, etatLabel, etatClass } from '../data/articles'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import {
  User, Mail, Phone, MapPin, Package,
  Heart, Settings, LogOut, Edit3,
  Check, X, Star, ShoppingBag
} from 'lucide-react'

const VILLES = ['Conakry','Labé','Kankan','Kindia',"N'Zérékoré",'Mamou','Faranah','Boké']

export default function Profil() {
  const { user, profil }  = useAuth()
  const { favoris }       = useFavoris()
  const { articles }      = useArticles()
  const navigate          = useNavigate()

  const [onglet,   setOnglet]   = useState('annonces')
  const [toast,    setToast]    = useState('')
  const [toastOk,  setToastOk]  = useState(true)

  // ── Mes vraies annonces depuis Firestore ──────────────────
  const [mesAnnonces, setMesAnnonces] = useState([])
  const [loadingAnn,  setLoadingAnn]  = useState(true)

  useEffect(() => {
    if (!user) return
    setLoadingAnn(true)

    let unsub = null

    // ✅ FIRESTORE TEMPS RÉEL — le profil se met à jour automatiquement
    // (publication, suppression, modification par admin → instantané)
    try {
      const q = query(
        collection(db, 'annonces'),
        where('utilisateur_id', '==', user.uid),
        orderBy('date_publication', 'desc')
      )

      unsub = onSnapshot(
        q,
        (snap) => {
          const ann = snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter(a => a.statut !== 'supprime')
          setMesAnnonces(ann)
          setLoadingAnn(false)
        },
        (err) => {
          // Pas d'index → fallback sans orderBy
          console.warn('Profil — orderBy échoué, fallback:', err.code)
          if (unsub) unsub()
          unsub = onSnapshot(
            query(collection(db, 'annonces'), where('utilisateur_id', '==', user.uid)),
            (snap) => {
              const ann = snap.docs
                .map(d => ({ id: d.id, ...d.data() }))
                .filter(a => a.statut !== 'supprime')
                .sort((a, b) => (b.date_publication?.seconds || 0) - (a.date_publication?.seconds || 0))
              setMesAnnonces(ann)
              setLoadingAnn(false)
            },
            (err2) => {
              console.error('Erreur Firestore:', err2)
              setLoadingAnn(false)
            }
          )
        }
      )
    } catch (err) {
      console.error('Erreur chargement annonces:', err)
      setLoadingAnn(false)
    }

    return () => { if (unsub) unsub() }
  }, [user])

  // ── Mes favoris ───────────────────────────────────────────
  const mesFavoris = articles.filter(a =>
    favoris.includes(a.firestoreId || a.id)
  )

  // ── Formulaire modification profil ───────────────────────
  const [editing, setEditing] = useState(false)
  const [formProfil, setFormProfil] = useState({
    prenom:    profil?.prenom    || '',
    nom:       profil?.nom       || '',
    telephone: profil?.telephone || '',
    ville:     profil?.ville     || 'Conakry',
  })
  const [savingProfil, setSavingProfil] = useState(false)

  useEffect(() => {
    if (profil) {
      setFormProfil({
        prenom:    profil.prenom    || '',
        nom:       profil.nom       || '',
        telephone: profil.telephone || '',
        ville:     profil.ville     || 'Conakry',
      })
    }
  }, [profil])

  async function saveProfil() {
    if (!user) return
    setSavingProfil(true)
    try {
      // Formater WhatsApp
      let tel = formProfil.telephone.replace(/\s|-|\+/g,'')
      if (!tel.startsWith('224')) tel = '224' + (tel.startsWith('0') ? tel.slice(1) : tel)

      await updateDoc(doc(db, 'utilisateurs', user.uid), {
        prenom:    formProfil.prenom.trim(),
        nom:       formProfil.nom.trim(),
        telephone: tel,
        whatsapp:  tel,
        ville:     formProfil.ville,
      })
      showToast('✅ Profil mis à jour !', true)
      setEditing(false)
    } catch (err) {
      showToast('❌ Erreur : ' + err.message, false)
    } finally {
      setSavingProfil(false)
    }
  }

  function showToast(msg, ok = true) {
    setToast(msg)
    setToastOk(ok)
    setTimeout(() => setToast(''), 3000)
  }

  async function handleDeconnexion() {
    await signOut(auth)
    navigate('/connexion')
  }

  async function supprimerAnnonce(id) {
    if (!window.confirm('Supprimer définitivement cette annonce ?')) return
    try {
      await deleteDoc(doc(db, 'annonces', id))
      // Le onSnapshot mettra à jour automatiquement
      showToast('🗑️ Annonce supprimée', true)
    } catch (err) {
      console.error(err)
      showToast('❌ Erreur lors de la suppression', false)
    }
  }

  // ── Infos affichées ───────────────────────────────────────
  const nomAffiche = profil?.prenom
    ? `${profil.prenom} ${profil.nom || ''}`.trim()
    : user?.displayName || user?.email?.split('@')[0] || 'Utilisateur'
  const initiales  = nomAffiche.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2)
  const ville      = profil?.ville || 'Conakry'
  const telephone  = profil?.telephone || 'Non renseigné'
  const membre     = user?.metadata?.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString('fr-FR',{month:'long',year:'numeric'})
    : '2025'

  const TABS = [
    { id:'annonces', label:'Mes annonces', Icon:Package,  count:mesAnnonces.length },
    { id:'favoris',  label:'Favoris',      Icon:Heart,    count:favoris.length     },
    { id:'compte',   label:'Mon compte',   Icon:Settings, count:null               },
  ]

  return (
    <>
      <Navbar/>

      {/* ── Header profil ── */}
      <div style={{ background:'linear-gradient(135deg,#0A0A0F,#0D1B2A)',
        padding:'40px 0 32px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-80, right:-80, width:300, height:300,
          borderRadius:'50%', background:'var(--green)', opacity:.08 }}/>
        <div className="container" style={{ position:'relative', zIndex:1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:20, flexWrap:'wrap' }}>

            {/* Avatar */}
            <div style={{ width:80, height:80, borderRadius:'50%', background:'var(--green)',
              display:'flex', alignItems:'center', justifyContent:'center',
              color:'var(--dark)', fontWeight:800, fontSize:28, flexShrink:0,
              border:'3px solid rgba(255,255,255,.15)' }}>
              {initiales}
            </div>

            {/* Infos */}
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                <div style={{ fontSize:'clamp(20px,3vw,26px)', fontWeight:800, color:'#fff' }}>
                  {nomAffiche}
                </div>
                <span style={{ background:'var(--green-l)', color:'var(--green-d)',
                  fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:8 }}>
                  ✓ Membre vérifié
                </span>
              </div>
              <div style={{ display:'flex', gap:16, marginTop:8, flexWrap:'wrap' }}>
                <span style={{ fontSize:13, color:'rgba(255,255,255,.45)',
                  display:'flex', alignItems:'center', gap:5 }}>
                  <MapPin size={13}/> {ville}
                </span>
                <span style={{ fontSize:13, color:'rgba(255,255,255,.45)',
                  display:'flex', alignItems:'center', gap:5 }}>
                  <User size={13}/> Membre depuis {membre}
                </span>
              </div>

              {/* Stats */}
              <div style={{ display:'flex', gap:24, marginTop:16, flexWrap:'wrap' }}>
                {[
                  [loadingAnn ? '...' : mesAnnonces.length, 'Annonces'],
                  [mesAnnonces.filter(a=>a.est_don).length, 'Dons'],
                  [favoris.length, 'Favoris'],
                  ['★ 5.0', 'Note'],
                ].map(([n,l]) => (
                  <div key={l}>
                    <div style={{ fontWeight:800, fontSize:20, color:'#fff' }}>{n}</div>
                    <div style={{ fontSize:11, color:'rgba(255,255,255,.4)', marginTop:2 }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display:'flex', gap:10, flexShrink:0 }}>
              <Link to="/publier" className="btn btn-green btn-sm"
                style={{ display:'flex', alignItems:'center', gap:6 }}>
                <ShoppingBag size={15}/> Publier
              </Link>
              <button onClick={handleDeconnexion}
                style={{ display:'flex', alignItems:'center', gap:6,
                  background:'rgba(239,68,68,.15)', border:'1px solid rgba(239,68,68,.3)',
                  color:'#FCA5A5', borderRadius:10, padding:'8px 14px',
                  fontSize:13, fontWeight:600, cursor:'pointer' }}>
                <LogOut size={15}/> Déconnexion
              </button>
            </div>
          </div>
        </div>
      </div>

      <main style={{ padding:'28px 0 60px' }}>
        <div className="container">

          {/* Onglets */}
          <div style={{ display:'flex', gap:0, background:'var(--g1)',
            borderRadius:14, padding:4, border:'1px solid var(--g2)',
            marginBottom:28, width:'fit-content' }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setOnglet(t.id)}
                style={{ padding:'10px 20px', borderRadius:11, border:'none',
                  background: onglet===t.id ? 'var(--white)' : 'transparent',
                  color: onglet===t.id ? 'var(--t1)' : 'var(--t3)',
                  fontWeight: onglet===t.id ? 700 : 500,
                  fontSize:14, cursor:'pointer',
                  boxShadow: onglet===t.id ? '0 1px 4px rgba(0,0,0,.08)' : 'none',
                  transition:'.2s', display:'flex', alignItems:'center', gap:7 }}>
                <t.Icon size={16}/>
                {t.label}
                {t.count !== null && (
                  <span style={{ background: onglet===t.id ? 'var(--green-l)' : 'var(--g2)',
                    color: onglet===t.id ? 'var(--green-d)' : 'var(--t3)',
                    fontSize:11, fontWeight:700, padding:'1px 7px', borderRadius:10 }}>
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ─── MES ANNONCES ─── */}
          {onglet === 'annonces' && (
            <div>
              <div style={{ display:'flex', alignItems:'center',
                justifyContent:'space-between', marginBottom:20 }}>
                <div style={{ fontSize:18, fontWeight:700 }}>Mes annonces publiées</div>
                <Link to="/publier" className="btn btn-green btn-sm"
                  style={{ display:'flex', alignItems:'center', gap:5 }}>
                  + Nouvelle annonce
                </Link>
              </div>

              {loadingAnn ? (
                <div style={{ textAlign:'center', padding:'60px', color:'var(--t3)' }}>
                  <div style={{ width:36, height:36, border:'3px solid var(--g2)',
                    borderTopColor:'var(--green)', borderRadius:'50%',
                    animation:'spin 1s linear infinite', margin:'0 auto 12px' }}/>
                  Chargement...
                  <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                </div>
              ) : mesAnnonces.length === 0 ? (
                <div style={{ textAlign:'center', padding:'80px 20px', color:'var(--t3)' }}>
                  <div style={{ fontSize:56, marginBottom:16 }}>📦</div>
                  <div style={{ fontSize:18, fontWeight:700, color:'var(--t1)', marginBottom:8 }}>
                    Aucune annonce publiée
                  </div>
                  <p style={{ fontSize:14, marginBottom:24, color:'var(--t2)' }}>
                    Commence à vendre ou donner des articles !
                  </p>
                  <Link to="/publier" className="btn btn-green btn-lg"
                    style={{ display:'inline-flex', alignItems:'center', gap:8 }}>
                    <ShoppingBag size={18}/> Publier mon premier article
                  </Link>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  {mesAnnonces.map(a => {
                    const hasPhoto = a.photos && a.photos.length > 0
                    return (
                      <div key={a.id} className="card"
                        style={{ padding:16, display:'flex', gap:14, alignItems:'center' }}>

                        {/* Image */}
                        <div style={{ width:72, height:72, borderRadius:12,
                          background:'#F0F0F5', overflow:'hidden', flexShrink:0,
                          display:'flex', alignItems:'center', justifyContent:'center',
                          fontSize:32 }}>
                          {hasPhoto
                            ? <img src={a.photos[0]} alt={a.titre}
                                style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                            : (a.emoji || '📦')
                          }
                        </div>

                        {/* Infos */}
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontWeight:700, fontSize:15, color:'var(--t1)',
                            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                            {a.titre}
                          </div>
                          <div style={{ fontSize:16, fontWeight:800,
                            color: a.est_don ? 'var(--green-d)' : 'var(--green)', marginTop:3 }}>
                            {a.est_don ? 'Gratuit (DON)' : fmtPrix(a.prix||0)}
                          </div>
                          <div style={{ display:'flex', gap:8, marginTop:6, flexWrap:'wrap' }}>
                            <span style={{ background:'#F0FDF4', color:'#166534',
                              fontSize:11, fontWeight:700, padding:'2px 9px', borderRadius:8 }}>
                              ✓ Active
                            </span>
                            {a.est_don && (
                              <span className="badge badge-don" style={{ fontSize:11 }}>DON</span>
                            )}
                            <span style={{ fontSize:11, color:'var(--t3)',
                              display:'flex', alignItems:'center', gap:3 }}>
                              <MapPin size={11}/> {a.ville}
                            </span>
                            <span style={{ fontSize:11, color:'var(--t3)' }}>
                              {a.nb_vues || 0} vues
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display:'flex', gap:8, flexShrink:0 }}>
                          <Link to={`/article/${a.id}`}
                            style={{ display:'flex', alignItems:'center', gap:5,
                              background:'var(--g1)', border:'1px solid var(--g2)',
                              color:'var(--t2)', borderRadius:9, padding:'7px 12px',
                              fontSize:12, fontWeight:600, textDecoration:'none' }}>
                            Voir
                          </Link>
                          <button onClick={() => supprimerAnnonce(a.id)}
                            style={{ display:'flex', alignItems:'center', gap:5,
                              background:'#FFF1F2', border:'1px solid #FECDD3',
                              color:'var(--red)', borderRadius:9, padding:'7px 12px',
                              fontSize:12, fontWeight:600, cursor:'pointer' }}>
                            <X size={13}/> Retirer
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ─── FAVORIS ─── */}
          {onglet === 'favoris' && (
            <div>
              <div style={{ fontSize:18, fontWeight:700, marginBottom:20 }}>
                Articles sauvegardés
              </div>
              {mesFavoris.length === 0 ? (
                <div style={{ textAlign:'center', padding:'80px 20px', color:'var(--t3)' }}>
                  <Heart size={56} style={{ margin:'0 auto 16px', opacity:.3 }}/>
                  <div style={{ fontSize:18, fontWeight:700, color:'var(--t1)', marginBottom:8 }}>
                    Aucun favori
                  </div>
                  <Link to="/explorer" className="btn btn-green"
                    style={{ display:'inline-flex', alignItems:'center', gap:8, marginTop:8 }}>
                    Explorer les articles →
                  </Link>
                </div>
              ) : (
                <div className="products-grid">
                  {mesFavoris.map(a => {
                    const hasPhoto = a.photos && a.photos.length > 0
                    const aid = a.firestoreId || a.id
                    return (
                      <Link key={aid} to={`/article/${aid}`} className="product-card">
                        <div className="product-card-img" style={{ background:a.bg||'#F0F0F5', overflow:'hidden' }}>
                          {a.don && <span className="badge badge-don"
                            style={{ position:'absolute',top:10,left:10 }}>DON</span>}
                          {hasPhoto
                            ? <img src={a.photos[0]} alt={a.titre}
                                style={{ width:'100%',height:'100%',objectFit:'cover' }}/>
                            : <span style={{ fontSize:44 }}>{a.emoji||'📦'}</span>
                          }
                        </div>
                        <div className="product-card-body">
                          <div className="product-card-title">{a.titre}</div>
                          <div className={`product-card-price ${a.don?'don':''}`}>
                            {fmtPrix(a.prix)}
                          </div>
                          <div className="product-card-meta">
                            <span className="product-card-loc">📍 {a.lieu}</span>
                            <span className={`badge ${etatClass(a.etat)}`}>{etatLabel(a.etat)}</span>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ─── MON COMPTE ─── */}
          {onglet === 'compte' && (
            <div style={{ maxWidth:600 }}>

              {/* Infos profil */}
              <div className="card" style={{ padding:24, marginBottom:16 }}>
                <div style={{ display:'flex', alignItems:'center',
                  justifyContent:'space-between', marginBottom:20 }}>
                  <div style={{ fontSize:16, fontWeight:700 }}>Informations personnelles</div>
                  {!editing ? (
                    <button onClick={() => setEditing(true)}
                      style={{ display:'flex', alignItems:'center', gap:6,
                        background:'var(--g1)', border:'1px solid var(--g2)',
                        borderRadius:9, padding:'7px 14px', fontSize:13,
                        fontWeight:600, color:'var(--t2)', cursor:'pointer' }}>
                      <Edit3 size={14}/> Modifier
                    </button>
                  ) : (
                    <div style={{ display:'flex', gap:8 }}>
                      <button onClick={() => setEditing(false)}
                        style={{ background:'var(--g1)', border:'1px solid var(--g2)',
                          borderRadius:9, padding:'7px 14px', fontSize:13,
                          fontWeight:600, color:'var(--t2)', cursor:'pointer' }}>
                        Annuler
                      </button>
                      <button onClick={saveProfil} disabled={savingProfil}
                        style={{ display:'flex', alignItems:'center', gap:6,
                          background:'var(--green)', border:'none',
                          borderRadius:9, padding:'7px 14px', fontSize:13,
                          fontWeight:700, color:'var(--dark)', cursor:'pointer' }}>
                        <Check size={14}/>
                        {savingProfil ? 'Enregistrement...' : 'Enregistrer'}
                      </button>
                    </div>
                  )}
                </div>

                {!editing ? (
                  // Mode lecture
                  <div>
                    {[
                      { Icon:User,    label:'Nom complet',  val:nomAffiche   },
                      { Icon:Mail,    label:'Email',         val:user?.email  },
                      { Icon:Phone,   label:'WhatsApp',      val:telephone    },
                      { Icon:MapPin,  label:'Ville',          val:ville        },
                      { Icon:User,    label:'Membre depuis', val:membre       },
                    ].map(info => (
                      <div key={info.label}
                        style={{ display:'flex', alignItems:'center', gap:12,
                          padding:'12px 0', borderBottom:'1px solid var(--g2)' }}>
                        <div style={{ width:38, height:38, borderRadius:10, background:'var(--g1)',
                          display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                          <info.Icon size={17} color="var(--t3)"/>
                        </div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:11, fontWeight:700, color:'var(--t3)',
                            textTransform:'uppercase', letterSpacing:'.5px' }}>
                            {info.label}
                          </div>
                          <div style={{ fontSize:14, color:'var(--t1)', marginTop:2, fontWeight:500 }}>
                            {info.val || '—'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  // Mode édition
                  <div>
                    <div className="field-row">
                      <div className="field">
                        <label className="field-label">Prénom</label>
                        <input className="field-input" value={formProfil.prenom}
                          onChange={e => setFormProfil(f=>({...f,prenom:e.target.value}))}
                          placeholder="Ton prénom"/>
                      </div>
                      <div className="field">
                        <label className="field-label">Nom</label>
                        <input className="field-input" value={formProfil.nom}
                          onChange={e => setFormProfil(f=>({...f,nom:e.target.value}))}
                          placeholder="Ton nom"/>
                      </div>
                    </div>

                    <div className="field">
                      <label className="field-label">
                        Numéro WhatsApp
                        <span style={{ color:'var(--green-d)', fontWeight:400,
                          fontSize:12, marginLeft:6 }}>
                          (les acheteurs te contacteront sur ce numéro)
                        </span>
                      </label>
                      <div style={{ position:'relative' }}>
                        <Phone size={16} style={{ position:'absolute', left:12,
                          top:'50%', transform:'translateY(-50%)', color:'var(--t3)' }}/>
                        <input className="field-input" style={{ paddingLeft:38 }}
                          value={formProfil.telephone}
                          onChange={e => setFormProfil(f=>({...f,telephone:e.target.value}))}
                          placeholder="624 00 54 18"/>
                      </div>
                      <div style={{ fontSize:12, color:'var(--t3)', marginTop:4 }}>
                        Le +224 sera ajouté automatiquement
                      </div>
                    </div>

                    <div className="field">
                      <label className="field-label">Ville</label>
                      <div style={{ position:'relative' }}>
                        <MapPin size={16} style={{ position:'absolute', left:12,
                          top:'50%', transform:'translateY(-50%)', color:'var(--t3)' }}/>
                        <select className="field-select" style={{ paddingLeft:38 }}
                          value={formProfil.ville}
                          onChange={e => setFormProfil(f=>({...f,ville:e.target.value}))}>
                          {VILLES.map(v => <option key={v}>{v}</option>)}
                        </select>
                      </div>
                    </div>

                    <div style={{ background:'var(--green-l)', border:'1px solid var(--green-m)',
                      borderRadius:12, padding:'11px 14px', fontSize:13, color:'var(--green-d)',
                      display:'flex', alignItems:'center', gap:8 }}>
                      <Phone size={15}/>
                      Ton numéro WhatsApp est utilisé sur le bouton de contact de tes annonces
                    </div>
                  </div>
                )}
              </div>

              {/* Sécurité */}
              <div className="card" style={{ padding:24, marginBottom:16 }}>
                <div style={{ fontSize:16, fontWeight:700, marginBottom:16 }}>Sécurité</div>
                {[
                  { label:'Email de connexion', val:user?.email },
                  { label:'Mot de passe',       val:'••••••••' },
                ].map(s => (
                  <div key={s.label}
                    style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                      padding:'12px 0', borderBottom:'1px solid var(--g2)' }}>
                    <div>
                      <div style={{ fontSize:12, color:'var(--t3)', fontWeight:600,
                        textTransform:'uppercase', letterSpacing:.5 }}>{s.label}</div>
                      <div style={{ fontSize:14, color:'var(--t1)', marginTop:2 }}>{s.val}</div>
                    </div>
                    <button onClick={() => showToast('🔒 Modification disponible bientôt', true)}
                      style={{ background:'var(--g1)', border:'1px solid var(--g2)',
                        borderRadius:8, padding:'6px 12px', fontSize:12,
                        fontWeight:600, color:'var(--t2)', cursor:'pointer' }}>
                      Modifier
                    </button>
                  </div>
                ))}
              </div>

              {/* Danger */}
              <div className="card" style={{ padding:20, border:'1px solid #FECDD3' }}>
                <div style={{ fontSize:14, fontWeight:700, color:'var(--red)', marginBottom:12 }}>
                  Zone dangereuse
                </div>
                <button onClick={() => showToast('⚠️ Contacte le support pour supprimer ton compte', false)}
                  style={{ background:'#FFF1F2', border:'1px solid #FECDD3', color:'var(--red)',
                    borderRadius:10, padding:'10px 16px', fontSize:13, fontWeight:600,
                    cursor:'pointer', width:'100%' }}>
                  🗑️ Supprimer mon compte
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer/>

      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed', bottom:28, left:'50%', transform:'translateX(-50%)',
          background: toastOk ? 'var(--dark)' : '#7F1D1D',
          color:'#fff', padding:'12px 22px', borderRadius:20,
          fontSize:14, fontWeight:500, zIndex:9999, whiteSpace:'nowrap',
          boxShadow:'0 8px 24px rgba(0,0,0,.2)', animation:'fadeUp .25s ease' }}>
          {toast}
        </div>
      )}

      <style>{`
        @keyframes fadeUp {
          from { opacity:0; transform:translateX(-50%) translateY(10px); }
          to   { opacity:1; transform:translateX(-50%) translateY(0); }
        }
      `}</style>
    </>
  )
}
