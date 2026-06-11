import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer style={{
      background: 'var(--dark)',
      color: 'rgba(255,255,255,.5)',
      padding: '48px 0 32px',
      marginTop: 'auto',
    }}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 32, marginBottom: 40 }}>

          {/* Logo + description */}
          <div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', letterSpacing: -1, marginBottom: 10 }}>
              DEAL<span style={{ color: 'var(--green)' }}>OO</span>
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.7 }}>
              La première marketplace guinéenne. Achète, vends et donne entre particuliers.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '.5px' }}>
              Navigation
            </div>
            {[
              ['Accueil', '/home'],
              ['Explorer', '/explorer'],
              ['Publier un article', '/publier'],
              ['Mon profil', '/profil'],
            ].map(([label, to]) => (
              <div key={to} style={{ marginBottom: 8 }}>
                <Link to={to} style={{ color: 'rgba(255,255,255,.5)', textDecoration: 'none', fontSize: 14, transition: '.15s' }}>
                  {label}
                </Link>
              </div>
            ))}
          </div>

          {/* Aide */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '.5px' }}>
              Aide
            </div>
            {['Comment vendre ?', 'Comment acheter ?', 'Le système DON 🤲', 'Signaler un abus'].map(t => (
              <div key={t} style={{ marginBottom: 8 }}>
                <span style={{ color: 'rgba(255,255,255,.5)', fontSize: 14, cursor: 'pointer' }}>{t}</span>
              </div>
            ))}
          </div>

          {/* Nous contacter */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '.5px' }}>
              Nous contacter
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <a href="https://wa.me/224624005418" target="_blank" rel="noreferrer"
                style={{ display:'flex', alignItems:'center', gap:8,
                  background:'rgba(37,211,102,.12)', border:'1px solid rgba(37,211,102,.25)',
                  padding:'8px 12px', borderRadius:10, textDecoration:'none',
                  color:'#25D366', fontSize:13, fontWeight:600 }}>
                💬 WhatsApp DEALOO
              </a>
              <span style={{ display:'flex', alignItems:'center', gap:8,
                background:'rgba(255,255,255,.06)', padding:'8px 12px',
                borderRadius:10, fontSize:13, color:'rgba(255,255,255,.6)' }}>
                📍 Conakry, Guinée
              </span>
              <span style={{ display:'flex', alignItems:'center', gap:8,
                background:'rgba(255,255,255,.06)', padding:'8px 12px',
                borderRadius:10, fontSize:13, color:'rgba(255,255,255,.6)' }}>
                🕐 Disponible 7j/7
              </span>
            </div>
          </div>

        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,.08)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ fontSize: 13 }}>© 2026 DEALOO — Marketplace guinéenne</div>
          <div style={{ fontSize: 13 }}>Fait avec ❤️ pour la Guinée 🇬🇳</div>
        </div>
      </div>
    </footer>
  )
}
