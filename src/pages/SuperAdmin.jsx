import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ADMINS = [
  { id:'a1', nom:'Super Admin',       email:'superadmin@dealoo.com', role:'superadmin',  statut:'actif',  derniere:'À l\'instant' },
  { id:'a2', nom:'Alpha Mamadou',     email:'alpha@dealoo.com',      role:'admin',        statut:'actif',  derniere:'Il y a 2h'   },
  { id:'a3', nom:'Fatoumata Kouyaté', email:'fk@dealoo.com',         role:'moderateur',   statut:'actif',  derniere:'Hier'        },
  { id:'a4', nom:'Ibrahima Barry',    email:'ib@dealoo.com',         role:'moderateur',   statut:'actif',  derniere:'Il y a 3j'   },
]

const LOGS = [
  { time:'14:23:01', type:'ok',   msg:'Paiement validé — Tx #TXN001 — 3.2M GNF'         },
  { time:'14:22:45', type:'warn', msg:'IA Fraude — Annonce #4892 bloquée automatiquement' },
  { time:'14:21:33', type:'info', msg:'Connexion Admin — Alpha M. depuis Conakry'         },
  { time:'14:20:17', type:'err',  msg:'DDOS bloqué — 2847 req/s — IP bannie'             },
  { time:'14:19:05', type:'ok',   msg:'Sauvegarde DB réussie — 2.4 GB'                   },
  { time:'14:18:50', type:'info', msg:'Nouvel utilisateur inscrit — Mamadou K.'           },
  { time:'14:17:22', type:'warn', msg:'Tentative connexion suspecte — IP: 196.x.x.x'     },
  { time:'14:15:00', type:'ok',   msg:'Annonce approuvée — "Robe bazin brodée"'           },
]

const SERVEURS = [
  { nom:'CPU',       val:42, color:'#10B981', statut:'Normal'  },
  { nom:'RAM',       val:68, color:'#F59E0B', statut:'Moyen'   },
  { nom:'Stockage',  val:35, color:'#10B981', statut:'OK'      },
  { nom:'Réseau',    val:22, color:'var(--green)', statut:'Normal'},
  { nom:'Firestore', val:15, color:'#3B82F6', statut:'Optimal' },
  { nom:'Storage',   val:8,  color:'#3B82F6', statut:'Faible'  },
]

const PERMISSIONS = [
  { perm:'Publier articles',   u:false, v:true,  m:true,  a:true,  sa:true  },
  { perm:'Acheter',            u:true,  v:true,  m:true,  a:true,  sa:true  },
  { perm:'Modérer annonces',   u:false, v:false, m:true,  a:true,  sa:true  },
  { perm:'Bannir utilisateurs',u:false, v:false, m:false, a:true,  sa:true  },
  { perm:'Gérer admins',       u:false, v:false, m:false, a:false, sa:true  },
  { perm:'Accès serveurs',     u:false, v:false, m:false, a:false, sa:true  },
  { perm:'Sauvegardes DB',     u:false, v:false, m:false, a:false, sa:true  },
  { perm:'Gérer API keys',     u:false, v:false, m:false, a:false, sa:true  },
]

function RoleBadge({ role }) {
  const map = {
    superadmin:  { bg:'rgba(255,107,26,.2)', color:'#FF6B1A', label:'Super Admin' },
    admin:       { bg:'rgba(59,130,246,.18)', color:'#93C5FD', label:'Admin'      },
    moderateur:  { bg:'rgba(139,92,246,.18)', color:'#C4B5FD', label:'Modérateur' },
    utilisateur: { bg:'rgba(255,255,255,.08)', color:'rgba(255,255,255,.4)', label:'User' },
  }
  const s = map[role] || map.utilisateur
  return (
    <span style={{ background:s.bg, color:s.color, fontSize:11, fontWeight:700,
      padding:'3px 10px', borderRadius:8 }}>
      {s.label}
    </span>
  )
}

function LogLine({ log }) {
  const colors = { ok:'#6EE7B7', warn:'#FCD34D', err:'#FCA5A5', info:'#93C5FD' }
  const bgs    = { ok:'rgba(16,185,129,.18)', warn:'rgba(245,158,11,.18)', err:'rgba(239,68,68,.18)', info:'rgba(59,130,246,.18)' }
  return (
    <div style={{ display:'flex', gap:12, padding:'8px 16px',
      borderBottom:'1px solid rgba(255,255,255,.04)' }}>
      <span style={{ fontSize:11, color:'rgba(255,255,255,.25)',
        fontFamily:'monospace', flexShrink:0, marginTop:2 }}>
        {log.time}
      </span>
      <span style={{ background:bgs[log.type], color:colors[log.type],
        fontSize:9, fontWeight:700, padding:'1px 6px', borderRadius:5,
        textTransform:'uppercase', flexShrink:0, alignSelf:'flex-start',
        marginTop:2 }}>
        {log.type}
      </span>
      <span style={{ fontSize:12, color:'rgba(255,255,255,.6)', lineHeight:1.5 }}>
        {log.msg}
      </span>
    </div>
  )
}

export default function SuperAdmin() {
  const { user }  = useAuth()
  const [onglet, setOnglet] = useState('dashboard')
  const [toast,  setToast]  = useState('')
  const [admins, setAdmins] = useState(ADMINS)

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  function changerRole(id, newRole) {
    setAdmins(prev => prev.map(a => a.id === id ? { ...a, role:newRole } : a))
    showToast(`✅ Rôle mis à jour`)
  }

  const ONGLETS = [
    { val:'dashboard',  label:'🏠 Dashboard SA'    },
    { val:'admins',     label:'👥 Équipe Admin'     },
    { val:'permissions',label:'🔒 Permissions RBAC' },
    { val:'serveurs',   label:'🖥️ Serveurs'         },
    { val:'logs',       label:'📋 Logs système'     },
    { val:'actions',    label:'⚙️ Actions critiques' },
  ]

  return (
    <div style={{ minHeight:'100vh', background:'#0A0500', color:'#fff' }}>

      {/* ── Header ── */}
      <header style={{ background:'#080300', borderBottom:'1px solid rgba(255,107,26,.15)',
        padding:'0 24px', height:64, display:'flex', alignItems:'center',
        justifyContent:'space-between', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <Link to="/admin" style={{ color:'rgba(255,255,255,.4)', textDecoration:'none',
            fontSize:13 }}>← Admin</Link>
          <div style={{ width:1, height:20, background:'rgba(255,255,255,.1)' }}/>
          <div style={{ fontWeight:800, fontSize:18 }}>
            DEAL<span style={{ color:'#FF6B1A' }}>OO</span>
            <span style={{ fontSize:11, fontWeight:700, color:'#FF6B1A',
              marginLeft:8, background:'rgba(255,107,26,.15)',
              border:'1px solid rgba(255,107,26,.3)', borderRadius:6,
              padding:'2px 8px' }}>SUPER ADMIN</span>
          </div>
          {/* Indicateur live */}
          <div style={{ display:'flex', alignItems:'center', gap:6,
            background:'rgba(16,185,129,.1)', border:'1px solid rgba(16,185,129,.2)',
            borderRadius:20, padding:'4px 12px' }}>
            <div style={{ width:6, height:6, borderRadius:'50%', background:'#10B981',
              animation:'pulse 2s infinite' }}/>
            <span style={{ fontSize:11, color:'#6EE7B7', fontWeight:600 }}>Système actif</span>
          </div>
        </div>
        <div style={{ fontSize:13, color:'rgba(255,255,255,.4)' }}>
          {user?.email}
        </div>
      </header>

      <div style={{ display:'flex' }}>

        {/* ── Sidebar ── */}
        <aside style={{ width:220, minHeight:'calc(100vh - 64px)', background:'#060300',
          borderRight:'1px solid rgba(255,107,26,.1)', padding:'20px 12px',
          position:'sticky', top:64, height:'calc(100vh - 64px)', flexShrink:0 }}>
          {ONGLETS.map(o => (
            <button key={o.val} onClick={() => setOnglet(o.val)}
              style={{ width:'100%', padding:'11px 14px', borderRadius:10, border:'none',
                background: onglet === o.val ? 'rgba(255,107,26,.12)' : 'transparent',
                color: onglet === o.val ? '#FF6B1A' : 'rgba(255,255,255,.4)',
                fontWeight: onglet === o.val ? 700 : 500,
                fontSize:14, cursor:'pointer', textAlign:'left',
                borderLeft: onglet === o.val ? '3px solid #FF6B1A' : '3px solid transparent',
                marginBottom:4, transition:'.15s' }}>
              {o.label}
            </button>
          ))}
        </aside>

        <main style={{ flex:1, padding:'28px 32px', minWidth:0 }}>

          {/* ─── DASHBOARD SA ─── */}
          {onglet === 'dashboard' && (
            <div>
              <div style={{ fontSize:22, fontWeight:800, marginBottom:6 }}>
                Super Admin Dashboard
              </div>
              <div style={{ fontSize:14, color:'rgba(255,255,255,.35)', marginBottom:24 }}>
                Contrôle total de la plateforme DEALOO
              </div>

              {/* KPIs SA */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',
                gap:14, marginBottom:28 }}>
                {[
                  { label:'Total users',    val:'1 247',  color:'var(--green)', ico:'👥' },
                  { label:'Admins actifs',  val:'4',      color:'#3B82F6',      ico:'🔐' },
                  { label:'Uptime',         val:'99.8%',  color:'#10B981',      ico:'🖥️' },
                  { label:'Alertes sécu.',  val:'3',      color:'#EF4444',      ico:'🚨' },
                  { label:'API calls/h',    val:'12.4K',  color:'#F59E0B',      ico:'⚡' },
                  { label:'DB size',        val:'2.4 GB', color:'#8B5CF6',      ico:'💾' },
                ].map(k => (
                  <div key={k.label} style={{ background:'rgba(255,255,255,.04)',
                    border:'1px solid rgba(255,255,255,.08)', borderRadius:14, padding:16 }}>
                    <div style={{ fontSize:20, marginBottom:8 }}>{k.ico}</div>
                    <div style={{ fontSize:22, fontWeight:800, color:k.color }}>
                      {k.val}
                    </div>
                    <div style={{ fontSize:11, color:'rgba(255,255,255,.35)',
                      textTransform:'uppercase', letterSpacing:'.5px', marginTop:4 }}>
                      {k.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Serveurs résumé */}
              <div style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)',
                borderRadius:16, padding:20, marginBottom:20 }}>
                <div style={{ fontWeight:700, fontSize:15, marginBottom:16 }}>
                  🖥️ État des serveurs
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
                  {SERVEURS.map(s => (
                    <div key={s.nom} style={{ background:'rgba(255,255,255,.04)',
                      borderRadius:10, padding:12 }}>
                      <div style={{ fontSize:11, color:'rgba(255,255,255,.4)',
                        textTransform:'uppercase', letterSpacing:'.5px', marginBottom:8 }}>
                        {s.nom}
                      </div>
                      <div style={{ background:'rgba(255,255,255,.08)', borderRadius:4,
                        height:6, overflow:'hidden', marginBottom:6 }}>
                        <div style={{ width:s.val+'%', height:'100%',
                          background:s.color, borderRadius:4, transition:'.5s' }}/>
                      </div>
                      <div style={{ display:'flex', justifyContent:'space-between', fontSize:11 }}>
                        <span style={{ color:s.color, fontWeight:700 }}>{s.val}%</span>
                        <span style={{ color:'rgba(255,255,255,.3)' }}>{s.statut}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Derniers logs */}
              <div style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)',
                borderRadius:16, overflow:'hidden' }}>
                <div style={{ padding:'14px 16px', borderBottom:'1px solid rgba(255,255,255,.06)',
                  fontWeight:700, fontSize:14 }}>
                  📋 Derniers logs
                </div>
                {LOGS.slice(0, 5).map((l, i) => <LogLine key={i} log={l}/>)}
                <div style={{ padding:'10px 16px', textAlign:'center' }}>
                  <button onClick={() => setOnglet('logs')}
                    style={{ background:'none', border:'none', color:'rgba(255,255,255,.4)',
                      fontSize:12, cursor:'pointer' }}>
                    Voir tous les logs →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ─── ÉQUIPE ADMIN ─── */}
          {onglet === 'admins' && (
            <div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                marginBottom:24 }}>
                <div>
                  <div style={{ fontSize:22, fontWeight:800, marginBottom:4 }}>Équipe administrative</div>
                  <div style={{ fontSize:14, color:'rgba(255,255,255,.35)' }}>
                    Gérer les rôles et accès de l'équipe
                  </div>
                </div>
                <button onClick={() => showToast('➕ Formulaire d\'invitation envoyé')}
                  style={{ background:'rgba(255,107,26,.15)', border:'1px solid rgba(255,107,26,.3)',
                    color:'#FF6B1A', borderRadius:10, padding:'9px 18px', fontSize:13,
                    fontWeight:700, cursor:'pointer' }}>
                  + Inviter un admin
                </button>
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {admins.map(a => (
                  <div key={a.id}
                    style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)',
                      borderRadius:14, padding:18, display:'flex',
                      alignItems:'center', gap:14 }}>
                    <div style={{ width:44, height:44, borderRadius:'50%',
                      background: a.role==='superadmin' ? '#FF6B1A' : 'var(--green)',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      color:'#fff', fontWeight:800, fontSize:16, flexShrink:0 }}>
                      {a.nom[0]}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:700, fontSize:14,
                        color:'rgba(255,255,255,.85)' }}>{a.nom}</div>
                      <div style={{ fontSize:12, color:'rgba(255,255,255,.35)', marginTop:2 }}>
                        {a.email} · Dernière activité : {a.derniere}
                      </div>
                    </div>
                    <RoleBadge role={a.role}/>
                    {a.role !== 'superadmin' && (
                      <div style={{ display:'flex', gap:6 }}>
                        <select
                          value={a.role}
                          onChange={e => changerRole(a.id, e.target.value)}
                          style={{ background:'rgba(255,255,255,.08)', border:'1px solid rgba(255,255,255,.12)',
                            color:'rgba(255,255,255,.7)', borderRadius:8, padding:'6px 10px',
                            fontSize:12, cursor:'pointer', outline:'none' }}>
                          <option value="moderateur">Modérateur</option>
                          <option value="admin">Admin</option>
                        </select>
                        <button onClick={() => showToast(`🚫 ${a.nom} retiré de l'équipe`)}
                          style={{ background:'rgba(239,68,68,.18)', color:'#FCA5A5',
                            fontSize:12, fontWeight:700, padding:'6px 12px',
                            borderRadius:8, border:'none', cursor:'pointer' }}>
                          Retirer
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── PERMISSIONS RBAC ─── */}
          {onglet === 'permissions' && (
            <div>
              <div style={{ fontSize:22, fontWeight:800, marginBottom:6 }}>
                Matrice des permissions (RBAC)
              </div>
              <div style={{ fontSize:14, color:'rgba(255,255,255,.35)', marginBottom:24 }}>
                Contrôle d'accès basé sur les rôles
              </div>

              <div style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)',
                borderRadius:16, overflow:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', minWidth:600 }}>
                  <thead>
                    <tr style={{ borderBottom:'1px solid rgba(255,255,255,.08)' }}>
                      <th style={{ padding:'14px 18px', textAlign:'left', fontSize:12,
                        color:'rgba(255,255,255,.35)', fontWeight:700 }}>
                        Permission
                      </th>
                      {['Utilisateur','Vendeur','Modérateur','Admin','Super Admin'].map(r => (
                        <th key={r} style={{ padding:'14px 12px', textAlign:'center',
                          fontSize:11, color:'rgba(255,255,255,.4)', fontWeight:700,
                          textTransform:'uppercase', letterSpacing:'.4px' }}>
                          {r}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {PERMISSIONS.map(p => (
                      <tr key={p.perm}
                        style={{ borderBottom:'1px solid rgba(255,255,255,.04)' }}>
                        <td style={{ padding:'13px 18px', fontSize:13,
                          color:'rgba(255,255,255,.65)', fontWeight:500 }}>
                          {p.perm}
                        </td>
                        {[p.u, p.v, p.m, p.a, p.sa].map((has, i) => (
                          <td key={i} style={{ padding:'13px 12px', textAlign:'center' }}>
                            {has ? (
                              <span style={{ color:'var(--green)', fontSize:18 }}>✓</span>
                            ) : (
                              <span style={{ color:'rgba(255,255,255,.15)', fontSize:16 }}>—</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ─── SERVEURS ─── */}
          {onglet === 'serveurs' && (
            <div>
              <div style={{ fontSize:22, fontWeight:800, marginBottom:6 }}>
                Monitoring serveurs
              </div>
              <div style={{ fontSize:14, color:'rgba(255,255,255,.35)', marginBottom:24 }}>
                État en temps réel de l'infrastructure Firebase
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',
                gap:16, marginBottom:24 }}>
                {SERVEURS.map(s => (
                  <div key={s.nom}
                    style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)',
                      borderRadius:14, padding:20 }}>
                    <div style={{ display:'flex', justifyContent:'space-between',
                      alignItems:'center', marginBottom:14 }}>
                      <div style={{ fontWeight:700, fontSize:14,
                        color:'rgba(255,255,255,.8)' }}>{s.nom}</div>
                      <span style={{ background:'rgba(16,185,129,.15)', color:'#6EE7B7',
                        fontSize:11, fontWeight:700, padding:'2px 9px', borderRadius:8 }}>
                        {s.statut}
                      </span>
                    </div>
                    <div style={{ background:'rgba(255,255,255,.08)', borderRadius:6,
                      height:10, overflow:'hidden', marginBottom:10 }}>
                      <div style={{ width:s.val+'%', height:'100%', borderRadius:6,
                        background:s.color, transition:'.5s' }}/>
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:12 }}>
                      <span style={{ color:'rgba(255,255,255,.35)' }}>Utilisation</span>
                      <span style={{ color:s.color, fontWeight:700 }}>{s.val}%</span>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)',
                borderRadius:14, padding:20 }}>
                <div style={{ fontWeight:700, fontSize:14, marginBottom:14 }}>
                  Services Firebase
                </div>
                {[
                  { service:'Firestore Database', statut:'✅ Opérationnel', latence:'12ms'  },
                  { service:'Authentication',     statut:'✅ Opérationnel', latence:'8ms'   },
                  { service:'Firebase Storage',   statut:'✅ Opérationnel', latence:'45ms'  },
                  { service:'Cloud Functions',    statut:'⏳ Non configuré', latence:'—'    },
                  { service:'Firebase Hosting',   statut:'✅ Opérationnel', latence:'22ms'  },
                ].map(s => (
                  <div key={s.service}
                    style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                      padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,.06)',
                      fontSize:13 }}>
                    <span style={{ color:'rgba(255,255,255,.7)' }}>{s.service}</span>
                    <div style={{ display:'flex', gap:16, alignItems:'center' }}>
                      <span style={{ fontSize:11, color:'rgba(255,255,255,.35)' }}>
                        Latence: {s.latence}
                      </span>
                      <span style={{ fontSize:12, fontWeight:600 }}>{s.statut}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── LOGS ─── */}
          {onglet === 'logs' && (
            <div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                marginBottom:24 }}>
                <div>
                  <div style={{ fontSize:22, fontWeight:800, marginBottom:4 }}>Logs système</div>
                  <div style={{ fontSize:14, color:'rgba(255,255,255,.35)' }}>
                    Journal d'activité de la plateforme
                  </div>
                </div>
                <button onClick={() => showToast('📥 Logs exportés en CSV')}
                  style={{ background:'rgba(255,255,255,.08)', border:'1px solid rgba(255,255,255,.12)',
                    color:'rgba(255,255,255,.7)', borderRadius:10, padding:'9px 16px',
                    fontSize:13, fontWeight:600, cursor:'pointer' }}>
                  📥 Exporter
                </button>
              </div>

              <div style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)',
                borderRadius:16, overflow:'hidden', fontFamily:'monospace' }}>
                <div style={{ padding:'10px 16px', borderBottom:'1px solid rgba(255,255,255,.06)',
                  display:'flex', gap:16, fontSize:11, color:'rgba(255,255,255,.3)' }}>
                  <span>HEURE</span>
                  <span>TYPE</span>
                  <span>MESSAGE</span>
                </div>
                {LOGS.map((l, i) => <LogLine key={i} log={l}/>)}
              </div>
            </div>
          )}

          {/* ─── ACTIONS CRITIQUES ─── */}
          {onglet === 'actions' && (
            <div>
              <div style={{ fontSize:22, fontWeight:800, marginBottom:6 }}>
                Actions critiques
              </div>
              <div style={{ fontSize:14, color:'rgba(255,255,255,.35)', marginBottom:24 }}>
                ⚠️ Ces actions affectent toute la plateforme — à utiliser avec précaution
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                {[
                  {
                    ico:'💾', titre:'Sauvegarder la base de données',
                    desc:'Lance une sauvegarde complète de Firestore. Dernière : il y a 2 heures.',
                    btn:'Lancer la sauvegarde', color:'rgba(0,200,150,.15)', borderColor:'rgba(0,200,150,.2)',
                    btnColor:'rgba(0,200,150,.2)', btnText:'#6EE7B7',
                    action:'💾 Sauvegarde démarrée — ETA: 3 minutes'
                  },
                  {
                    ico:'🔄', titre:'Vider le cache Redis',
                    desc:'Vide le cache applicatif. Peut ralentir temporairement le site.',
                    btn:'Vider le cache', color:'rgba(59,130,246,.1)', borderColor:'rgba(59,130,246,.2)',
                    btnColor:'rgba(59,130,246,.2)', btnText:'#93C5FD',
                    action:'🔄 Cache vidé — 1.2 GB libérés'
                  },
                  {
                    ico:'📢', titre:'Notification globale',
                    desc:'Envoyer une notification à tous les utilisateurs de la plateforme.',
                    btn:'Envoyer', color:'rgba(245,158,11,.1)', borderColor:'rgba(245,158,11,.2)',
                    btnColor:'rgba(245,158,11,.2)', btnText:'#FCD34D',
                    action:'📢 Notification envoyée à 1 247 utilisateurs'
                  },
                  {
                    ico:'🔧', titre:'Mode maintenance',
                    desc:'Coupe l\'accès utilisateurs pendant une maintenance. Admin reste accessible.',
                    btn:'Activer la maintenance', color:'rgba(239,68,68,.1)', borderColor:'rgba(239,68,68,.2)',
                    btnColor:'rgba(239,68,68,.2)', btnText:'#FCA5A5',
                    action:'🔧 Mode maintenance activé'
                  },
                  {
                    ico:'⚙️', titre:'Gérer les API Keys',
                    desc:'Firebase, Orange Money, Cloudinary. Rotation des clés de sécurité.',
                    btn:'Gérer les clés', color:'rgba(139,92,246,.1)', borderColor:'rgba(139,92,246,.2)',
                    btnColor:'rgba(139,92,246,.2)', btnText:'#C4B5FD',
                    action:'⚙️ Interface de gestion API Keys ouverte'
                  },
                  {
                    ico:'🗄️', titre:'Restaurer la base de données',
                    desc:'Restaurer depuis une sauvegarde. Toutes les données récentes seront perdues.',
                    btn:'Restaurer', color:'rgba(239,68,68,.08)', borderColor:'rgba(239,68,68,.2)',
                    btnColor:'rgba(239,68,68,.2)', btnText:'#FCA5A5',
                    action:'🗄️ Sélectionne une sauvegarde à restaurer'
                  },
                ].map(a => (
                  <div key={a.titre}
                    style={{ background:a.color, border:`1px solid ${a.borderColor}`,
                      borderRadius:16, padding:20 }}>
                    <div style={{ fontSize:28, marginBottom:10 }}>{a.ico}</div>
                    <div style={{ fontWeight:700, fontSize:15, color:'rgba(255,255,255,.85)',
                      marginBottom:8 }}>
                      {a.titre}
                    </div>
                    <div style={{ fontSize:13, color:'rgba(255,255,255,.45)', lineHeight:1.5,
                      marginBottom:16 }}>
                      {a.desc}
                    </div>
                    <button onClick={() => showToast(a.action)}
                      style={{ background:a.btnColor, color:a.btnText,
                        border:'none', borderRadius:10, padding:'9px 18px',
                        fontSize:13, fontWeight:700, cursor:'pointer', width:'100%' }}>
                      {a.btn}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </main>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed', bottom:32, left:'50%', transform:'translateX(-50%)',
          background:'#1a0500', color:'#fff', padding:'12px 22px', borderRadius:20,
          fontSize:14, fontWeight:500, zIndex:9999, whiteSpace:'nowrap',
          boxShadow:'0 8px 24px rgba(0,0,0,.5)', border:'1px solid rgba(255,107,26,.3)' }}>
          {toast}
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:.4} }
      `}</style>
    </div>
  )
}
