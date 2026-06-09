import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useArticles } from '../hooks/useArticles'
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useAuth } from '../context/AuthContext'
import { useFavoris } from '../context/FavorisContext'
import { fmtPrix, etatLabel, etatClass, ARTICLES } from '../data/articles'

const RAISONS_SIGNALEMENT = [
  { val:'arnaque',      label:'Arnaque suspectée',          ico:'🎭' },
  { val:'prix',         label:'Prix anormal / suspect',     ico:'💸' },
  { val:'illegal',      label:'Contenu illégal ou interdit', ico:'🚫' },
  { val:'fausse',       label:'Fausse annonce',              ico:'❌' },
  { val:'inapproprie',  label:'Contenu inapproprié',         ico:'⚠️' },
  { val:'autre',        label:'Autre raison',                ico:'❓' },
]

export default function FicheArticle() {
  const { id } = useParams()
  const { articles, loading } = useArticles()
  const { isFavori, toggleFavori } = useFavoris()
  const { user, profil } = useAuth()
  const [toast, setToast] = useState('')
  const [showSignalModal, setShowSignalModal] = useState(false)
  const [raisonChoisie, setRaisonChoisie] = useState('')
  const [signalSending, setSignalSending] = useState(false)
  const [vendeurTel, setVendeurTel] = useState(null)

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  // ── Envoyer un signalement vers Firestore ──
  async function envoyerSignalement() {
    if (!user) {
      showToast('Connecte-toi pour signaler')
      setTimeout(() => window.location.href = '/connexion', 1500)
      return
    }
    if (!raisonChoisie) {
      showToast('Choisis une raison')
      return
    }
    setSignalSending(true)
    try {
      // ✅ Récupérer le vendeur_id directement depuis Firestore pour être sûr
      let vendeurId = article.userId || article.utilisateur_id || ''
      if (!vendeurId && (article.firestoreId || article.id)) {
        try {
          const snap = await getDoc(doc(db, 'annonces', article.firestoreId || article.id))
          if (snap.exists()) vendeurId = snap.data().utilisateur_id || ''
        } catch {}
      }

      await addDoc(collection(db, 'signalements'), {
        annonce_id:       article.firestoreId || article.id,
        article_titre:    article.titre,
        raison:           RAISONS_SIGNALEMENT.find(r => r.val === raisonChoisie)?.label || raisonChoisie,
        raison_code:      raisonChoisie,
        signaleur_id:     user.uid,
        signaleur_email:  user.email,
        vendeur_id:       vendeurId,
        statut:           'pending',
        date_signalement: serverTimestamp(),
      })
      setShowSignalModal(false)
      setRaisonChoisie('')
      showToast('✅ Signalement envoyé — les admins vont vérifier')
    } catch (err) {
      console.error('Erreur signalement:', err)
      showToast('❌ Erreur — réessaie')
    } finally {
      setSignalSending(false)
    }
  }

  // Chercher par ID string (Firestore) ou ID numérique (statiques)
  const article = articles.find(a =>
    a.firestoreId === id || a.id === id || String(a.id) === id
  )

  // ── Charger le vrai numéro WhatsApp du vendeur ─────────────
  useEffect(() => {
    if (!article) return
    const uid = article.userId || article.utilisateur_id
    if (!uid) return
    getDoc(doc(db, 'utilisateurs', uid))
      .then(snap => {
        if (snap.exists()) {
          const data = snap.data()
          setVendeurTel(data.telephone || data.whatsapp || null)
        }
      })
      .catch(() => {})
  }, [article])

  // ── Loader ──────────────────────────────────────────────────
  if (loading) return (
    <>
      <Navbar />
      <div style={{ minHeight:'60vh', display:'flex', alignItems:'center',
        justifyContent:'center', flexDirection:'column', gap:16, color:'var(--t3)' }}>
        <div style={{ width:48, height:48, border:'3px solid var(--g2)',
          borderTopColor:'var(--green)', borderRadius:'50%',
          animation:'spin 1s linear infinite' }}/>
        <div style={{ fontSize:15 }}>Chargement de l'article...</div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
      <Footer />
    </>
  )

  // ── Article non trouvé ───────────────────────────────────────
  if (!article) return (
    <>
      <Navbar />
      <div style={{ minHeight:'60vh', display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'center', gap:16, padding:'40px 20px',
        color:'var(--t3)' }}>
        <div style={{ fontSize:64 }}>🔍</div>
        <div style={{ fontSize:22, fontWeight:700, color:'var(--t1)' }}>
          Article introuvable
        </div>
        <div style={{ fontSize:14, color:'var(--t3)' }}>
          Cet article a peut-être été supprimé ou n'existe pas.
        </div>
        <Link to="/home" className="btn btn-green btn-lg" style={{ marginTop:8 }}>
          ← Retour à l'accueil
        </Link>
      </div>
      <Footer />
    </>
  )

  const { titre, prix, don, cat, etat, lieu, emoji, bg, vendeur, desc, boost } = article
  const articleId = article.firestoreId || article.id

  // Articles similaires (même catégorie)
  const similaires = articles
    .filter(a => a.cat === cat && (a.firestoreId || a.id) !== articleId)
    .slice(0, 4)

  // Lien WhatsApp
  // Priorité : 1. Tel chargé depuis Firestore utilisateurs, 2. Tel dans l'annonce, 3. Défaut
  const tel = vendeurTel || vendeur?.telephone || vendeur?.whatsapp || '224620000000'
  const msg = encodeURIComponent(
    `Bonjour ! Je suis intéressé(e) par votre article "${titre}" sur DEALOO.`
  )
  const lienWA = `https://wa.me/${tel}?text=${msg}`

  return (
    <>
      <Navbar />

      {/* Fil d'Ariane */}
      <div style={{ background:'var(--white)', borderBottom:'1px solid var(--g2)', padding:'10px 0' }}>
        <div className="container">
          <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:'var(--t3)' }}>
            <Link to="/home" style={{ color:'var(--t3)', textDecoration:'none' }}>Accueil</Link>
            <span>›</span>
            <Link to="/explorer" style={{ color:'var(--t3)', textDecoration:'none' }}>Explorer</Link>
            <span>›</span>
            <span style={{ color:'var(--t1)', fontWeight:600,
              overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
              maxWidth:200 }}>{titre}</span>
          </div>
        </div>
      </div>

      <main style={{ padding:'32px 0 60px' }}>
        <div className="container">
          <div style={{ display:'grid', gridTemplateColumns:'1fr 380px', gap:36, alignItems:'start' }}
            className="fiche-grid">

            {/* ── Colonne gauche ── */}
            <div>
              {/* Image principale */}
              <div style={{ background: bg || '#F0F0F5', borderRadius:20, height:400,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:110, position:'relative', marginBottom:16,
                border:'1px solid var(--g2)', overflow:'hidden' }}>

                {don && (
                  <span className="badge badge-don"
                    style={{ position:'absolute', top:16, left:16, fontSize:13, padding:'5px 14px' }}>
                    DON GRATUIT
                  </span>
                )}
                {boost && !don && (
                  <span className="badge badge-boost"
                    style={{ position:'absolute', top:16, left:16, fontSize:13, padding:'5px 14px' }}>
                    BOOST
                  </span>
                )}

                {/* Si vraie photo Firebase Storage */}
                {article.photos && article.photos.length > 0 ? (
                  <img src={article.photos[0]} alt={titre}
                    style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                ) : (
                  <span>{emoji || '📦'}</span>
                )}

                {/* Boutons flottants */}
                <div style={{ position:'absolute', top:16, right:16,
                  display:'flex', flexDirection:'column', gap:8 }}>
                  <button
                    onClick={() => {
                      toggleFavori(articleId)
                      showToast(isFavori(articleId) ? '💔 Retiré des favoris' : '❤️ Ajouté aux favoris')
                    }}
                    style={{ width:40, height:40, borderRadius:10,
                      background:'rgba(255,255,255,.92)', border:'1px solid var(--g2)',
                      cursor:'pointer', fontSize:18, display:'flex',
                      alignItems:'center', justifyContent:'center',
                      boxShadow:'0 2px 8px rgba(0,0,0,.1)' }}>
                    {isFavori(articleId) ? '❤️' : '🤍'}
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(window.location.href)
                        .then(() => showToast('📤 Lien copié !'))
                        .catch(() => showToast('📤 Copie non disponible'))
                    }}
                    style={{ width:40, height:40, borderRadius:10,
                      background:'rgba(255,255,255,.92)', border:'1px solid var(--g2)',
                      cursor:'pointer', fontSize:18, display:'flex',
                      alignItems:'center', justifyContent:'center',
                      boxShadow:'0 2px 8px rgba(0,0,0,.1)' }}>
                    📤
                  </button>
                </div>
              </div>

              {/* Miniatures si plusieurs photos */}
              {article.photos && article.photos.length > 1 && (
                <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
                  {article.photos.map((url, i) => (
                    <img key={i} src={url} alt={`Photo ${i+1}`}
                      style={{ width:72, height:72, objectFit:'cover',
                        borderRadius:10, border:'2px solid var(--g2)', cursor:'pointer' }}/>
                  ))}
                </div>
              )}

              {/* Description */}
              <div className="card" style={{ padding:24, marginBottom:20 }}>
                <h2 style={{ fontSize:17, fontWeight:700, marginBottom:12 }}>Description</h2>
                <p style={{ fontSize:15, color:'var(--t2)', lineHeight:1.75 }}>
                  {desc || 'Aucune description disponible.'}
                </p>
                <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:16 }}>
                  <span className={`badge ${etatClass(etat)}`}
                    style={{ fontSize:12, padding:'4px 12px' }}>
                    {etatLabel(etat)}
                  </span>
                  <span style={{ background:'var(--g1)', borderRadius:20, padding:'4px 12px',
                    fontSize:12, color:'var(--t2)', border:'1px solid var(--g2)' }}>
                    📍 {lieu}
                  </span>
                  <span style={{ background:'var(--g1)', borderRadius:20, padding:'4px 12px',
                    fontSize:12, color:'var(--t2)', border:'1px solid var(--g2)' }}>
                    🏷️ {cat}
                  </span>
                </div>
              </div>

              {/* Articles similaires */}
              {similaires.length > 0 && (
                <div>
                  <h3 style={{ fontSize:17, fontWeight:700, marginBottom:14 }}>
                    Articles similaires
                  </h3>
                  <div className="products-grid">
                    {similaires.map(a => (
                      <Link key={a.firestoreId || a.id}
                        to={`/article/${a.firestoreId || a.id}`} className="product-card">
                        <div className="product-card-img"
                          style={{ background: a.bg || '#F0F0F5', height:110, fontSize:36 }}>
                          {a.don && <span className="badge badge-don"
                            style={{ position:'absolute', top:8, left:8 }}>DON</span>}
                          {a.photos?.[0]
                            ? <img src={a.photos[0]} alt={a.titre}
                                style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                            : <span>{a.emoji || '📦'}</span>
                          }
                        </div>
                        <div className="product-card-body">
                          <div className="product-card-title">{a.titre}</div>
                          <div className={`product-card-price ${a.don ? 'don' : ''}`}>
                            {fmtPrix(a.prix)}
                          </div>
                          <div className="product-card-meta">
                            <span className="product-card-loc">📍 {a.lieu}</span>
                            <span className={`badge ${etatClass(a.etat)}`}>
                              {etatLabel(a.etat)}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── Colonne droite sticky ── */}
            <div style={{ position:'sticky', top:90 }}>

              {/* Prix + CTA */}
              <div className="card" style={{ padding:24, marginBottom:16 }}>
                <h1 style={{ fontSize:20, fontWeight:700, color:'var(--t1)',
                  marginBottom:10, lineHeight:1.3 }}>
                  {titre}
                </h1>

                {don ? (
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
                    <span style={{ fontSize:30, fontWeight:800, color:'var(--green-d)' }}>
                      Gratuit
                    </span>
                    <span className="badge badge-don" style={{ fontSize:12 }}>DON</span>
                  </div>
                ) : (
                  <div style={{ fontSize:30, fontWeight:800, color:'var(--green)',
                    marginBottom:16 }}>
                    {fmtPrix(prix)}
                  </div>
                )}

                <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
                  <span className={`badge ${etatClass(etat)}`}
                    style={{ fontSize:12, padding:'4px 12px' }}>
                    {etatLabel(etat)}
                  </span>
                  <span style={{ background:'var(--g1)', borderRadius:20, padding:'4px 12px',
                    fontSize:12, color:'var(--t2)', border:'1px solid var(--g2)' }}>
                    📍 {lieu}
                  </span>
                </div>

                {/* Bouton WhatsApp */}
                <a href={lienWA} target="_blank" rel="noopener noreferrer"
                  style={{ display:'flex', alignItems:'center', justifyContent:'center',
                    gap:10, width:'100%', background:'#25D366', color:'#fff',
                    border:'none', borderRadius:14, padding:'15px 20px',
                    fontSize:16, fontWeight:700, cursor:'pointer',
                    textDecoration:'none', boxShadow:'0 4px 16px rgba(37,211,102,.35)' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.122.554 4.118 1.523 5.857L.057 23.882a.5.5 0 00.606.63l6.258-1.643A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.9 0-3.68-.524-5.198-1.437l-.372-.224-3.862 1.014 1.033-3.77-.243-.389A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                  </svg>
                  {don ? 'Demander via WhatsApp' : 'Contacter sur WhatsApp'}
                </a>
                <div style={{ marginTop:10, fontSize:12, color:'var(--t3)', textAlign:'center' }}>
                  Tu seras redirigé vers WhatsApp pour contacter le vendeur
                </div>
              </div>

              {/* Vendeur */}
              <div className="card" style={{ padding:20, marginBottom:16 }}>
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
                  <div style={{ width:48, height:48, borderRadius:'50%',
                    background: vendeur?.couleur || 'var(--green)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    color:'#fff', fontWeight:700, fontSize:16, flexShrink:0 }}>
                    {vendeur?.initiales || 'VD'}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:15, color:'var(--t1)' }}>
                      {vendeur?.nom || 'Vendeur DEALOO'}
                    </div>
                    <div style={{ fontSize:12, color:'var(--t3)', marginTop:2 }}>
                      Membre depuis {vendeur?.membre || '2025'}
                    </div>
                  </div>
                  <span style={{ background:'var(--green-l)', color:'var(--green-d)',
                    fontSize:11, fontWeight:700, padding:'3px 9px', borderRadius:8 }}>
                    ✓ Vérifié
                  </span>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr',
                  background:'var(--g1)', borderRadius:12, padding:12 }}>
                  {[
                    { n: '★ ' + (vendeur?.note || 5), l:'Note' },
                    { n: vendeur?.ventes || 0,        l:'Ventes' },
                    { n: vendeur?.dons || 0,          l:'Dons' },
                  ].map(s => (
                    <div key={s.l} style={{ textAlign:'center' }}>
                      <div style={{ fontWeight:800, fontSize:15, color:'var(--t1)' }}>{s.n}</div>
                      <div style={{ fontSize:11, color:'var(--t3)', marginTop:2 }}>{s.l}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Conseils sécurité */}
              <div style={{ background:'#FFF7ED', border:'1px solid #FED7AA',
                borderRadius:14, padding:16, marginBottom:12 }}>
                <div style={{ fontWeight:700, fontSize:13, color:'#C2410C', marginBottom:8 }}>
                  ⚠️ Conseils de sécurité
                </div>
                <ul style={{ fontSize:12, color:'#9A3412', lineHeight:1.8,
                  paddingLeft:16, margin:0 }}>
                  <li>Rencontre le vendeur dans un lieu public</li>
                  <li>Vérifie l'article avant de payer</li>
                  <li>Ne transfère jamais d'argent à l'avance</li>
                </ul>
              </div>

              <div style={{ textAlign:'center' }}>
                <button
                  onClick={() => setShowSignalModal(true)}
                  style={{ background:'none', border:'none', color:'var(--t3)',
                    fontSize:12, cursor:'pointer', textDecoration:'underline' }}>
                  ⚠️ Signaler cette annonce
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* ── Modale de signalement ── */}
      {showSignalModal && (
        <div onClick={() => !signalSending && setShowSignalModal(false)}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.6)',
            display:'flex', alignItems:'center', justifyContent:'center',
            padding:20, zIndex:10000, animation:'fadeIn .15s ease' }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background:'var(--white)', borderRadius:18, padding:28,
              maxWidth:480, width:'100%', boxShadow:'0 20px 60px rgba(0,0,0,.3)' }}>

            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:8 }}>
              <div style={{ width:46, height:46, borderRadius:12,
                background:'#FFF1F2', display:'flex', alignItems:'center',
                justifyContent:'center', fontSize:22 }}>
                ⚠️
              </div>
              <div>
                <div style={{ fontSize:18, fontWeight:800, color:'var(--t1)' }}>
                  Signaler cette annonce
                </div>
                <div style={{ fontSize:13, color:'var(--t3)' }}>
                  Choisis la raison du signalement
                </div>
              </div>
            </div>

            <div style={{ marginTop:20, marginBottom:24 }}>
              {RAISONS_SIGNALEMENT.map(r => (
                <label key={r.val}
                  style={{ display:'flex', alignItems:'center', gap:12,
                    padding:'12px 14px', borderRadius:12, cursor:'pointer',
                    marginBottom:6, transition:'.15s',
                    background: raisonChoisie === r.val ? 'var(--green-l)' : 'var(--g1)',
                    border:`1.5px solid ${raisonChoisie === r.val ? 'var(--green)' : 'var(--g2)'}` }}>
                  <input type="radio" name="raison" value={r.val}
                    checked={raisonChoisie === r.val}
                    onChange={() => setRaisonChoisie(r.val)}
                    style={{ accentColor:'var(--green)' }}/>
                  <span style={{ fontSize:18 }}>{r.ico}</span>
                  <span style={{ fontSize:14, fontWeight:600, color:'var(--t1)' }}>
                    {r.label}
                  </span>
                </label>
              ))}
            </div>

            <div style={{ background:'rgba(245,158,11,.1)',
              border:'1px solid rgba(245,158,11,.3)', borderRadius:10,
              padding:'10px 14px', fontSize:12, color:'#92400E',
              marginBottom:20, lineHeight:1.5 }}>
              💡 Ton signalement sera examiné par les administrateurs DEALOO.
              Les abus de signalement peuvent entraîner la suspension de ton compte.
            </div>

            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => { setShowSignalModal(false); setRaisonChoisie('') }}
                disabled={signalSending}
                className="btn btn-outline" style={{ flex:1 }}>
                Annuler
              </button>
              <button onClick={envoyerSignalement}
                disabled={!raisonChoisie || signalSending}
                style={{ flex:2, padding:'11px', borderRadius:10, border:'none',
                  background: raisonChoisie ? '#EF4444' : 'var(--g3)',
                  color:'#fff', fontSize:14, fontWeight:700,
                  cursor: raisonChoisie ? 'pointer' : 'not-allowed' }}>
                {signalSending ? 'Envoi...' : '🚨 Envoyer le signalement'}
              </button>
            </div>
          </div>

          <style>{`@keyframes fadeIn { from {opacity:0} to {opacity:1} }`}</style>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed', bottom:32, left:'50%',
          transform:'translateX(-50%)', background:'var(--dark)', color:'#fff',
          padding:'12px 22px', borderRadius:20, fontSize:14, fontWeight:500,
          zIndex:9999, whiteSpace:'nowrap', boxShadow:'0 8px 24px rgba(0,0,0,.2)',
          animation:'fadeUp .25s ease' }}>
          {toast}
        </div>
      )}

      <style>{`
        @media (max-width: 900px) {
          .fiche-grid { grid-template-columns: 1fr !important; }
          .fiche-grid > div:last-child { position: static !important; }
        }
        @keyframes fadeUp {
          from { opacity:0; transform:translateX(-50%) translateY(10px); }
          to   { opacity:1; transform:translateX(-50%) translateY(0); }
        }
      `}</style>
    </>
  )
}
