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
            {['Comment vendre ?', 'Comment acheter ?', 'Paiement sécurisé', 'Signaler un abus'].map(t => (
              <div key={t} style={{ marginBottom: 8 }}>
                <span style={{ color: 'rgba(255,255,255,.5)', fontSize: 14, cursor: 'pointer' }}>{t}</span>
              </div>
            ))}
          </div>

          {/* Paiements */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '.5px' }}>
              Paiements acceptés
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {['🟠 Orange Money', '🌊 Wave', '💚 MTN MoMo', '💳 Visa'].map(p => (
                <span key={p} style={{ background: 'rgba(255,255,255,.08)', padding: '4px 10px', borderRadius: 8, fontSize: 12 }}>{p}</span>
              ))}
            </div>
          </div>

        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,.08)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ fontSize: 13 }}>© 2025 DEALOO — Marketplace guinéenne</div>
          <div style={{ fontSize: 13 }}>Fait avec ❤️ pour la Guinée 🇬🇳</div>
        </div>
      </div>
    </footer>
  )
}
