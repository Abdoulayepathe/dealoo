import { useState, useEffect } from 'react'
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore'
import { db } from '../firebase/config'

// Transforme un document Firestore en article uniforme pour l'UI
function docToArticle(doc) {
  const d = doc.data()
  return {
    firestoreId:     doc.id,
    id:              doc.id,
    titre:           d.titre         || '',
    prix:            d.prix          ?? 0,
    don:             d.est_don       || false,
    cat:             d.categorie     || 'Autres',
    etat:            d.etat_article  || 'bon',
    lieu:            d.ville         || 'Conakry',
    emoji:           d.emoji         || '📦',
    bg:              d.bg            || '#F0F0F5',
    boost:           d.boost         || false,
    desc:            d.description   || '',
    photos:          d.photos        || [],
    statut:          d.statut        || 'active',
    userId:          d.utilisateur_id || '',
    utilisateur_id:  d.utilisateur_id || '',
    vendeur:         d.vendeur || {
      nom:       'Vendeur DEALOO',
      initiales: 'VD',
      couleur:   '#00C896',
      note:      5,
      ventes:    0,
      dons:      0,
      membre:    '2025',
      telephone: '224620000000',
    },
    isDemo:          false,
  }
}

// ═══════════════════════════════════════════════════════════════════
// HOOK PRINCIPAL — Lit UNIQUEMENT Firestore en temps réel
// Plus aucune annonce de démo. Si vide → message clair.
// ═══════════════════════════════════════════════════════════════════
export function useArticles() {
  const [articles, setArticles] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)

  useEffect(() => {
    let unsub = null

    // Tentative 1 : avec orderBy (nécessite index)
    try {
      const q = query(
        collection(db, 'annonces'),
        orderBy('date_publication', 'desc')
      )

      unsub = onSnapshot(
        q,
        (snapshot) => {
          const docs = snapshot.docs
            .map(docToArticle)
            .filter(a => a.statut !== 'supprime')  // exclure les supprimées
          setArticles(docs)
          setLoading(false)
          setError(null)
        },
        (err) => {
          console.warn('Firestore orderBy échoué:', err.code)
          // Fallback sans orderBy
          if (unsub) unsub()
          unsub = onSnapshot(
            collection(db, 'annonces'),
            (snapshot) => {
              const docs = snapshot.docs
                .map(docToArticle)
                .filter(a => a.statut !== 'supprime')
                .sort((a, b) => (b.date_publication?.seconds || 0) - (a.date_publication?.seconds || 0))
              setArticles(docs)
              setLoading(false)
            },
            (err2) => {
              console.error('Firestore inaccessible:', err2)
              setError(err2.message)
              setLoading(false)
            }
          )
        }
      )
    } catch (err) {
      console.error('Firebase non configuré:', err)
      setError('Firebase non disponible')
      setLoading(false)
    }

    return () => { if (unsub) unsub() }
  }, [])

  return { articles, loading, error }
}
