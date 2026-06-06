import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useArticles } from '../hooks/useArticles'
import { fmtPrix, etatLabel, etatClass } from '../data/articles'

const CATS = [
  'Tout', 'Dons', 'Mode Femme', 'Mode Homme',
  'Téléphones', 'Voitures', 'Électronique',
  'Maison', 'Sport', 'Motos', 'Autres'
]

function SkeletonCard() {
  return (
    <div style={{ background:'var(--white)', borderRadius:16, border:'1px solid var(--g2)', overflow:'hidden' }}>
      <div style={{ height:160, background:'linear-gradient(90deg,var(--g1) 25%,var(--g2) 50%,var(--g1) 75%)', backgroundSize:'200% 100%', animation:'shimmer 1.5s infinite' }}/>
      <div style={{ padding:12 }}>
        <div style={{ height:13, background:'var(--g2)', borderRadius:7, marginBottom:8, width:'80%' }}/>
        <div style={{ height:18, background:'var(--g2)', borderRadius:7, marginBottom:8, width:'50%' }}/>
        <div style={{ height:12, background:'var(--g2)', borderRadius:7, width:'70%' }}/>
      </div>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
    </div>
  )
}

function ArticleCard({ article: a }) {
  const articleId = a.firestoreId || a.id
  const hasPhoto  = a.photos && a.photos.length > 0

  return (
    <Link to={`/article/${articleId}`} className="product-card">
      <div className="product-card-img" style={{ background: a.bg || '#F0F0F5', overflow:'hidden' }}>
        {a.don && <span className="badge badge-don" style={{ position:'absolute', top:10, left:10 }}>DON</span>}
        {a.boost && !a.don && <span className="badge badge-boost" style={{ position:'absolute', top:10, left:10 }}>BOOST</span>}
        {hasPhoto ? (
          <img
            src={a.photos[0]}
            alt={a.titre}
            style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}
            onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex' }}
          />
        ) : null}
        <span style={{
          fontSize:'clamp(32px,5vw,54px)',
          display: hasPhoto ? 'none' : 'flex',
          alignItems:'center', justifyContent:'center',
          width:'100%', height:'100%',
        }}>
          {a.emoji || '📦'}
        </span>
      </div>
      <div className="product-card-body">
        <div className="product-card-title">{a.titre}</div>
        <div className={`product-card-price ${a.don ? 'don' : ''}`}>{fmtPrix(a.prix)}</div>
        <div className="product-card-meta">
          <span className="product-card-loc">📍 {a.lieu}</span>
          <span className={`badge ${etatClass(a.etat)}`}>{etatLabel(a.etat)}</span>
        </div>
      </div>
    </Link>
  )
}

export default function Accueil() {
  const [search, setSearch] = useState('')
  const [cat, setCat]       = useState('Tout')

  // ✅ FIRESTORE TEMPS RÉEL — l'accueil se met à jour automatiquement
  const { articles, loading } = useArticles()

  const filtres = useMemo(() => {
    let list = articles
    if (cat === 'Dons')      list = list.filter(a => a.don)
    else if (cat !== 'Tout') list = list.filter(a => a.cat === cat)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(a =>
        a.titre?.toLowerCase().includes(q) || a.lieu?.toLowerCase().includes(q)
      )
    }
    return list
  }, [articles, search, cat])

  const totalDons = articles.filter(a => a.don).length

  return (
    <>
      <Navbar search={search} onSearch={setSearch} />

      {/* Hero */}
      <section style={{ background:'linear-gradient(135deg,#0A0A0F,#0D1B2A)', padding:'72px 0 56px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-120, right:-120, width:450, height:450, borderRadius:'50%', background:'var(--green)', opacity:.07 }}/>
        <div className="container" style={{ position:'relative', zIndex:1 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(0,200,150,.12)', border:'1px solid rgba(0,200,150,.25)', borderRadius:20, padding:'5px 14px', marginBottom:22 }}>
            <span style={{ width:7, height:7, borderRadius:'50%', background:'var(--green)', display:'inline-block', animation:'pulse 2s infinite' }}/>
            <span style={{ fontSize:13, color:'var(--green)', fontWeight:600 }}>
              {loading ? '...' : articles.length} articles disponibles
            </span>
          </div>
          <h1 style={{ fontSize:'clamp(28px,5vw,52px)', fontWeight:800, color:'#fff', lineHeight:1.15, marginBottom:18, maxWidth:640 }}>
            Achète et vends facilement<br/>
            <span style={{ color:'var(--green)' }}>en Guinée 🇬🇳</span>
          </h1>
          <p style={{ fontSize:'clamp(14px,2vw,17px)', color:'rgba(255,255,255,.5)', marginBottom:32, maxWidth:520, lineHeight:1.65 }}>
            La première marketplace guinéenne. Mode, téléphones, voitures et bien plus en francs guinéens.
          </p>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
            <Link to="/explorer" className="btn btn-green btn-lg">Explorer les articles →</Link>
            <Link to="/publier" className="btn btn-lg" style={{ background:'rgba(255,255,255,.1)', color:'#fff', border:'1px solid rgba(255,255,255,.2)' }}>
              + Vendre un article
            </Link>
          </div>
          <div style={{ display:'flex', gap:32, marginTop:48, flexWrap:'wrap' }}>
            {[
              [loading ? '...' : articles.length, 'Annonces'],
              [loading ? '...' : totalDons, 'Dons gratuits'],
              ['5', 'Villes'],
              ['100%', 'Guinéen'],
            ].map(([n, l]) => (
              <div key={l}>
                <div style={{ fontWeight:800, fontSize:24, color:'#fff' }}>{n}</div>
                <div style={{ fontSize:12, color:'rgba(255,255,255,.4)', marginTop:2 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
      </section>

      {/* Catégories sticky */}
      <section style={{ background:'var(--white)', borderBottom:'1px solid var(--g2)', padding:'12px 0', position:'sticky', top:64, zIndex:90, boxShadow:'0 2px 8px rgba(0,0,0,.05)' }}>
        <div className="container">
          <div className="chips-row">
            {CATS.map(c => (
              <button key={c}
                className={`chip ${c === 'Dons' ? 'don-chip' : ''} ${cat === c ? 'active' : ''}`}
                onClick={() => setCat(c)}>
                {c === 'Dons' ? '🤲 Dons gratuits' : c}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Articles */}
      <main style={{ padding:'40px 0 60px' }}>
        <div className="container">
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:10 }}>
            <div style={{ fontSize:18, fontWeight:700, color:'var(--t1)' }}>
              {cat === 'Tout' ? 'Toutes les annonces' : cat === 'Dons' ? '🤲 Dons gratuits' : cat}
              <span style={{ fontSize:14, fontWeight:400, color:'var(--t3)', marginLeft:8 }}>
                ({loading ? '...' : filtres.length})
              </span>
            </div>
            <Link to="/explorer" className="btn btn-outline btn-sm">Voir tout →</Link>
          </div>

          {loading ? (
            <div className="products-grid">
              {[1,2,3,4,5,6,7,8].map(i => <SkeletonCard key={i} />)}
            </div>
          ) : articles.length === 0 ? (
            // ── BASE FIRESTORE VIDE — invite à publier ──
            <div style={{ textAlign:'center', padding:'80px 20px', background:'var(--g1)', borderRadius:16, border:'2px dashed var(--g3)' }}>
              <div style={{ fontSize:64, marginBottom:16 }}>📦</div>
              <div style={{ fontSize:22, fontWeight:800, color:'var(--t1)', marginBottom:8 }}>
                Aucune annonce publiée pour l'instant
              </div>
              <div style={{ fontSize:15, color:'var(--t2)', marginBottom:28, maxWidth:480, margin:'0 auto 28px' }}>
                Sois le premier à publier sur DEALOO ! Vends, donne ou achète entre Guinéens.
              </div>
              <Link to="/publier" className="btn btn-green btn-lg" style={{ display:'inline-flex', alignItems:'center', gap:8 }}>
                + Publier une annonce
              </Link>
            </div>
          ) : filtres.length === 0 ? (
            // ── FILTRE/RECHERCHE SANS RÉSULTAT ──
            <div style={{ textAlign:'center', padding:'60px 20px', color:'var(--t3)' }}>
              <div style={{ fontSize:48, marginBottom:12 }}>🔍</div>
              <div style={{ fontSize:18, fontWeight:700, color:'var(--t1)', marginBottom:8 }}>Aucun résultat</div>
              <div style={{ fontSize:14, color:'var(--t2)', marginBottom:16 }}>
                {articles.length} annonce(s) au total, mais aucune ne correspond à ta recherche
              </div>
              <button onClick={() => { setCat('Tout'); setSearch('') }} className="btn btn-green" style={{ marginTop:8 }}>
                Voir tout
              </button>
            </div>
          ) : (
            <div className="products-grid">
              {filtres.map(a => <ArticleCard key={a.firestoreId || a.id} article={a} />)}
            </div>
          )}

          {!loading && filtres.length > 0 && (
            <div style={{ textAlign:'center', marginTop:32 }}>
              <Link to="/explorer" className="btn btn-outline btn-lg">Voir toutes les annonces →</Link>
            </div>
          )}
        </div>
      </main>

      {/* Comment ça marche */}
      <section style={{ background:'var(--white)', borderTop:'1px solid var(--g2)', padding:'60px 0' }}>
        <div className="container" style={{ textAlign:'center' }}>
          <h2 style={{ fontSize:'clamp(20px,3vw,30px)', fontWeight:800, marginBottom:8 }}>Comment ça marche ?</h2>
          <p style={{ fontSize:15, color:'var(--t3)', marginBottom:48 }}>En 3 étapes simples</p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:32 }}>
            {[
              { num:'01', ico:'📸', t:'Publie ton article', s:'Photos, description et prix en GNF.' },
              { num:'02', ico:'💬', t:'Contact WhatsApp',   s:"L'acheteur te contacte directement." },
              { num:'03', ico:'🤝', t:'Vends et livre',     s:"Remets l'article et encaisse." },
            ].map(step => (
              <div key={step.num}>
                <div style={{ width:64, height:64, borderRadius:'50%', background:'var(--green-l)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, margin:'0 auto 16px' }}>
                  {step.ico}
                </div>
                <div style={{ fontSize:12, fontWeight:700, color:'var(--green)', letterSpacing:1, textTransform:'uppercase', marginBottom:6 }}>
                  Étape {step.num}
                </div>
                <div style={{ fontSize:16, fontWeight:700, marginBottom:8 }}>{step.t}</div>
                <div style={{ fontSize:14, color:'var(--t3)', lineHeight:1.6 }}>{step.s}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop:40 }}>
            <Link to="/publier" className="btn btn-green btn-lg">Publier gratuitement →</Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
