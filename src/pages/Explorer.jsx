import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useArticles } from '../hooks/useArticles'

const CATS = ["Toutes","Mode Femme","Mode Homme","Téléphones","Voitures","Électronique","Maison","Sport","Enfants","Motos","Autres"]
const VILLES = ["Toutes","Conakry","Labé","Kankan","Kindia","N'Zérékoré"]
const ETATS = ["Tous","Neuf","Bon état","Usagé"]
const PRIX_OPTIONS = [
  { label:"Tout prix",  min:0, max:Infinity },
  { label:"🤲 Dons",   don:true },
  { label:"< 500K",    min:0, max:500000 },
  { label:"500K–2M",   min:500000, max:2000000 },
  { label:"> 2M GNF",  min:2000000, max:Infinity },
]

const fmtPrix = p => p === 0 ? "Gratuit" : p.toLocaleString("fr-FR") + " GNF"
const etatLabel = e => ({ neuf:"Neuf", bon:"Bon état", usage:"Usagé" }[e])
const etatClass = e => ({ neuf:"badge-neuf", bon:"badge-bon", usage:"badge-usage" }[e])

export default function Explorer() {
  const { articles, loading } = useArticles()
  const [search, setSearch] = useState("")
  const [cat,    setCat]    = useState("Toutes")
  const [ville,  setVille]  = useState("Toutes")
  const [etat,   setEtat]   = useState("Tous")
  const [prixIdx,setPrixIdx]= useState(0)
  const [sort,   setSort]   = useState("recent")
  const [showFilters, setShowFilters] = useState(false)

  const filtres = useMemo(() => {
    let list = articles
    const p = PRIX_OPTIONS[prixIdx]
    if (p.don) list = list.filter(a => a.don)
    else list = list.filter(a => a.prix >= p.min && a.prix <= p.max)
    if (cat !== "Toutes") list = list.filter(a => a.cat === cat)
    if (ville !== "Toutes") list = list.filter(a => a.lieu === ville || a.lieu?.includes(ville))
    if (etat !== "Tous") {
      const map = { "Neuf":"neuf", "Bon état":"bon", "Usagé":"usage" }
      list = list.filter(a => a.etat === map[etat])
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(a => a.titre?.toLowerCase().includes(q) || a.lieu?.toLowerCase().includes(q))
    }
    if (sort === "prix-asc")  list = [...list].sort((a,b) => a.prix - b.prix)
    if (sort === "prix-desc") list = [...list].sort((a,b) => b.prix - a.prix)
    if (sort === "dons")      list = [...list].sort((a,b) => b.don - a.don)
    return list
  }, [articles, search, cat, ville, etat, prixIdx, sort])

  const nbFiltresActifs = (cat !== "Toutes" ? 1:0) + (ville !== "Toutes" ? 1:0) +
    (etat !== "Tous" ? 1:0) + (prixIdx !== 0 ? 1:0)

  function resetFiltres() {
    setCat("Toutes"); setVille("Toutes"); setEtat("Tous"); setPrixIdx(0); setSearch("")
  }

  return (
    <>
      <Navbar search={search} onSearch={setSearch} />

      {/* ── Bandeau ── */}
      <div style={{ background:"var(--dark)", padding:"32px 0 24px" }}>
        <div className="container">
          <h1 style={{ fontSize:"clamp(24px,4vw,36px)", fontWeight:800, color:"#fff", marginBottom:8 }}>
            Explorer les annonces
          </h1>
          <p style={{ fontSize:15, color:"rgba(255,255,255,.5)" }}>
            {loading ? '...' : articles.length} articles disponibles partout en Guinée
          </p>
          {/* Recherche */}
          <div style={{ marginTop:20, background:"rgba(255,255,255,.1)", border:"1.5px solid rgba(255,255,255,.15)",
            borderRadius:14, padding:"11px 16px", display:"flex", alignItems:"center", gap:10,
            maxWidth:560 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="7" stroke="rgba(255,255,255,.5)" strokeWidth="2"/>
              <path d="M17 17l3 3" stroke="rgba(255,255,255,.5)" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un article, une ville..."
              style={{ background:"transparent", border:"none", outline:"none",
                fontSize:14, color:"#fff", width:"100%" }}/>
            {search && <button onClick={() => setSearch("")}
              style={{ background:"none", border:"none", color:"rgba(255,255,255,.5)", cursor:"pointer", fontSize:18 }}>✕</button>}
          </div>
        </div>
      </div>

      <main style={{ padding:"24px 0 60px" }}>
        <div className="container">
          <div style={{ display:"grid", gridTemplateColumns:"240px 1fr", gap:28 }} className="explorer-layout">

            {/* ── Sidebar filtres (desktop) ── */}
            <aside style={{ display:"block" }} className="explorer-sidebar">
              <div className="card" style={{ padding:20, marginBottom:16 }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
                  <span style={{ fontWeight:700, fontSize:15 }}>Filtres</span>
                  {nbFiltresActifs > 0 && (
                    <button onClick={resetFiltres}
                      style={{ background:"none", border:"none", color:"var(--green)", fontSize:12, fontWeight:600, cursor:"pointer" }}>
                      Réinitialiser ({nbFiltresActifs})
                    </button>
                  )}
                </div>

                {/* Catégorie */}
                <div style={{ marginBottom:20 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:"var(--t3)", textTransform:"uppercase",
                    letterSpacing:".6px", marginBottom:8 }}>Catégorie</div>
                  {CATS.map(c => (
                    <div key={c} onClick={() => setCat(c)}
                      style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 0",
                        cursor:"pointer", fontSize:14,
                        color: cat === c ? "var(--green)" : "var(--t2)",
                        fontWeight: cat === c ? 700 : 400 }}>
                      <div style={{ width:16, height:16, borderRadius:"50%",
                        border:`2px solid ${cat === c ? "var(--green)" : "var(--g3)"}`,
                        background: cat === c ? "var(--green)" : "transparent",
                        display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                        {cat === c && <div style={{ width:6, height:6, borderRadius:"50%", background:"#fff" }}/>}
                      </div>
                      {c}
                    </div>
                  ))}
                </div>

                {/* Ville */}
                <div style={{ marginBottom:20 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:"var(--t3)", textTransform:"uppercase",
                    letterSpacing:".6px", marginBottom:8 }}>Ville</div>
                  <select className="field-select" style={{ marginBottom:0 }}
                    value={ville} onChange={e => setVille(e.target.value)}>
                    {VILLES.map(v => <option key={v}>{v}</option>)}
                  </select>
                </div>

                {/* État */}
                <div style={{ marginBottom:20 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:"var(--t3)", textTransform:"uppercase",
                    letterSpacing:".6px", marginBottom:8 }}>État</div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                    {ETATS.map(e => (
                      <button key={e} onClick={() => setEtat(e)}
                        style={{ padding:"5px 12px", borderRadius:20, border:"1.5px solid",
                          borderColor: etat === e ? "var(--green)" : "var(--g3)",
                          background: etat === e ? "var(--green)" : "var(--white)",
                          color: etat === e ? "var(--dark)" : "var(--t2)",
                          fontSize:12, fontWeight:600, cursor:"pointer" }}>
                        {e}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Prix */}
                <div>
                  <div style={{ fontSize:11, fontWeight:700, color:"var(--t3)", textTransform:"uppercase",
                    letterSpacing:".6px", marginBottom:8 }}>Prix</div>
                  {PRIX_OPTIONS.map((p, i) => (
                    <div key={i} onClick={() => setPrixIdx(i)}
                      style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 0",
                        cursor:"pointer", fontSize:14,
                        color: prixIdx === i ? "var(--green)" : "var(--t2)",
                        fontWeight: prixIdx === i ? 700 : 400 }}>
                      <div style={{ width:16, height:16, borderRadius:"50%",
                        border:`2px solid ${prixIdx === i ? "var(--green)" : "var(--g3)"}`,
                        background: prixIdx === i ? "var(--green)" : "transparent",
                        display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                        {prixIdx === i && <div style={{ width:6, height:6, borderRadius:"50%", background:"#fff" }}/>}
                      </div>
                      {p.label}
                    </div>
                  ))}
                </div>
              </div>
            </aside>

            {/* ── Résultats ── */}
            <div>
              {/* Barre résultats + tri */}
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                marginBottom:16, flexWrap:"wrap", gap:10 }}>
                <div style={{ fontSize:14, color:"var(--t2)" }}>
                  <strong style={{ color:"var(--t1)" }}>{filtres.length}</strong> résultat{filtres.length > 1 ? "s" : ""}
                  {search && <span> pour "<strong>{search}</strong>"</span>}
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  {/* Mobile : bouton filtres */}
                  <button onClick={() => setShowFilters(!showFilters)}
                    style={{ display:"none", alignItems:"center", gap:6, padding:"7px 14px",
                      background:"var(--white)", border:"1.5px solid var(--g3)", borderRadius:10,
                      fontSize:13, fontWeight:600, cursor:"pointer", color:"var(--t1)" }}
                    className="mobile-filter-btn">
                    🔧 Filtres {nbFiltresActifs > 0 && `(${nbFiltresActifs})`}
                  </button>
                  <select value={sort} onChange={e => setSort(e.target.value)}
                    style={{ background:"var(--white)", border:"1.5px solid var(--g2)", borderRadius:8,
                      padding:"7px 12px", fontSize:13, color:"var(--t2)", cursor:"pointer", outline:"none" }}>
                    <option value="recent">Plus récents</option>
                    <option value="prix-asc">Prix croissant</option>
                    <option value="prix-desc">Prix décroissant</option>
                    <option value="dons">Dons en premier</option>
                  </select>
                </div>
              </div>

              {/* Chips filtres actifs */}
              {nbFiltresActifs > 0 && (
                <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:16 }}>
                  {cat !== "Toutes" && <Chip label={cat} onRemove={() => setCat("Toutes")}/>}
                  {ville !== "Toutes" && <Chip label={ville} onRemove={() => setVille("Toutes")}/>}
                  {etat !== "Tous" && <Chip label={etat} onRemove={() => setEtat("Tous")}/>}
                  {prixIdx !== 0 && <Chip label={PRIX_OPTIONS[prixIdx].label} onRemove={() => setPrixIdx(0)}/>}
                </div>
              )}

              {/* Grille */}
              {filtres.length === 0 ? (
                <div style={{ textAlign:"center", padding:"80px 20px", color:"var(--t3)" }}>
                  <div style={{ fontSize:56, marginBottom:16 }}>🔍</div>
                  <div style={{ fontSize:20, fontWeight:700, color:"var(--t1)", marginBottom:8 }}>Aucun résultat</div>
                  <div style={{ fontSize:14, marginBottom:20 }}>Essaie d'autres filtres</div>
                  <button onClick={resetFiltres} className="btn btn-green">Réinitialiser les filtres</button>
                </div>
              ) : (
                <div className="products-grid">
                  {filtres.map(a => <ArticleCard key={a.id} article={a}/>)}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer/>

      <style>{`
        @media (max-width: 768px) {
          .explorer-layout { grid-template-columns: 1fr !important; }
          .explorer-sidebar { display: none !important; }
          .mobile-filter-btn { display: flex !important; }
        }
      `}</style>
    </>
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


function Chip({ label, onRemove }) {
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:6, background:"var(--green-l)",
      color:"var(--green-d)", border:"1px solid var(--green-m)", borderRadius:20,
      padding:"4px 12px", fontSize:12, fontWeight:600 }}>
      {label}
      <button onClick={onRemove}
        style={{ background:"none", border:"none", color:"var(--green-d)", cursor:"pointer",
          fontSize:14, lineHeight:1, padding:0 }}>×</button>
    </span>
  )
}
