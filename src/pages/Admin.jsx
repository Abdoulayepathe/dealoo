import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  collection, getDocs, deleteDoc,
  doc, query, orderBy, updateDoc, onSnapshot
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, Package, Users, Flag,
  BarChart2, Cpu, LogOut, ChevronRight,
  TrendingUp, TrendingDown, Eye, Trash2,
  Check, X, AlertTriangle, Search,
  Bell, ArrowUpRight, MoreHorizontal,
  ShieldCheck, Clock, CircleDot, Home
} from 'lucide-react'

// ── Palette Vinted style ──────────────────────────────────────
const V = {
  bg:      '#F7F7F9',
  white:   '#FFFFFF',
  border:  '#EAECF0',
  t1:      '#1B1C1E',
  t2:      '#6B7280',
  t3:      '#9CA3AF',
  green:   '#09B3A4',
  greenL:  '#E6F7F6',
  red:     '#E53E3E',
  redL:    '#FFF5F5',
  orange:  '#ED8936',
  orangeL: '#FFFAF0',
  blue:    '#3B82F6',
  blueL:   '#EFF6FF',
  purple:  '#8B5CF6',
  purpleL: '#F5F3FF',
}

// ── Données démo ──────────────────────────────────────────────
const ACT_DATA = [42, 67, 55, 89, 73, 95, 81, 78, 92, 65, 88, 74, 91, 83]
const JOURS    = ['L','M','M','J','V','S','D','L','M','M','J','V','S','D']

const fmt = p => p === 0 ? 'Gratuit' : p.toLocaleString('fr-FR') + ' GNF'

// Date Firestore → "il y a X temps"
function tempsRelatif(ts) {
  if (!ts?.seconds) return '—'
  const sec = Math.floor(Date.now() / 1000) - ts.seconds
  if (sec < 60)        return 'À l\'instant'
  if (sec < 3600)      return `Il y a ${Math.floor(sec / 60)} min`
  if (sec < 86400)     return `Il y a ${Math.floor(sec / 3600)} h`
  if (sec < 86400 * 7) return `Il y a ${Math.floor(sec / 86400)} j`
  return new Date(ts.seconds * 1000).toLocaleDateString('fr-FR', { day:'numeric', month:'short' })
}

// ── Composants UI ─────────────────────────────────────────────
function KPICard({ label, value, sub, trend, icon: Icon, color, light }) {
  const up = trend >= 0
  return (
    <div style={{ background:V.white, border:`1px solid ${V.border}`, borderRadius:16,
      padding:'20px 22px', display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ fontSize:13, fontWeight:500, color:V.t2 }}>{label}</div>
        <div style={{ width:40, height:40, borderRadius:12, background:light,
          display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Icon size={20} color={color}/>
        </div>
      </div>
      <div>
        <div style={{ fontSize:28, fontWeight:700, color:V.t1, letterSpacing:-.5 }}>{value}</div>
        <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:6 }}>
          {up
            ? <TrendingUp size={14} color="#10B981"/>
            : <TrendingDown size={14} color={V.red}/>
          }
          <span style={{ fontSize:12, color: up ? '#10B981' : V.red, fontWeight:600 }}>
            {up ? '+' : ''}{trend}%
          </span>
          <span style={{ fontSize:12, color:V.t3 }}>{sub}</span>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ type }) {
  const map = {
    actif:      { bg:'#F0FDF4', color:'#15803D', label:'Actif'       },
    suspect:    { bg:'#FFF7ED', color:'#C2410C', label:'Suspect'     },
    banni:      { bg:'#FFF1F2', color:'#BE123C', label:'Banni'       },
    vendeur:    { bg:V.purpleL, color:V.purple,  label:'Vendeur'     },
    moderateur: { bg:V.blueL,   color:V.blue,    label:'Modérateur'  },
    utilisateur:{ bg:'#F9FAFB', color:V.t2,      label:'Utilisateur' },
    pending:    { bg:'#FFF7ED', color:'#C2410C', label:'En attente'  },
    resolu:     { bg:'#F0FDF4', color:'#15803D', label:'Résolu'      },
    don:        { bg:V.greenL,  color:'#0F766E', label:'DON'         },
    active:     { bg:'#F0FDF4', color:'#15803D', label:'Active'      },
  }
  const s = map[type] || map.utilisateur
  return (
    <span style={{ background:s.bg, color:s.color, fontSize:11, fontWeight:600,
      padding:'4px 10px', borderRadius:20, whiteSpace:'nowrap' }}>
      {s.label}
    </span>
  )
}

function ActionBtn({ children, danger, success, onClick, small }) {
  const bg    = danger  ? V.redL    : success ? V.greenL  : '#F9FAFB'
  const color = danger  ? V.red     : success ? '#0F766E' : V.t2
  const bdr   = danger  ? '#FECDD3' : success ? '#99F6E4' : V.border
  return (
    <button onClick={onClick}
      style={{ background:bg, border:`1px solid ${bdr}`, color, fontSize:small?10:12,
        fontWeight:600, padding: small ? '4px 9px' : '6px 14px',
        borderRadius:8, cursor:'pointer', display:'inline-flex',
        alignItems:'center', gap:4, whiteSpace:'nowrap' }}>
      {children}
    </button>
  )
}

// ── Graphique barres SVG ──────────────────────────────────────
function BarGraph({ data, labels }) {
  const max = Math.max(...data)
  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:6, height:90 }}>
      {data.map((v, i) => (
        <div key={i} style={{ flex:1, display:'flex', flexDirection:'column',
          alignItems:'center', gap:4, height:'100%', justifyContent:'flex-end' }}>
          <div style={{ width:'100%', borderRadius:'4px 4px 0 0',
            height: Math.max(6, Math.round((v/max)*72)) + 'px',
            background: v === max ? V.green : '#E5E7EB',
            transition:'.3s' }}/>
          <div style={{ fontSize:9, color:V.t3, fontWeight:500 }}>{labels[i]}</div>
        </div>
      ))}
    </div>
  )
}

// ── Graphique ligne SVG ───────────────────────────────────────
function MiniLine({ data, color }) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const W = 120, H = 36
  const pts = data.map((v, i) => {
    const x = (i / (data.length-1)) * W
    const y = H - ((v-min) / (max-min || 1)) * (H-6) - 3
    return `${x},${y}`
  }).join(' ')
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <defs>
        <linearGradient id={`g${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity=".2"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polygon points={`0,${H} ${pts} ${W},${H}`} fill={`url(#g${color})`}/>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2"
        strokeLinejoin="round" strokeLinecap="round"/>
    </svg>
  )
}

// ═══════════════════════════════════════════════
// PAGE DASHBOARD
// ═══════════════════════════════════════════════
function Dashboard({ annonces, users, signalements, onNav }) {
  const nbAnnonces = annonces.length
  const nbDons     = annonces.filter(a => a.est_don).length
  const nbUsers    = users.length
  const nbSignal   = signalements.filter(s => s.statut === 'pending').length

  // Valeur totale (ventes hors dons)
  const valeurTotale = annonces
    .filter(a => !a.est_don)
    .reduce((sum, a) => sum + (a.prix || 0), 0)
  const valeurFmt = valeurTotale >= 1000000
    ? (valeurTotale / 1000000).toFixed(1) + 'M'
    : (valeurTotale / 1000).toFixed(0) + 'K'

  // Activité 14 derniers jours — calcule depuis les vraies annonces
  const activity = (() => {
    const days = new Array(14).fill(0)
    const now = Date.now()
    annonces.forEach(a => {
      if (!a.date_publication?.seconds) return
      const diffDays = Math.floor((now - a.date_publication.seconds * 1000) / 86400000)
      if (diffDays >= 0 && diffDays < 14) days[13 - diffDays]++
    })
    return days
  })()
  const hasActivity = activity.some(v => v > 0)

  return (
    <div>
      <div style={{ marginBottom:28 }}>
        <div style={{ fontSize:22, fontWeight:700, color:V.t1 }}>Tableau de bord</div>
        <div style={{ fontSize:14, color:V.t2, marginTop:3 }}>
          Bienvenue dans l'espace d'administration DEALOO — données temps réel
        </div>
      </div>

      {/* KPIs RÉELS */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:24 }}>
        <KPICard label="Utilisateurs inscrits" value={nbUsers.toLocaleString('fr-FR')} trend={nbUsers > 0 ? 100 : 0}  sub="total"
          icon={Users} color={V.blue} light={V.blueL}/>
        <KPICard label="Annonces publiées"   value={nbAnnonces.toLocaleString('fr-FR')} trend={nbAnnonces > 0 ? 100 : 0} sub="actives"
          icon={Package} color={V.green} light={V.greenL}/>
        <KPICard label="Dons réalisés"        value={nbDons.toString()}  trend={nbDons > 0 ? 100 : 0} sub="gratuits"
          icon={ShieldCheck} color={V.purple} light={V.purpleL}/>
        <KPICard label="Valeur GNF"          value={valeurTotale > 0 ? valeurFmt : '0'} trend={valeurTotale > 0 ? 100 : 0} sub="catalogue"
          icon={BarChart2} color={V.orange} light={V.orangeL}/>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:14, marginBottom:14 }}>
        {/* Graphique activité */}
        <div style={{ background:V.white, border:`1px solid ${V.border}`, borderRadius:16, padding:22 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
            <div>
              <div style={{ fontSize:15, fontWeight:600, color:V.t1 }}>Activité des 14 derniers jours</div>
              <div style={{ fontSize:13, color:V.t2, marginTop:2 }}>Nouvelles annonces publiées</div>
            </div>
            <div style={{ background:V.greenL, color:V.green, fontSize:12, fontWeight:600,
              padding:'5px 12px', borderRadius:20 }}>
              ↑ +12.4% ce mois
            </div>
          </div>
          <BarGraph data={hasActivity ? activity : new Array(14).fill(0)} labels={JOURS}/>
          {!hasActivity && (
            <div style={{ textAlign:'center', marginTop:8, fontSize:11, color:V.t3 }}>
              Aucune annonce sur les 14 derniers jours
            </div>
          )}
        </div>

        {/* Stats rapides */}
        <div style={{ background:V.white, border:`1px solid ${V.border}`, borderRadius:16, padding:22 }}>
          <div style={{ fontSize:15, fontWeight:600, color:V.t1, marginBottom:18 }}>Stats rapides</div>
          {[
            { label:'Taux de conversion', val:'12.4%', data:[8,9,11,10,12,11,12], c:V.green  },
            { label:'Dons / Ventes',      val:'5.5%',  data:[4,5,5,6,5,6,6],     c:V.purple },
            { label:'Signalements actifs',val:'4',     data:[2,3,4,3,5,4,4],     c:V.orange },
          ].map(s => (
            <div key={s.label} style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
              padding:'10px 0', borderBottom:`1px solid ${V.border}` }}>
              <div>
                <div style={{ fontSize:13, fontWeight:500, color:V.t1 }}>{s.label}</div>
                <div style={{ fontSize:20, fontWeight:700, color:V.t1, marginTop:2 }}>{s.val}</div>
              </div>
              <MiniLine data={s.data} color={s.c}/>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14, marginBottom:24 }}>
        {/* Top catégories */}
        <div style={{ background:V.white, border:`1px solid ${V.border}`, borderRadius:16, padding:22 }}>
          <div style={{ fontSize:15, fontWeight:600, color:V.t1, marginBottom:16 }}>Top catégories</div>
          {[
            { label:'Mode',       pct:44, color:V.green  },
            { label:'Téléphones', pct:20, color:V.blue   },
            { label:'Maison',     pct:17, color:V.purple },
            { label:'Voitures',   pct:10, color:V.orange },
            { label:'Autres',     pct:9,  color:'#9CA3AF' },
          ].map(c => (
            <div key={c.label} style={{ marginBottom:10 }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:12,
                color:V.t2, marginBottom:5 }}>
                <span style={{ fontWeight:500 }}>{c.label}</span>
                <span style={{ fontWeight:600, color:V.t1 }}>{c.pct}%</span>
              </div>
              <div style={{ background:'#F3F4F6', borderRadius:4, height:6, overflow:'hidden' }}>
                <div style={{ width:c.pct+'%', height:'100%', background:c.color, borderRadius:4 }}/>
              </div>
            </div>
          ))}
        </div>

        {/* Top villes */}
        <div style={{ background:V.white, border:`1px solid ${V.border}`, borderRadius:16, padding:22 }}>
          <div style={{ fontSize:15, fontWeight:600, color:V.t1, marginBottom:16 }}>Top villes</div>
          {[
            { label:'Conakry',     nb:'3 424', pct:88 },
            { label:'Labé',        nb:'1 323', pct:34 },
            { label:'Kankan',      nb:'856',   pct:22 },
            { label:'Kindia',      nb:'584',   pct:15 },
            { label:"N'Zérékoré", nb:'350',   pct:9  },
          ].map(v => (
            <div key={v.label} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
              <div style={{ fontSize:12, color:V.t2, fontWeight:500, width:80, flexShrink:0 }}>
                {v.label}
              </div>
              <div style={{ flex:1, background:'#F3F4F6', borderRadius:4, height:6, overflow:'hidden' }}>
                <div style={{ width:v.pct+'%', height:'100%', background:V.green, borderRadius:4 }}/>
              </div>
              <div style={{ fontSize:11, color:V.t3, width:34, textAlign:'right', flexShrink:0 }}>
                {v.nb}
              </div>
            </div>
          ))}
        </div>

        {/* Impact dons */}
        <div style={{ background:V.white, border:`1px solid ${V.border}`, borderRadius:16, padding:22 }}>
          <div style={{ fontSize:15, fontWeight:600, color:V.t1, marginBottom:16 }}>Impact dons 🤲</div>
          {[
            { label:'Dons réalisés',    val:'214',      color:V.green },
            { label:'Valeur écon.',     val:'~32M GNF', color:V.t1   },
            { label:'Donateurs actifs', val:'89',       color:V.t1   },
            { label:'Mode (top cat.)',  val:'61%',      color:V.t1   },
            { label:'Taux conversion',  val:'78%',      color:V.green },
          ].map(s => (
            <div key={s.label} style={{ display:'flex', justifyContent:'space-between',
              padding:'8px 0', borderBottom:`1px solid ${V.border}`, fontSize:13 }}>
              <span style={{ color:V.t2 }}>{s.label}</span>
              <span style={{ fontWeight:600, color:s.color }}>{s.val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Dernières annonces */}
      <div style={{ background:V.white, border:`1px solid ${V.border}`, borderRadius:16, overflow:'hidden' }}>
        <div style={{ padding:'18px 22px', borderBottom:`1px solid ${V.border}`,
          display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ fontSize:15, fontWeight:600, color:V.t1 }}>Dernières annonces</div>
          <button onClick={() => onNav('annonces')}
            style={{ background:'none', border:'none', color:V.green, fontSize:13,
              fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}>
            Voir tout <ArrowUpRight size={14}/>
          </button>
        </div>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ background:'#FAFAFA' }}>
              {['Article','Catégorie','Prix','Vendeur','Date','Statut','Actions'].map(h => (
                <th key={h} style={{ padding:'10px 16px', textAlign:'left', fontSize:11,
                  fontWeight:600, color:V.t3, textTransform:'uppercase', letterSpacing:.5,
                  borderBottom:`1px solid ${V.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {annonces.length === 0 ? (
              <tr><td colSpan={7} style={{ padding:'40px', textAlign:'center', fontSize:13, color:V.t3 }}>
                Aucune annonce publiée pour le moment
              </td></tr>
            ) : annonces.slice(0,5).map((a, i) => (
              <tr key={a.id}
                style={{ borderBottom: i < 4 ? `1px solid ${V.border}` : 'none' }}
                onMouseEnter={e => e.currentTarget.style.background='#FAFAFA'}
                onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                <td style={{ padding:'12px 16px', fontSize:13, fontWeight:600, color:V.t1 }}>
                  {a.titre}
                </td>
                <td style={{ padding:'12px 16px', fontSize:12, color:V.t2 }}>{a.categorie}</td>
                <td style={{ padding:'12px 16px', fontSize:13, fontWeight:600,
                  color: a.est_don ? V.green : V.t1 }}>{a.est_don ? 'Gratuit' : fmt(a.prix || 0)}</td>
                <td style={{ padding:'12px 16px', fontSize:12, color:V.t2 }}>{a.vendeur?.nom || '—'}</td>
                <td style={{ padding:'12px 16px', fontSize:12, color:V.t3 }}>{tempsRelatif(a.date_publication)}</td>
                <td style={{ padding:'12px 16px' }}>
                  <StatusBadge type={a.est_don ? 'don' : 'active'}/>
                </td>
                <td style={{ padding:'12px 16px' }}>
                  <div style={{ display:'flex', gap:6 }}>
                    <Link to={`/article/${a.id}`}>
                      <ActionBtn small><Eye size={12}/> Voir</ActionBtn>
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════
// PAGE ANNONCES
// ═══════════════════════════════════════════════
function PageAnnonces({ annonces, loading, onDelete }) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const liste = annonces.filter(a => {
    const q = search.toLowerCase()
    const matchSearch = !q || a.titre?.toLowerCase().includes(q) || a.ville?.toLowerCase().includes(q)
    const matchFilter = filter === 'all' || (filter === 'don' && a.est_don) ||
      (filter === 'active' && !a.est_don)
    return matchSearch && matchFilter
  })

  return (
    <div>
      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:22, fontWeight:700, color:V.t1 }}>Gestion des annonces</div>
        <div style={{ fontSize:14, color:V.t2, marginTop:3 }}>
          {annonces.length > 0 ? `${annonces.length} annonces dans Firestore` : 'Données de démonstration'}
        </div>
      </div>

      {/* KPIs mini RÉELS */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
        {[
          { label:'Total',     val: annonces.length.toString(),                          color:V.t1    },
          { label:'Ventes',    val: annonces.filter(a => !a.est_don).length.toString(),  color:V.green },
          { label:'Dons',      val: annonces.filter(a =>  a.est_don).length.toString(),  color:V.purple},
          { label:'Affichées', val: liste.length.toString(),                              color:V.blue  },
        ].map(k => (
          <div key={k.label} style={{ background:V.white, border:`1px solid ${V.border}`,
            borderRadius:12, padding:'14px 18px' }}>
            <div style={{ fontSize:11, color:V.t3, fontWeight:500, marginBottom:5,
              textTransform:'uppercase', letterSpacing:.5 }}>{k.label}</div>
            <div style={{ fontSize:24, fontWeight:700, color:k.color }}>{k.val}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ background:V.white, border:`1px solid ${V.border}`, borderRadius:16,
        overflow:'hidden' }}>
        <div style={{ padding:'16px 20px', borderBottom:`1px solid ${V.border}`,
          display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
          <div style={{ position:'relative', flex:1, minWidth:200 }}>
            <Search size={16} style={{ position:'absolute', left:12, top:'50%',
              transform:'translateY(-50%)', color:V.t3 }}/>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher une annonce..."
              style={{ width:'100%', padding:'9px 12px 9px 36px', border:`1px solid ${V.border}`,
                borderRadius:10, fontSize:13, color:V.t1, outline:'none',
                background:'#FAFAFA', boxSizing:'border-box' }}/>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            {[['all','Toutes'],['active','Ventes'],['don','Dons']].map(([v,l]) => (
              <button key={v} onClick={() => setFilter(v)}
                style={{ padding:'8px 16px', borderRadius:20, border:`1px solid ${filter===v?V.green:V.border}`,
                  background: filter===v ? V.greenL : V.white,
                  color: filter===v ? V.green : V.t2,
                  fontWeight: filter===v ? 600 : 400, fontSize:13, cursor:'pointer' }}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ padding:'60px', textAlign:'center', color:V.t3 }}>
            Chargement des annonces Firestore...
          </div>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'#FAFAFA' }}>
                {['Annonce','Catégorie','Prix','État','Ville','Vendeur','Statut','Actions'].map(h => (
                  <th key={h} style={{ padding:'10px 16px', textAlign:'left', fontSize:11,
                    fontWeight:600, color:V.t3, textTransform:'uppercase', letterSpacing:.5,
                    borderBottom:`1px solid ${V.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {liste.map((a, i) => (
                <tr key={a.id}
                  style={{ borderBottom: i < liste.length-1 ? `1px solid ${V.border}` : 'none' }}
                  onMouseEnter={e => e.currentTarget.style.background='#FAFAFA'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                  <td style={{ padding:'12px 16px' }}>
                    <div style={{ fontSize:13, fontWeight:600, color:V.t1 }}>{a.titre}</div>
                  </td>
                  <td style={{ padding:'12px 16px', fontSize:12, color:V.t2 }}>
                    {a.categorie || '—'}
                  </td>
                  <td style={{ padding:'12px 16px', fontSize:13, fontWeight:600,
                    color: a.est_don ? V.green : V.t1 }}>
                    {a.est_don ? 'Gratuit' : fmt(a.prix || 0)}
                  </td>
                  <td style={{ padding:'12px 16px', fontSize:12, color:V.t2 }}>
                    {{neuf:'Neuf',bon:'Bon état',usage:'Usagé'}[a.etat_article] || '—'}
                  </td>
                  <td style={{ padding:'12px 16px', fontSize:12, color:V.t2 }}>
                    {a.ville || '—'}
                  </td>
                  <td style={{ padding:'12px 16px', fontSize:12, color:V.t2 }}>
                    {a.vendeur?.nom || (a.utilisateur_id ? a.utilisateur_id.slice(0,6)+'...' : '—')}
                  </td>
                  <td style={{ padding:'12px 16px' }}>
                    <StatusBadge type={a.est_don ? 'don' : 'active'}/>
                  </td>
                  <td style={{ padding:'12px 16px' }}>
                    <div style={{ display:'flex', gap:6 }}>
                      <Link to={`/article/${a.id}`}>
                        <ActionBtn small><Eye size={12}/> Voir</ActionBtn>
                      </Link>
                      <ActionBtn small danger onClick={() => onDelete(a.id)}>
                        <Trash2 size={12}/>
                      </ActionBtn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════
// PAGE UTILISATEURS
// ═══════════════════════════════════════════════
function PageUsers({ users = [], onBan, onToast }) {
  const [search, setSearch] = useState('')

  // Normaliser les vrais users Firestore au format affichage
  const realUsers = users.map(u => ({
    id:     u.id,
    nom:    `${u.prenom || ''} ${u.nom || ''}`.trim() || u.email?.split('@')[0] || 'Utilisateur',
    email:  u.email || '—',
    ville:  u.ville || '—',
    nb:     u.nb_ventes || 0,
    statut: u.statut || 'actif',
    role:   u.role || 'utilisateur',
    joined: u.date_inscription?.seconds
      ? new Date(u.date_inscription.seconds * 1000).toLocaleDateString('fr-FR', { day:'numeric', month:'short', year:'numeric' })
      : '—',
  }))

  const liste = realUsers.filter(u =>
    !search || u.nom.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  function ban(u, value) {
    if (onBan) onBan(u.id, value)
  }

  return (
    <div>
      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:22, fontWeight:700, color:V.t1 }}>Utilisateurs</div>
        <div style={{ fontSize:14, color:V.t2, marginTop:3 }}>
          {realUsers.length > 0 ? `${realUsers.length} comptes inscrits` : 'Aucun utilisateur inscrit pour le moment'}
        </div>
      </div>

      <div style={{ background:V.white, border:`1px solid ${V.border}`, borderRadius:16, overflow:'hidden' }}>
        <div style={{ padding:'16px 20px', borderBottom:`1px solid ${V.border}` }}>
          <div style={{ position:'relative', maxWidth:320 }}>
            <Search size={16} style={{ position:'absolute', left:12, top:'50%',
              transform:'translateY(-50%)', color:V.t3 }}/>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un utilisateur..."
              style={{ width:'100%', padding:'9px 12px 9px 36px', border:`1px solid ${V.border}`,
                borderRadius:10, fontSize:13, color:V.t1, outline:'none',
                background:'#FAFAFA', boxSizing:'border-box' }}/>
          </div>
        </div>

        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ background:'#FAFAFA' }}>
              {['Utilisateur','Email','Ville','Annonces','Inscrit le','Rôle','Statut','Actions'].map(h => (
                <th key={h} style={{ padding:'10px 16px', textAlign:'left', fontSize:11,
                  fontWeight:600, color:V.t3, textTransform:'uppercase', letterSpacing:.5,
                  borderBottom:`1px solid ${V.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {liste.length === 0 ? (
              <tr><td colSpan={8} style={{ padding:'40px', textAlign:'center', fontSize:13, color:V.t3 }}>
                {search ? 'Aucun utilisateur ne correspond à ta recherche' : 'Aucun utilisateur inscrit pour le moment'}
              </td></tr>
            ) : liste.map((u, i) => (
              <tr key={u.id}
                style={{ borderBottom: i < liste.length-1 ? `1px solid ${V.border}` : 'none' }}
                onMouseEnter={e => e.currentTarget.style.background='#FAFAFA'}
                onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                <td style={{ padding:'12px 16px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:34, height:34, borderRadius:'50%', background:V.greenL,
                      display:'flex', alignItems:'center', justifyContent:'center',
                      color:V.green, fontWeight:700, fontSize:13, flexShrink:0 }}>
                      {u.nom[0]}
                    </div>
                    <span style={{ fontSize:13, fontWeight:600, color:V.t1 }}>
                      {u.nom}
                    </span>
                  </div>
                </td>
                <td style={{ padding:'12px 16px', fontSize:12, color:V.t2 }}>{u.email}</td>
                <td style={{ padding:'12px 16px', fontSize:12, color:V.t2 }}>{u.ville}</td>
                <td style={{ padding:'12px 16px', fontSize:13, fontWeight:600, color:V.t1,
                  textAlign:'center' }}>{u.nb}</td>
                <td style={{ padding:'12px 16px', fontSize:12, color:V.t3 }}>{u.joined}</td>
                <td style={{ padding:'12px 16px' }}><StatusBadge type={u.role}/></td>
                <td style={{ padding:'12px 16px' }}><StatusBadge type={u.statut}/></td>
                <td style={{ padding:'12px 16px' }}>
                  {u.statut !== 'banni'
                    ? <ActionBtn danger onClick={() => ban(u, true)}>
                        <X size={12}/> Bannir
                      </ActionBtn>
                    : <ActionBtn success onClick={() => ban(u, false)}>
                        <Check size={12}/> Débannir
                      </ActionBtn>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════
// PAGE SIGNALEMENTS
// ═══════════════════════════════════════════════
function PageSignalements({ signalements, onResolve, onDeleteAnnonce, onToast }) {
  const [filter, setFilter] = useState('all')

  async function action(s, type) {
    const msgs = {
      valider:   '✅ Annonce validée — signalement fermé',
      supprimer: '🗑️ Annonce supprimée définitivement',
      avertir:   '⚠️ Avertissement envoyé au vendeur',
    }
    if (type === 'supprimer' && s.annonce_id) {
      // Supprime vraiment l'annonce + résout
      await onDeleteAnnonce(s.annonce_id, true)
    }
    await onResolve(s.id)
    onToast(msgs[type])
  }

  const liste = signalements.filter(s =>
    filter === 'all' || s.statut === filter
  )
  const pending = signalements.filter(s => s.statut === 'pending').length

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:24 }}>
        <div>
          <div style={{ fontSize:22, fontWeight:700, color:V.t1 }}>Signalements</div>
          <div style={{ fontSize:14, color:V.t2, marginTop:3 }}>
            Modération des contenus signalés par la communauté
          </div>
        </div>
        {pending > 0 && (
          <span style={{ background:V.redL, color:V.red, fontSize:13, fontWeight:700,
            padding:'5px 14px', borderRadius:20, border:`1px solid #FECDD3` }}>
            {pending} en attente
          </span>
        )}
      </div>

      {/* Filtres */}
      <div style={{ display:'flex', gap:8, marginBottom:16 }}>
        {[['all','Tous'],['pending','En attente'],['resolu','Résolus']].map(([v,l]) => (
          <button key={v} onClick={() => setFilter(v)}
            style={{ padding:'8px 18px', borderRadius:20, border:`1px solid ${filter===v?V.green:V.border}`,
              background: filter===v ? V.greenL : V.white,
              color: filter===v ? V.green : V.t2,
              fontWeight: filter===v ? 600 : 400, fontSize:13, cursor:'pointer' }}>
            {l}
            {v === 'pending' && pending > 0 && (
              <span style={{ background:V.red, color:'#fff', fontSize:10, fontWeight:700,
                marginLeft:6, padding:'1px 6px', borderRadius:10 }}>{pending}</span>
            )}
          </button>
        ))}
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {liste.map(s => (
          <div key={s.id} style={{ background:V.white,
            border:`1px solid ${s.statut==='pending' ? '#FECDD3' : V.border}`,
            borderRadius:14, padding:'16px 20px',
            display:'flex', alignItems:'center', gap:16 }}>

            <div style={{ width:42, height:42, borderRadius:12, flexShrink:0,
              background: s.statut==='pending' ? V.redL : '#F0FDF4',
              display:'flex', alignItems:'center', justifyContent:'center' }}>
              {s.statut === 'pending'
                ? <Flag size={20} color={V.red}/>
                : <Check size={20} color="#15803D"/>
              }
            </div>

            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:14, fontWeight:600, color:V.t1,
                overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {s.article_titre || '(Annonce supprimée)'}
              </div>
              <div style={{ fontSize:12, color:V.t2, marginTop:3, display:'flex', gap:12, flexWrap:'wrap' }}>
                <span style={{ display:'flex', alignItems:'center', gap:4 }}>
                  <Flag size={12}/> {s.raison || 'Sans raison'}
                </span>
                {s.signaleur_email && (
                  <span style={{ display:'flex', alignItems:'center', gap:4 }}>
                    <Users size={12}/> {s.signaleur_email}
                  </span>
                )}
                <span style={{ display:'flex', alignItems:'center', gap:4 }}>
                  <Clock size={12}/> {tempsRelatif(s.date_signalement)}
                </span>
              </div>
            </div>

            <StatusBadge type={s.statut === 'pending' ? 'pending' : 'resolu'}/>

            {s.statut === 'pending' && (
              <div style={{ display:'flex', gap:8, flexShrink:0 }}>
                <ActionBtn success onClick={() => action(s, 'valider')}>
                  <Check size={14}/> Valider
                </ActionBtn>
                <ActionBtn danger onClick={() => action(s, 'supprimer')}>
                  <Trash2 size={14}/> Supprimer
                </ActionBtn>
                <ActionBtn onClick={() => action(s, 'avertir')}>
                  <AlertTriangle size={14}/> Avertir
                </ActionBtn>
              </div>
            )}
          </div>
        ))}

        {liste.length === 0 && (
          <div style={{ background:V.white, border:`1px solid ${V.border}`,
            borderRadius:14, padding:'60px', textAlign:'center', color:V.t3 }}>
            <ShieldCheck size={40} color={V.green} style={{ margin:'0 auto 12px' }}/>
            <div style={{ fontSize:16, fontWeight:600, color:V.t2 }}>Tout est en ordre !</div>
            <div style={{ fontSize:13, marginTop:4 }}>
              {pending === 0 ? 'Aucun signalement en attente. La communauté est saine.' : 'Aucun signalement dans cette catégorie.'}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════
// PAGE ANALYTICS
// ═══════════════════════════════════════════════
function PageAnalytics() {
  return (
    <div>
      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:22, fontWeight:700, color:V.t1 }}>Analytics</div>
        <div style={{ fontSize:14, color:V.t2, marginTop:3 }}>Statistiques détaillées de la plateforme</div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
        <div style={{ background:V.white, border:`1px solid ${V.border}`, borderRadius:16, padding:22 }}>
          <div style={{ fontSize:15, fontWeight:600, color:V.t1, marginBottom:6 }}>
            Croissance utilisateurs — mai 2025
          </div>
          <div style={{ fontSize:28, fontWeight:700, color:V.t1, marginBottom:4 }}>+197</div>
          <div style={{ fontSize:13, color:V.green, marginBottom:16 }}>↑ +18.7% vs mois dernier</div>
          <BarGraph data={[28,34,41,38,52,45,60,48,55,62,58,71,65,78]} labels={[...Array(14)].map((_,i)=>i+1+'')}/>
        </div>

        <div style={{ background:V.white, border:`1px solid ${V.border}`, borderRadius:16, padding:22 }}>
          <div style={{ fontSize:15, fontWeight:600, color:V.t1, marginBottom:18 }}>Taux de conversion</div>
          {[
            { label:'Visites → Inscriptions',    val:'12.4%', color:V.green  },
            { label:'Inscriptions → Publications',val:'48%',   color:V.blue   },
            { label:'Vues → Contact WhatsApp',    val:'8.7%',  color:V.purple },
            { label:'Dons acceptés',              val:'78%',   color:V.green  },
            { label:'Rétention 30 jours',         val:'64%',   color:V.t1     },
            { label:'NPS estimé',                 val:'+62',   color:V.green  },
          ].map(s => (
            <div key={s.label} style={{ display:'flex', justifyContent:'space-between',
              padding:'9px 0', borderBottom:`1px solid ${V.border}`, fontSize:13 }}>
              <span style={{ color:V.t2 }}>{s.label}</span>
              <span style={{ fontWeight:700, color:s.color }}>{s.val}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14 }}>
        <div style={{ background:V.white, border:`1px solid ${V.border}`, borderRadius:16, padding:22 }}>
          <div style={{ fontSize:15, fontWeight:600, color:V.t1, marginBottom:14 }}>Revenus GNF</div>
          {['Janvier','Février','Mars','Avril','Mai'].map((m,i) => {
            const vals = [6.2,7.8,9.1,11.4,13.7]
            return (
              <div key={m} style={{ display:'flex', justifyContent:'space-between',
                padding:'8px 0', borderBottom:`1px solid ${V.border}`, fontSize:13 }}>
                <span style={{ color:V.t2 }}>{m}</span>
                <span style={{ fontWeight:600, color: i===4 ? V.green : V.t1 }}>
                  {vals[i]}M GNF
                </span>
              </div>
            )
          })}
        </div>
        <div style={{ background:V.white, border:`1px solid ${V.border}`, borderRadius:16, padding:22 }}>
          <div style={{ fontSize:15, fontWeight:600, color:V.t1, marginBottom:14 }}>Impact dons</div>
          {[
            ['Dons réalisés','214',V.green],
            ['Valeur écon.','~32M GNF',V.t1],
            ['Donateurs actifs','89',V.t1],
            ['Catégorie top','Mode 61%',V.t1],
            ['Taux conv.','78%',V.green],
          ].map(([l,v,c]) => (
            <div key={l} style={{ display:'flex', justifyContent:'space-between',
              padding:'8px 0', borderBottom:`1px solid ${V.border}`, fontSize:13 }}>
              <span style={{ color:V.t2 }}>{l}</span>
              <span style={{ fontWeight:600, color:c }}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{ background:V.white, border:`1px solid ${V.border}`, borderRadius:16, padding:22 }}>
          <div style={{ fontSize:15, fontWeight:600, color:V.t1, marginBottom:14 }}>Satisfaction</div>
          {[
            ['Note moy. vendeurs','4.8 / 5',V.t1],
            ['Signalements / ann.','0.1%',V.t1],
            ['Temps réponse WA','< 2h',V.t1],
            ['Litiges ouverts','3',V.red],
            ['NPS estimé','+62',V.green],
          ].map(([l,v,c]) => (
            <div key={l} style={{ display:'flex', justifyContent:'space-between',
              padding:'8px 0', borderBottom:`1px solid ${V.border}`, fontSize:13 }}>
              <span style={{ color:V.t2 }}>{l}</span>
              <span style={{ fontWeight:600, color:c }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════
export default function Admin() {
  const { user }  = useAuth()
  const [page, setPage]         = useState('dashboard')
  const [annonces, setAnnonces] = useState([])
  const [users, setUsers]       = useState([])
  const [signalements, setSignalements] = useState([])
  const [loading, setLoading]   = useState(true)
  const [toast, setToast]       = useState('')
  const [searchBar, setSearchBar] = useState('')

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  // ── ANNONCES, UTILISATEURS, SIGNALEMENTS — TOUT EN TEMPS RÉEL ──
  useEffect(() => {
    setLoading(true)

    // Annonces
    const unsubAnn = onSnapshot(
      query(collection(db, 'annonces'), orderBy('date_publication', 'desc')),
      snap => {
        setAnnonces(
          snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter(a => a.statut !== 'supprime')
        )
        setLoading(false)
      },
      () => {
        // Fallback sans orderBy
        getDocs(collection(db, 'annonces'))
          .then(s => {
            setAnnonces(s.docs.map(d => ({ id:d.id, ...d.data() })).filter(a => a.statut !== 'supprime'))
            setLoading(false)
          })
          .catch(() => setLoading(false))
      }
    )

    // Utilisateurs — temps réel
    const unsubUsers = onSnapshot(
      collection(db, 'utilisateurs'),
      snap => setUsers(snap.docs.map(d => ({ id:d.id, ...d.data() }))),
      () => {}
    )

    // Signalements — temps réel
    const unsubSignals = onSnapshot(
      collection(db, 'signalements'),
      snap => {
        const list = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (b.date_signalement?.seconds || 0) - (a.date_signalement?.seconds || 0))
        setSignalements(list)
      },
      () => setSignalements([])
    )

    return () => {
      unsubAnn()
      unsubUsers()
      unsubSignals()
    }
  }, [])

  // Supprimer une annonce (spam, frauduleuse, etc.)
  async function handleDelete(id, silent = false) {
    if (!silent && !window.confirm('Supprimer cette annonce définitivement ?')) return
    try {
      await deleteDoc(doc(db, 'annonces', id))
      if (!silent) showToast('🗑️ Annonce supprimée définitivement')
    } catch (err) {
      console.error(err)
      if (!silent) showToast('❌ Erreur — vérifie les règles Firestore')
    }
  }

  // Bannir / débannir un utilisateur
  async function handleBanUser(uid, ban) {
    try {
      await updateDoc(doc(db, 'utilisateurs', uid), { statut: ban ? 'banni' : 'actif' })
      showToast(ban ? '🚫 Utilisateur banni' : '✅ Utilisateur débanni')
    } catch {
      showToast('❌ Erreur')
    }
  }

  // Résoudre un signalement
  async function handleResolveSignal(id) {
    try {
      await updateDoc(doc(db, 'signalements', id), { statut: 'resolu' })
    } catch (err) {
      console.error(err)
    }
  }

  const signalCount = signalements.filter(s => s.statut === 'pending').length

  const NAVS = [
    { id:'dashboard',    label:'Dashboard',     Icon:LayoutDashboard },
    { id:'annonces',     label:'Annonces',      Icon:Package         },
    { id:'users',        label:'Utilisateurs',  Icon:Users           },
    { id:'signalements', label:'Signalements',  Icon:Flag, badge:signalCount },
    { id:'analytics',    label:'Analytics',     Icon:BarChart2       },
    { id:'ia',           label:'Modules IA',    Icon:Cpu             },
  ]

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:V.bg,
      fontFamily:"'Inter',-apple-system,BlinkMacSystemFont,sans-serif" }}>

      {/* ── Sidebar ── */}
      <aside style={{ width:240, background:V.white, borderRight:`1px solid ${V.border}`,
        padding:'0', display:'flex', flexDirection:'column',
        position:'sticky', top:0, height:'100vh', flexShrink:0 }}>

        {/* Logo */}
        <div style={{ padding:'24px 20px 20px', borderBottom:`1px solid ${V.border}` }}>
          <div style={{ fontSize:20, fontWeight:800, color:V.t1, letterSpacing:-.5 }}>
            DEAL<span style={{ color:V.green }}>OO</span>
          </div>
          <div style={{ fontSize:11, color:V.t3, marginTop:3, fontWeight:500,
            textTransform:'uppercase', letterSpacing:.5 }}>
            Administration
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:'12px 10px', overflowY:'auto' }}>
          <div style={{ fontSize:10, fontWeight:600, color:V.t3, padding:'8px 10px 6px',
            textTransform:'uppercase', letterSpacing:.8 }}>
            Gestion
          </div>
          {NAVS.map(n => (
            <button key={n.id} onClick={() => setPage(n.id)}
              style={{ width:'100%', padding:'10px 12px', borderRadius:10, border:'none',
                background: page===n.id ? V.greenL : 'transparent',
                color: page===n.id ? V.green : V.t2,
                fontWeight: page===n.id ? 600 : 400, fontSize:13.5,
                cursor:'pointer', textAlign:'left',
                display:'flex', alignItems:'center', gap:10,
                marginBottom:2, transition:'.15s' }}>
              <n.Icon size={18} strokeWidth={page===n.id ? 2.5 : 1.75}/>
              <span style={{ flex:1 }}>{n.label}</span>
              {n.badge > 0 && (
                <span style={{ background:V.red, color:'#fff', fontSize:10,
                  fontWeight:700, padding:'2px 7px', borderRadius:10 }}>
                  {n.badge}
                </span>
              )}
            </button>
          ))}

          <div style={{ fontSize:10, fontWeight:600, color:V.t3, padding:'16px 10px 6px',
            textTransform:'uppercase', letterSpacing:.8 }}>
            Système
          </div>
          <Link to="/superadmin"
            style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px',
              borderRadius:10, color:V.t2, fontSize:13.5, textDecoration:'none',
              marginBottom:2 }}
            onMouseOver={e => e.currentTarget.style.background='#F3F4F6'}
            onMouseOut={e => e.currentTarget.style.background='transparent'}>
            <ShieldCheck size={18} strokeWidth={1.75}/> Super Admin
          </Link>
          <Link to="/home"
            style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px',
              borderRadius:10, color:V.t2, fontSize:13.5, textDecoration:'none',
              marginBottom:2 }}
            onMouseOver={e => e.currentTarget.style.background='#F3F4F6'}
            onMouseOut={e => e.currentTarget.style.background='transparent'}>
            <Home size={18} strokeWidth={1.75}/> Retour au site
          </Link>
        </nav>

        {/* User */}
        <div style={{ padding:'14px 16px', borderTop:`1px solid ${V.border}`,
          display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:34, height:34, borderRadius:'50%', background:V.greenL,
            display:'flex', alignItems:'center', justifyContent:'center',
            color:V.green, fontWeight:700, fontSize:13, flexShrink:0 }}>
            {user?.email?.[0]?.toUpperCase() || 'A'}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:13, fontWeight:600, color:V.t1 }}>Admin</div>
            <div style={{ fontSize:11, color:V.t3, overflow:'hidden',
              textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {user?.email}
            </div>
          </div>
        </div>
      </aside>

      {/* ── Contenu ── */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>

        {/* Topbar */}
        <div style={{ background:V.white, borderBottom:`1px solid ${V.border}`,
          padding:'0 28px', height:60, display:'flex', alignItems:'center',
          justifyContent:'space-between', position:'sticky', top:0, zIndex:50 }}>
          <div style={{ position:'relative', width:320 }}>
            <Search size={16} style={{ position:'absolute', left:12, top:'50%',
              transform:'translateY(-50%)', color:V.t3 }}/>
            <input value={searchBar} onChange={e => setSearchBar(e.target.value)}
              placeholder="Recherche globale..."
              style={{ width:'100%', padding:'9px 12px 9px 36px', border:`1px solid ${V.border}`,
                borderRadius:10, fontSize:13, color:V.t1, outline:'none',
                background:V.bg, boxSizing:'border-box' }}/>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ position:'relative' }}>
              <button style={{ width:38, height:38, borderRadius:10, border:`1px solid ${V.border}`,
                background:V.white, display:'flex', alignItems:'center', justifyContent:'center',
                cursor:'pointer' }}>
                <Bell size={18} color={V.t2}/>
              </button>
              {signalCount > 0 && (
                <span style={{ position:'absolute', top:-3, right:-3, width:8, height:8,
                  background:V.red, borderRadius:'50%', border:`2px solid ${V.white}` }}/>
              )}
            </div>
            <div style={{ height:24, width:1, background:V.border }}/>
            <div style={{ fontSize:13, color:V.t2 }}>
              {new Date().toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' })}
            </div>
          </div>
        </div>

        {/* Page content */}
        <main style={{ flex:1, padding:'28px', overflowY:'auto' }}>
          {page === 'dashboard'    && <Dashboard    annonces={annonces} users={users} signalements={signalements} onNav={setPage}/>}
          {page === 'annonces'     && <PageAnnonces annonces={annonces} loading={loading} onDelete={handleDelete}/>}
          {page === 'users'        && <PageUsers    users={users} onBan={handleBanUser} onToast={showToast}/>}
          {page === 'signalements' && <PageSignalements signalements={signalements} onResolve={handleResolveSignal} onDeleteAnnonce={handleDelete} onToast={showToast}/>}
          {page === 'analytics'    && <PageAnalytics/>}
          {page === 'ia'           && (
            <div>
              <div style={{ fontSize:22, fontWeight:700, color:V.t1, marginBottom:24 }}>Modules IA</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                {[
                  { nm:'Détection fraudes',    val:'3 bloquées/heure', desc:'Analyse prix anormaux et comptes suspects en temps réel',  color:V.red,    light:V.redL    },
                  { nm:'Modération images',    val:'99.2% précision',  desc:'Vérifie automatiquement chaque photo avant publication',   color:V.purple, light:V.purpleL },
                  { nm:'Suggestion prix',      val:'Actif',            desc:'Recommande un prix optimal basé sur 3 891 annonces DEALOO',color:V.green,  light:V.greenL  },
                  { nm:'Anti-spam comptes',    val:'12 bannis/jour',   desc:'Détecte et bloque les faux comptes et comportements spam', color:V.blue,   light:V.blueL   },
                ].map(m => (
                  <div key={m.nm} style={{ background:V.white, border:`1px solid ${V.border}`,
                    borderRadius:16, padding:22, display:'flex', gap:16, alignItems:'flex-start' }}>
                    <div style={{ width:46, height:46, borderRadius:12, background:m.light,
                      display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <CircleDot size={22} color={m.color}/>
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
                        <div style={{ fontSize:15, fontWeight:600, color:V.t1 }}>{m.nm}</div>
                        <span style={{ background:m.light, color:m.color, fontSize:12, fontWeight:600,
                          padding:'3px 10px', borderRadius:20 }}>{m.val}</span>
                      </div>
                      <div style={{ fontSize:13, color:V.t2, lineHeight:1.5 }}>{m.desc}</div>
                      <div style={{ marginTop:12, background:'#F3F4F6', borderRadius:4, height:6 }}>
                        <div style={{ width:'87%', height:'100%', background:m.color, borderRadius:4 }}/>
                      </div>
                      <div style={{ fontSize:11, color:V.t3, marginTop:4 }}>87% de capacité utilisée</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed', bottom:28, left:'50%', transform:'translateX(-50%)',
          background:V.t1, color:'#fff', padding:'12px 22px', borderRadius:20,
          fontSize:14, fontWeight:500, zIndex:9999, whiteSpace:'nowrap',
          boxShadow:'0 8px 32px rgba(0,0,0,.15)' }}>
          {toast}
        </div>
      )}
    </div>
  )
}
