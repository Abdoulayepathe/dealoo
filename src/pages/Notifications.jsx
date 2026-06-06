import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  collection, query, where, onSnapshot, orderBy
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import {
  Bell, Eye, Heart, CheckCircle, Gift,
  Sparkles, ShieldAlert, MapPin, Clock
} from 'lucide-react'

// ── Temps relatif ─────────────────────────────────────────
function tempsRelatif(ts) {
  if (!ts?.seconds) return '—'
  const sec = Math.floor(Date.now() / 1000) - ts.seconds
  if (sec < 60)        return "À l'instant"
  if (sec < 3600)      return `Il y a ${Math.floor(sec / 60)} min`
  if (sec < 86400)     return `Il y a ${Math.floor(sec / 3600)} h`
  if (sec < 86400 * 7) return `Il y a ${Math.floor(sec / 86400)} j`
  return new Date(ts.seconds * 1000).toLocaleDateString('fr-FR',
    { day:'numeric', month:'short' })
}

export default function Notifications() {
  const { user, profil, loading: authLoading } = useAuth()
  const [filtre, setFiltre] = useState('toutes')

  // ── Données Firestore temps réel ──
  const [mesAnnonces,     setMesAnnonces]     = useState([])
  const [signalementsRecus, setSignalementsRecus] = useState([])
  const [lues, setLues] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('dealoo_notifs_lues') || '[]')) }
    catch { return new Set() }
  })

  // Charge les annonces du user
  useEffect(() => {
    if (!user) return
    const unsub = onSnapshot(
      query(collection(db, 'annonces'), where('utilisateur_id', '==', user.uid)),
      (snap) => {
        setMesAnnonces(snap.docs.map(d => ({ id:d.id, ...d.data() })).filter(a => a.statut !== 'supprime'))
      },
      () => {}
    )
    return () => unsub()
  }, [user])

  // Charge les signalements sur mes annonces (si je suis vendeur)
  useEffect(() => {
    if (!user) return
    const unsub = onSnapshot(
      query(collection(db, 'signalements'), where('vendeur_id', '==', user.uid)),
      (snap) => setSignalementsRecus(snap.docs.map(d => ({ id:d.id, ...d.data() }))),
      () => {}
    )
    return () => unsub()
  }, [user])

  // ── Génère les notifications depuis les vraies données ──
  const notifications = []

  // 1. Bienvenue (si compte récent)
  if (profil?.date_inscription?.seconds) {
    const sec = Date.now() / 1000 - profil.date_inscription.seconds
    if (sec < 86400 * 7) {  // 7 jours
      notifications.push({
        id: 'bienvenue',
        Icon: Sparkles,
        color: '#00C896',
        bg: '#E6FAF5',
        titre: `Bienvenue sur DEALOO, ${profil.prenom || 'cher utilisateur'} !`,
        texte: 'Ton compte est actif. Commence à publier ou explorer les annonces.',
        date: profil.date_inscription,
        lien: '/explorer',
      })
    }
  }

  // 2. Annonces publiées récemment
  mesAnnonces
    .filter(a => a.date_publication?.seconds)
    .slice(0, 5)
    .forEach(a => {
      const sec = Date.now() / 1000 - a.date_publication.seconds
      if (sec < 86400 * 14) {  // 14 jours
        notifications.push({
          id: `pub-${a.id}`,
          Icon: a.est_don ? Gift : CheckCircle,
          color: a.est_don ? '#8B5CF6' : '#10B981',
          bg: a.est_don ? '#F5F3FF' : '#F0FDF4',
          titre: a.est_don ? 'Ton don est en ligne 🤲' : 'Annonce publiée avec succès',
          texte: `"${a.titre}" est ${a.est_don ? 'disponible gratuitement' : 'visible par tous les utilisateurs'}.`,
          date: a.date_publication,
          lien: `/article/${a.id}`,
        })
      }
    })

  // 3. Vues sur tes annonces (si vues > 0)
  mesAnnonces
    .filter(a => (a.nb_vues || 0) > 0)
    .forEach(a => {
      notifications.push({
        id: `vues-${a.id}`,
        Icon: Eye,
        color: '#3B82F6',
        bg: '#EFF6FF',
        titre: `Ton annonce vue ${a.nb_vues} fois`,
        texte: `"${a.titre}" suscite de l'intérêt !`,
        date: a.date_publication,
        lien: `/article/${a.id}`,
      })
    })

  // 4. Signalements reçus (alerte si quelqu'un a signalé ton annonce)
  signalementsRecus
    .filter(s => s.statut === 'pending')
    .forEach(s => {
      notifications.push({
        id: `signal-${s.id}`,
        Icon: ShieldAlert,
        color: '#EF4444',
        bg: '#FFF1F2',
        titre: 'Annonce signalée',
        texte: `Ton annonce "${s.article_titre || ''}" a été signalée : ${s.raison || ''}`,
        date: s.date_signalement,
        lien: s.annonce_id ? `/article/${s.annonce_id}` : '/profil',
      })
    })

  // Trier par date (récentes d'abord)
  notifications.sort((a, b) =>
    (b.date?.seconds || 0) - (a.date?.seconds || 0)
  )

  // ── Marquer lue/non-lue ──
  function marquerLue(id) {
    const next = new Set(lues)
    next.add(id)
    setLues(next)
    localStorage.setItem('dealoo_notifs_lues', JSON.stringify([...next]))
  }

  function toutMarquerLu() {
    const next = new Set(notifications.map(n => n.id))
    setLues(next)
    localStorage.setItem('dealoo_notifs_lues', JSON.stringify([...next]))
  }

  const nonLues = notifications.filter(n => !lues.has(n.id)).length
  const affichees = filtre === 'non-lues'
    ? notifications.filter(n => !lues.has(n.id))
    : notifications

  // ── Pas connecté ──
  if (!authLoading && !user) return (
    <>
      <Navbar />
      <div style={{ minHeight:'60vh', display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'center', padding:40, textAlign:'center' }}>
        <Bell size={56} color="var(--t3)" style={{ marginBottom:16, opacity:.5 }}/>
        <h2 style={{ fontSize:22, fontWeight:800, marginBottom:8 }}>Connecte-toi</h2>
        <p style={{ fontSize:14, color:'var(--t3)', marginBottom:24 }}>
          Pour voir tes notifications, connecte-toi d'abord
        </p>
        <Link to="/connexion" className="btn btn-green btn-lg">Se connecter →</Link>
      </div>
      <Footer />
    </>
  )

  return (
    <>
      <Navbar />

      <div style={{ background:'var(--dark)', padding:'32px 0 24px' }}>
        <div className="container">
          <Link to="/home" className="btn-back" style={{ marginBottom:12, display:'inline-flex' }}>
            ← Accueil
          </Link>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
            flexWrap:'wrap', gap:12 }}>
            <div>
              <h1 style={{ fontSize:'clamp(22px,3vw,32px)', fontWeight:800, color:'#fff', marginBottom:6,
                display:'flex', alignItems:'center', gap:10 }}>
                <Bell size={26} color="#00C896"/> Notifications
                {nonLues > 0 && (
                  <span style={{ background:'#EF4444', color:'#fff', fontSize:12,
                    fontWeight:700, padding:'2px 9px', borderRadius:12 }}>
                    {nonLues}
                  </span>
                )}
              </h1>
              <p style={{ fontSize:14, color:'rgba(255,255,255,.45)' }}>
                Tes activités sur DEALOO en temps réel
              </p>
            </div>
            {nonLues > 0 && (
              <button onClick={toutMarquerLu}
                style={{ background:'rgba(0,200,150,.15)', border:'1px solid rgba(0,200,150,.3)',
                  color:'#00C896', borderRadius:10, padding:'9px 16px',
                  fontSize:13, fontWeight:600, cursor:'pointer' }}>
                ✓ Tout marquer comme lu
              </button>
            )}
          </div>
        </div>
      </div>

      <main style={{ padding:'24px 0 60px' }}>
        <div className="container">

          {/* Filtres */}
          <div style={{ display:'flex', gap:8, marginBottom:20 }}>
            {[
              ['toutes',   'Toutes',     notifications.length],
              ['non-lues', 'Non lues',   nonLues],
            ].map(([v, l, n]) => (
              <button key={v} onClick={() => setFiltre(v)}
                style={{ padding:'9px 18px', borderRadius:20,
                  border:`1px solid ${filtre===v?'var(--green)':'var(--g2)'}`,
                  background: filtre===v ? 'var(--green-l)' : 'var(--white)',
                  color: filtre===v ? 'var(--green-d)' : 'var(--t2)',
                  fontWeight: filtre===v ? 600 : 500,
                  fontSize:13, cursor:'pointer',
                  display:'flex', alignItems:'center', gap:6 }}>
                {l}
                <span style={{ background: filtre===v ? 'var(--green)' : 'var(--g2)',
                  color: filtre===v ? '#fff' : 'var(--t3)',
                  fontSize:10, fontWeight:700, padding:'1px 6px', borderRadius:8 }}>
                  {n}
                </span>
              </button>
            ))}
          </div>

          {/* Liste */}
          {affichees.length === 0 ? (
            <div style={{ textAlign:'center', padding:'80px 20px',
              background:'var(--g1)', borderRadius:16, border:'2px dashed var(--g3)' }}>
              <Bell size={56} color="var(--t3)" style={{ marginBottom:16, opacity:.4 }}/>
              <div style={{ fontSize:18, fontWeight:700, color:'var(--t1)', marginBottom:8 }}>
                {filtre === 'non-lues' ? 'Aucune notification non lue' : 'Aucune notification'}
              </div>
              <div style={{ fontSize:14, color:'var(--t3)', marginBottom:24, maxWidth:400, margin:'0 auto 24px' }}>
                {filtre === 'non-lues'
                  ? 'Tu es à jour ! Reviens plus tard pour voir les nouveautés.'
                  : 'Publie ta première annonce pour commencer à recevoir des notifications.'}
              </div>
              {filtre === 'toutes' && (
                <Link to="/publier" className="btn btn-green">
                  + Publier une annonce
                </Link>
              )}
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {affichees.map(n => {
                const estLue = lues.has(n.id)
                return (
                  <Link key={n.id} to={n.lien}
                    onClick={() => marquerLue(n.id)}
                    style={{ background:'var(--white)',
                      border:`1px solid ${estLue ? 'var(--g2)' : n.color}`,
                      borderLeft: `4px solid ${n.color}`,
                      borderRadius:'4px 14px 14px 4px', padding:'14px 18px',
                      display:'flex', alignItems:'center', gap:14, textDecoration:'none',
                      opacity: estLue ? 0.75 : 1, transition:'.15s',
                      cursor:'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.transform='translateX(2px)'}
                    onMouseLeave={e => e.currentTarget.style.transform='translateX(0)'}>

                    <div style={{ width:42, height:42, borderRadius:12,
                      background: n.bg, display:'flex', alignItems:'center',
                      justifyContent:'center', flexShrink:0 }}>
                      <n.Icon size={20} color={n.color}/>
                    </div>

                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:14, fontWeight: estLue ? 500 : 700,
                        color:'var(--t1)', marginBottom:3 }}>
                        {n.titre}
                      </div>
                      <div style={{ fontSize:13, color:'var(--t2)', lineHeight:1.5,
                        overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {n.texte}
                      </div>
                      <div style={{ fontSize:11, color:'var(--t3)', marginTop:5,
                        display:'flex', alignItems:'center', gap:5 }}>
                        <Clock size={11}/> {tempsRelatif(n.date)}
                      </div>
                    </div>

                    {!estLue && (
                      <div style={{ width:9, height:9, borderRadius:'50%',
                        background: n.color, flexShrink:0,
                        boxShadow: `0 0 6px ${n.color}` }}/>
                    )}
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  )
}
