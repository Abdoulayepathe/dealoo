import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useFavoris } from '../context/FavorisContext'
import { useArticles } from '../hooks/useArticles'
import { fmtPrix, etatLabel, etatClass } from '../data/articles'

export default function Favoris() {
  const { favoris, toggleFavori } = useFavoris()
  const { articles, loading }     = useArticles()

  const mesFavoris = articles.filter(a =>
    favoris.includes(a.firestoreId || a.id)
  )

  return (
    <>
      <Navbar />

      {/* Header */}
      <div style={{ background:'var(--dark)', padding:'32px 0 24px' }}>
        <div className="container">
          <Link to="/home" className="btn-back" style={{ marginBottom:12, display:'inline-flex' }}>
            ← Accueil
          </Link>
          <h1 style={{ fontSize:'clamp(22px,4vw,34px)', fontWeight:800, color:'#fff', marginBottom:6 }}>
            Mes favoris ❤️
          </h1>
          <p style={{ fontSize:14, color:'rgba(255,255,255,.45)' }}>
            {mesFavoris.length} article{mesFavoris.length > 1 ? 's' : ''} sauvegardé{mesFavoris.length > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <main style={{ padding:'32px 0 60px' }}>
        <div className="container">
          {loading ? (
            <div style={{ textAlign:'center', padding:'60px 20px', color:'var(--t3)' }}>
              <div style={{ fontSize:32, marginBottom:12 }}>⏳</div>
              <div>Chargement...</div>
            </div>
          ) : mesFavoris.length === 0 ? (
            <div style={{ textAlign:'center', padding:'80px 20px', color:'var(--t3)' }}>
              <div style={{ fontSize:64, marginBottom:16 }}>🤍</div>
              <div style={{ fontSize:22, fontWeight:700, color:'var(--t1)', marginBottom:8 }}>
                Aucun favori pour l'instant
              </div>
              <p style={{ fontSize:15, marginBottom:28, lineHeight:1.6 }}>
                Clique sur le ❤️ sur un article pour le sauvegarder ici
              </p>
              <Link to="/explorer" className="btn btn-green btn-lg">
                Explorer les articles →
              </Link>
            </div>
          ) : (
            <>
              <div className="products-grid">
                {mesFavoris.map(a => (
                  <div key={a.firestoreId || a.id} style={{ position:'relative' }}>
                    <Link to={`/article/${a.firestoreId || a.id}`} className="product-card">
                      <div className="product-card-img" style={{ background: a.bg || '#F0F0F5' }}>
                        {a.don && <span className="badge badge-don" style={{ position:'absolute', top:10, left:10 }}>DON</span>}
                        <span style={{ fontSize:'clamp(32px,5vw,54px)' }}>{a.emoji || '📦'}</span>
                      </div>
                      <div className="product-card-body">
                        <div className="product-card-title">{a.titre}</div>
                        <div className={`product-card-price ${a.don ? 'don' : ''}`}>
                          {fmtPrix(a.prix)}
                        </div>
                        <div className="product-card-meta">
                          <span className="product-card-loc">📍 {a.lieu}</span>
                          <span className={`badge ${etatClass(a.etat)}`}>{etatLabel(a.etat)}</span>
                        </div>
                      </div>
                    </Link>

                    {/* Bouton supprimer favori */}
                    <button
                      onClick={() => toggleFavori(a.firestoreId || a.id)}
                      title="Retirer des favoris"
                      style={{ position:'absolute', top:10, right:10, width:32, height:32,
                        borderRadius:'50%', background:'rgba(255,255,255,.92)',
                        border:'1px solid var(--g2)', cursor:'pointer',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize:15, boxShadow:'0 2px 8px rgba(0,0,0,.1)',
                        zIndex:10 }}>
                      ❤️
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ textAlign:'center', marginTop:32 }}>
                <Link to="/explorer" className="btn btn-outline btn-lg">
                  Découvrir plus d'articles →
                </Link>
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </>
  )
}
