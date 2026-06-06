import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useFavoris } from '../context/FavorisContext'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase/config'
import {
  Search, Bell, Heart, Plus, User,
  LogOut, Package, X, ChevronDown
} from 'lucide-react'

export default function Navbar({ search = '', onSearch }) {
  const { user, profil }  = useAuth()
  const { favoris }       = useFavoris()
  const navigate          = useNavigate()
  const { pathname }      = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const nomAffiche = profil?.prenom || user?.displayName?.split(' ')[0] || null
  const initiales  = nomAffiche ? nomAffiche[0].toUpperCase()
    : user?.email?.[0]?.toUpperCase() || '?'

  async function handleDeconnexion() {
    await signOut(auth)
    navigate('/connexion')
    setMenuOpen(false)
  }

  return (
    <header className="navbar">
      <div className="container">
        <div className="navbar-inner">

          {/* Logo */}
          <Link to="/home" className="nav-logo">
            DEAL<span>OO</span>
          </Link>

          {/* Recherche */}
          {onSearch && (
            <div className="nav-search">
              <Search size={17} color="var(--t3)"/>
              <input
                value={search}
                onChange={e => onSearch(e.target.value)}
                placeholder="Rechercher un article, une marque..."
              />
              {search && (
                <button onClick={() => onSearch('')}
                  style={{ background:'none', border:'none', cursor:'pointer',
                    color:'var(--t3)', display:'flex' }}>
                  <X size={16}/>
                </button>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="nav-actions">

            {/* Notifications */}
            <Link to="/notifications" className="nav-icon-btn" title="Notifications"
              style={{ background: pathname === '/notifications' ? 'var(--green-l)' : undefined }}>
              <Bell size={19} color={pathname === '/notifications' ? 'var(--green-d)' : 'var(--t2)'}/>
              <span style={{ position:'absolute', top:7, right:7, width:7, height:7,
                background:'var(--red)', borderRadius:'50%', border:'1.5px solid var(--white)' }}/>
            </Link>

            {/* Favoris */}
            <Link to="/favoris" className="nav-icon-btn" title="Favoris"
              style={{ background: pathname === '/favoris' ? 'var(--green-l)' : undefined }}>
              <Heart size={19}
                color={favoris.length > 0 ? 'var(--red)' : (pathname==='/favoris' ? 'var(--green-d)':'var(--t2)')}
                fill={favoris.length > 0 ? 'var(--red)' : 'none'}/>
              {favoris.length > 0 && (
                <span style={{ position:'absolute', top:-3, right:-3, background:'var(--red)',
                  color:'#fff', borderRadius:10, padding:'1px 5px', fontSize:10,
                  fontWeight:700, border:'1.5px solid var(--white)', minWidth:17,
                  textAlign:'center' }}>
                  {favoris.length}
                </span>
              )}
            </Link>

            {/* Publier */}
            <Link to="/publier" className="btn btn-green btn-sm"
              style={{ display:'inline-flex', alignItems:'center', gap:5 }}>
              <Plus size={16}/> Publier
            </Link>

            {/* Profil */}
            {user ? (
              <div style={{ position:'relative' }}>
                <button onClick={() => setMenuOpen(!menuOpen)}
                  style={{ display:'flex', alignItems:'center', gap:4,
                    background:'none', border:'none', cursor:'pointer', padding:0 }}>
                  <div style={{ width:38, height:38, borderRadius:'50%',
                    background:'var(--green)', display:'flex', alignItems:'center',
                    justifyContent:'center', color:'var(--dark)', fontWeight:800, fontSize:15,
                    border: pathname==='/profil' ? '2px solid var(--green-d)' : '2px solid transparent' }}>
                    {initiales}
                  </div>
                  <ChevronDown size={15} color="var(--t3)"/>
                </button>

                {menuOpen && (
                  <>
                    <div style={{ position:'fixed', inset:0, zIndex:998 }}
                      onClick={() => setMenuOpen(false)}/>
                    <div style={{ position:'absolute', top:'calc(100% + 8px)', right:0,
                      background:'var(--white)', border:'1px solid var(--g2)',
                      borderRadius:14, boxShadow:'0 8px 24px rgba(0,0,0,.12)',
                      minWidth:210, zIndex:999, overflow:'hidden' }}>
                      <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--g2)',
                        background:'var(--g1)' }}>
                        <div style={{ fontWeight:700, fontSize:14 }}>{nomAffiche || 'Mon compte'}</div>
                        <div style={{ fontSize:12, color:'var(--t3)', marginTop:2,
                          overflow:'hidden', textOverflow:'ellipsis' }}>{user.email}</div>
                      </div>
                      {[
                        { Icon:User,    label:'Mon profil',    to:'/profil' },
                        { Icon:Package, label:'Mes annonces',  to:'/profil' },
                        { Icon:Heart,   label:'Mes favoris',   to:'/favoris' },
                        { Icon:Bell,    label:'Notifications', to:'/notifications' },
                      ].map((item, i) => (
                        <Link key={i} to={item.to} onClick={() => setMenuOpen(false)}
                          style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 16px',
                            fontSize:14, color:'var(--t1)', textDecoration:'none',
                            borderBottom:'1px solid var(--g2)' }}
                          onMouseOver={e => e.currentTarget.style.background='var(--g1)'}
                          onMouseOut={e => e.currentTarget.style.background='transparent'}>
                          <item.Icon size={17} color="var(--t2)"/> {item.label}
                        </Link>
                      ))}
                      <button onClick={handleDeconnexion}
                        style={{ display:'flex', alignItems:'center', gap:10, width:'100%',
                          padding:'11px 16px', fontSize:14, color:'var(--red)',
                          background:'none', border:'none', cursor:'pointer', textAlign:'left' }}>
                        <LogOut size={17}/> Se déconnecter
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link to="/connexion" className="btn btn-outline btn-sm">Se connecter</Link>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
