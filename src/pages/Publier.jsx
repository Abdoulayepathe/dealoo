import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  collection, addDoc, updateDoc,
  doc, serverTimestamp
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { CATS, VILLES } from '../data/articles'

// ══════════════════════════════════════════════════════════════
// CLOUDINARY CONFIG
// Remplace par ton Cloud Name depuis cloudinary.com/console
// ══════════════════════════════════════════════════════════════
const CLOUDINARY_CLOUD_NAME = 'dfbwxwntv'  // ← à remplacer
const CLOUDINARY_UPLOAD_PRESET = 'dealoo_upload'   // ← à créer (voir README)
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`

const ETATS = [
  { val:'neuf',  label:'Neuf',     desc:'Jamais utilisé' },
  { val:'bon',   label:'Bon état', desc:'Peu utilisé'    },
  { val:'usage', label:'Usagé',    desc:'Fonctionnel'    },
]

// ── Compresser avant upload ───────────────────────────────────
function compresserImage(file, maxPx = 900, qualite = 0.8) {
  return new Promise((resolve) => {
    const img    = new Image()
    const reader = new FileReader()
    reader.onload = e => { img.src = e.target.result }
    img.onload = () => {
      const canvas = document.createElement('canvas')
      let { width, height } = img
      if (width > maxPx || height > maxPx) {
        if (width > height) { height = Math.round(height * maxPx / width); width = maxPx }
        else { width = Math.round(width * maxPx / height); height = maxPx }
      }
      canvas.width  = width
      canvas.height = height
      canvas.getContext('2d').drawImage(img, 0, 0, width, height)
      canvas.toBlob(blob => resolve(blob), 'image/jpeg', qualite)
    }
    reader.readAsDataURL(file)
  })
}

// ── Upload vers Cloudinary ────────────────────────────────────
async function uploadCloudinary(blob, onProgress) {
  const formData = new FormData()
  formData.append('file', blob)
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)
  formData.append('folder', 'dealoo/annonces')

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    xhr.upload.onprogress = e => {
      if (e.lengthComputable) {
        onProgress(Math.round(e.loaded / e.total * 100))
      }
    }

    xhr.onload = () => {
      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText)
        resolve(data.secure_url)
      } else {
        reject(new Error(`Cloudinary erreur ${xhr.status}: ${xhr.responseText}`))
      }
    }

    xhr.onerror = () => reject(new Error('Erreur réseau — vérifie ta connexion'))

    xhr.open('POST', CLOUDINARY_URL)
    xhr.send(formData)
  })
}

// ══════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ══════════════════════════════════════════════════════════════
export default function Publier() {
  const navigate         = useNavigate()
  const { user, profil } = useAuth()

  const [etape,   setEtape]   = useState(1)
  const [loading, setLoading] = useState(false)
  const [erreur,  setErreur]  = useState('')
  const [succes,  setSucces]  = useState(false)
  const [donMode, setDonMode] = useState(false)

  // Photos
  const [blobs,     setBlobs]     = useState([])
  const [previews,  setPreviews]  = useState([])
  const [compressing, setCompressing] = useState(false)
  const [progress,  setProgress]  = useState(0)
  const [photoMsg,  setPhotoMsg]  = useState('')

  const [form, setForm] = useState({
    titre:'', description:'', categorie: CATS[0],
    etat:'bon', prix:'', ville: VILLES[0],
    livraison:false, marque:'', couleur:'', taille:'',
  })

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
    setErreur('')
  }

  // ── Sélection et compression des photos ──────────────────────
  async function handlePhotos(e) {
    const fichiers = Array.from(e.target.files)
    if (!fichiers.length) return

    // Validation
    const mauvaisType = fichiers.find(f => !f.type.startsWith('image/'))
    if (mauvaisType) { setErreur(`Format invalide : ${mauvaisType.name}. JPG ou PNG uniquement.`); return }

    const tropLourd = fichiers.find(f => f.size > 10 * 1024 * 1024)
    if (tropLourd) { setErreur('Image trop lourde — max 10 Mo par photo.'); return }

    const selection = fichiers.slice(0, 8)
    setErreur('')
    setCompressing(true)
    setPhotoMsg(`Compression de ${selection.length} photo(s)...`)

    try {
      const blobsCompresses = await Promise.all(selection.map(f => compresserImage(f)))
      const urls = blobsCompresses.map(b => URL.createObjectURL(b))
      setBlobs(blobsCompresses)
      setPreviews(urls)
      setPhotoMsg(`✅ ${selection.length} photo(s) prête(s)`)
    } catch (err) {
      setErreur('Erreur compression : ' + err.message)
      setPhotoMsg('')
    } finally {
      setCompressing(false)
    }
  }

  function supprimerPhoto(idx) {
    setBlobs(b    => b.filter((_, i) => i !== idx))
    setPreviews(p => p.filter((_, i) => i !== idx))
  }

  // ── Validation étape 1 ────────────────────────────────────────
  function validerEtape1() {
    if (!form.titre.trim())       { setErreur('Le titre est obligatoire.');              return false }
    if (!form.description.trim()) { setErreur('La description est obligatoire.');        return false }
    if (!donMode && !form.prix)   { setErreur('Indique un prix ou active le mode DON.'); return false }
    if (!donMode && isNaN(Number(form.prix))) { setErreur('Le prix doit être un nombre.'); return false }
    return true
  }

  // ── Publication ───────────────────────────────────────────────
  async function handlePublier(e) {
    e.preventDefault()
    if (!user) { navigate('/connexion'); return }

    setLoading(true)
    setErreur('')
    setProgress(0)

    try {
      // 1. Créer l'annonce dans Firestore
      const docRef = await addDoc(collection(db, 'annonces'), {
        titre:            form.titre.trim(),
        description:      form.description.trim(),
        categorie:        form.categorie,
        etat_article:     form.etat,
        prix:             donMode ? 0 : Number(form.prix),
        est_don:          donMode,
        ville:            form.ville,
        livraison:        form.livraison,
        marque:           form.marque,
        couleur:          form.couleur,
        taille:           form.taille,
        statut:           'active',
        nb_vues:          0,
        photos:           [],
        emoji:            '📦',
        bg:               '#F0F0F5',
        utilisateur_id:   user.uid,
        vendeur: {
          nom:       profil?.prenom
            ? `${profil.prenom} ${profil.nom || ''}`.trim()
            : (user.displayName || 'Vendeur DEALOO'),
          initiales: (profil?.prenom?.[0] || user.email?.[0] || 'V').toUpperCase(),
          couleur:   '#00C896',
          note:      5,
          ventes:    0,
          dons:      donMode ? 1 : 0,
          membre:    new Date().getFullYear().toString(),
          telephone: profil?.telephone || '224620000000',
        },
        date_publication: serverTimestamp(),
      })

      // 2. Upload photos vers Cloudinary
      if (blobs.length > 0) {
        const photoURLs = []

        for (let i = 0; i < blobs.length; i++) {
          setPhotoMsg(`Upload photo ${i + 1}/${blobs.length}...`)
          try {
            const url = await uploadCloudinary(blobs[i], pct => setProgress(pct))
            photoURLs.push(url)
          } catch (uploadErr) {
            console.warn('Upload Cloudinary échoué:', uploadErr.message)
            // Si Cloud Name non configuré → message clair
            if (uploadErr.message.includes('404') || uploadErr.message.includes('VOTRE_CLOUD_NAME')) {
              setErreur('Configure ton Cloud Name Cloudinary dans Publier.jsx')
            } else {
              setPhotoMsg(`⚠️ Photo ${i+1} non uploadée — annonce publiée sans photo`)
            }
          }
        }

        // 3. Mettre à jour Firestore avec les URLs Cloudinary
        if (photoURLs.length > 0) {
          await updateDoc(doc(db, 'annonces', docRef.id), { photos: photoURLs })
        }
      }

      setSucces(true)
    } catch (err) {
      console.error('Erreur publication:', err)
      if (err.code === 'permission-denied') {
        setErreur('Permission Firestore refusée. Vérifie les règles dans Firebase Console.')
      } else {
        setErreur('Erreur : ' + err.message)
      }
    } finally {
      setLoading(false)
      setPhotoMsg('')
      setProgress(0)
    }
  }

  // ── Bloc acheteur (compte ne peut pas vendre) ────────────────
  if (profil && profil.type_compte === 'acheteur') return (
    <>
      <Navbar />
      <div style={{ minHeight:'70vh', display:'flex', alignItems:'center',
        justifyContent:'center', padding:'40px 20px' }}>
        <div style={{ background:'var(--white)', borderRadius:18,
          padding:'48px 36px', maxWidth:520, width:'100%', textAlign:'center',
          boxShadow:'0 10px 40px rgba(0,0,0,.08)' }}>
          <div style={{ fontSize:64, marginBottom:16 }}>🛒</div>
          <div style={{ fontSize:22, fontWeight:800, color:'var(--t1)', marginBottom:10 }}>
            Compte acheteur
          </div>
          <p style={{ fontSize:14, color:'var(--t2)', lineHeight:1.6, marginBottom:24 }}>
            Ton compte est configuré en mode <b>Acheteur uniquement</b>.
            Pour publier des annonces, tu dois passer ton compte en mode <b>Vendeur</b> ou <b>Les deux</b>.
          </p>
          <Link to="/profil" className="btn btn-green btn-lg" style={{ marginBottom:10, display:'block' }}>
            ⚙️ Modifier mon type de compte
          </Link>
          <Link to="/explorer" className="btn btn-outline btn-full">
            ← Continuer à explorer
          </Link>
        </div>
      </div>
      <Footer />
    </>
  )

  // ── Page succès ───────────────────────────────────────────────
  if (succes) return (
    <>
      <Navbar />
      <div style={{ minHeight:'70vh', display:'flex', alignItems:'center',
        justifyContent:'center', padding:'40px 20px' }}>
        <div style={{ textAlign:'center', maxWidth:480 }}>
          <div style={{ width:90, height:90, borderRadius:'50%', background:'var(--green-l)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:42, margin:'0 auto 24px' }}>
            {donMode ? '🤲' : '✅'}
          </div>
          <h1 style={{ fontSize:28, fontWeight:800, marginBottom:10 }}>
            {donMode ? 'Don publié !' : 'Annonce publiée !'}
          </h1>
          <p style={{ fontSize:16, color:'var(--t2)', lineHeight:1.65, marginBottom:32 }}>
            {donMode
              ? `"${form.titre}" est disponible gratuitement avec le badge DON.`
              : `"${form.titre}" est maintenant visible sur DEALOO.`
            }
          </p>
          <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
            <Link to="/home" className="btn btn-green btn-lg">Voir l'accueil</Link>
            <button
              onClick={() => {
                setSucces(false)
                setForm({ titre:'', description:'', categorie:CATS[0], etat:'bon',
                  prix:'', ville:VILLES[0], livraison:false, marque:'', couleur:'', taille:'' })
                setDonMode(false); setBlobs([]); setPreviews([]); setEtape(1)
              }}
              className="btn btn-outline btn-lg">
              + Publier un autre
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )

  return (
    <>
      <Navbar />

      <div style={{ background:'var(--dark)', padding:'32px 0 24px' }}>
        <div className="container">
          <Link to="/home" className="btn-back" style={{ marginBottom:12, display:'inline-flex' }}>
            ← Accueil
          </Link>
          <h1 style={{ fontSize:'clamp(22px,3vw,32px)', fontWeight:800, color:'#fff', marginBottom:6 }}>
            Publier une annonce
          </h1>
          <p style={{ fontSize:14, color:'rgba(255,255,255,.45)' }}>
            Gratuit et rapide — moins de 2 minutes
          </p>
        </div>
      </div>

      <main style={{ padding:'32px 0 60px' }}>
        <div className="container">
          <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:32, alignItems:'start' }}
            className="pub-grid">

            {/* ── Formulaire ── */}
            <div>
              {/* Barre progression */}
              <div style={{ display:'flex', gap:0, marginBottom:28, background:'var(--g1)',
                borderRadius:12, padding:4, border:'1px solid var(--g2)' }}>
                {[{n:1,label:'Infos'},{n:2,label:'Photos'},{n:3,label:'Publier'}].map(s => (
                  <button key={s.n}
                    onClick={() => etape > s.n && setEtape(s.n)}
                    style={{ flex:1, padding:'9px 8px', borderRadius:9, border:'none',
                      background: etape===s.n ? 'var(--white)' : 'transparent',
                      color: etape===s.n ? 'var(--t1)' : 'var(--t3)',
                      fontWeight: etape===s.n ? 700 : 500, fontSize:13,
                      cursor: etape>s.n ? 'pointer' : 'default',
                      boxShadow: etape===s.n ? '0 1px 4px rgba(0,0,0,.08)' : 'none',
                      transition:'.2s', display:'flex', alignItems:'center',
                      justifyContent:'center', gap:6 }}>
                    <span style={{ width:20, height:20, borderRadius:'50%',
                      background: etape>s.n ? 'var(--green)' : etape===s.n ? 'var(--dark)' : 'var(--g3)',
                      color:'#fff', fontSize:11, fontWeight:700,
                      display:'flex', alignItems:'center', justifyContent:'center' }}>
                      {etape>s.n ? '✓' : s.n}
                    </span>
                    {s.label}
                  </button>
                ))}
              </div>

              {erreur && <div className="alert-error" style={{ marginBottom:16 }}>⚠️ {erreur}</div>}

              <form onSubmit={handlePublier}>

                {/* ─── ÉTAPE 1 — Infos ─── */}
                {etape === 1 && (
                  <div className="card" style={{ padding:24 }}>
                    <h2 style={{ fontSize:17, fontWeight:700, marginBottom:20 }}>Informations</h2>

                    {/* Toggle DON */}
                    <div onClick={() => setDonMode(!donMode)}
                      style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                        background: donMode ? 'var(--green-l)' : 'var(--g1)',
                        border:`1.5px solid ${donMode ? 'var(--green-m)' : 'var(--g3)'}`,
                        borderRadius:14, padding:'14px 16px', marginBottom:20,
                        cursor:'pointer', transition:'.2s' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                        <span style={{ fontSize:24 }}>🤲</span>
                        <div>
                          <div style={{ fontWeight:700, fontSize:14 }}>Je donne cet article gratuitement</div>
                          <div style={{ fontSize:12, color:'var(--t3)', marginTop:2 }}>Badge DON · Prix = 0 GNF</div>
                        </div>
                      </div>
                      <div style={{ width:44, height:26, borderRadius:13,
                        background: donMode ? 'var(--green)' : 'var(--g3)',
                        position:'relative', transition:'.25s', flexShrink:0 }}>
                        <div style={{ width:22, height:22, borderRadius:'50%', background:'#fff',
                          position:'absolute', top:2, left: donMode ? 20 : 2,
                          transition:'.25s', boxShadow:'0 2px 4px rgba(0,0,0,.2)' }}/>
                      </div>
                    </div>

                    <div className="field">
                      <label className="field-label">Titre *</label>
                      <input name="titre" className="field-input"
                        placeholder="Ex : iPhone 12 64Go noir, excellent état"
                        value={form.titre} onChange={handleChange} maxLength={80}/>
                      <div style={{ fontSize:11, color:'var(--t3)', marginTop:3, textAlign:'right' }}>
                        {form.titre.length}/80
                      </div>
                    </div>

                    <div className="field">
                      <label className="field-label">Catégorie *</label>
                      <select name="categorie" className="field-select"
                        value={form.categorie} onChange={handleChange}>
                        {CATS.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>

                    <div className="field">
                      <label className="field-label">État *</label>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
                        {ETATS.map(e => (
                          <div key={e.val}
                            onClick={() => setForm(f => ({...f, etat:e.val}))}
                            style={{ padding:'12px 10px', borderRadius:12, cursor:'pointer',
                              border:`2px solid ${form.etat===e.val?'var(--green)':'var(--g3)'}`,
                              background: form.etat===e.val ? 'var(--green-l)' : 'var(--white)',
                              textAlign:'center', transition:'.15s' }}>
                            <div style={{ fontWeight:700, fontSize:13,
                              color: form.etat===e.val ? 'var(--green-d)' : 'var(--t1)' }}>
                              {e.label}
                            </div>
                            <div style={{ fontSize:11, color:'var(--t3)', marginTop:3 }}>{e.desc}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {!donMode && (
                      <div className="field">
                        <label className="field-label">Prix (GNF) *</label>
                        <div style={{ position:'relative' }}>
                          <input name="prix" type="number" className="field-input"
                            placeholder="Ex : 350000" value={form.prix}
                            onChange={handleChange} style={{ paddingRight:55 }}/>
                          <span style={{ position:'absolute', right:13, top:'50%',
                            transform:'translateY(-50%)', fontSize:12,
                            fontWeight:600, color:'var(--t3)' }}>GNF</span>
                        </div>
                        {form.prix && (
                          <div style={{ fontSize:12, color:'var(--green-d)', marginTop:3, fontWeight:600 }}>
                            {Number(form.prix).toLocaleString('fr-FR')} GNF
                          </div>
                        )}
                      </div>
                    )}

                    {donMode && (
                      <div style={{ background:'var(--green-l)', border:'1px solid var(--green-m)',
                        borderRadius:12, padding:'11px 15px', marginBottom:16,
                        fontSize:13, color:'var(--green-d)' }}>
                        🎁 Prix = 0 GNF — badge DON visible sur l'annonce
                      </div>
                    )}

                    <div className="field">
                      <label className="field-label">Description *</label>
                      <textarea name="description" className="field-input"
                        placeholder="Décris ton article : état précis, raison de vente, accessoires..."
                        value={form.description} onChange={handleChange}
                        rows={5} maxLength={1000}
                        style={{ resize:'vertical', minHeight:110 }}/>
                      <div style={{ fontSize:11, color:'var(--t3)', marginTop:3, textAlign:'right' }}>
                        {form.description.length}/1000
                      </div>
                    </div>

                    <button type="button" className="btn btn-green btn-full btn-lg"
                      onClick={() => { if(validerEtape1()) setEtape(2) }}>
                      Continuer →
                    </button>
                  </div>
                )}

                {/* ─── ÉTAPE 2 — Photos ─── */}
                {etape === 2 && (
                  <div className="card" style={{ padding:24 }}>
                    <h2 style={{ fontSize:17, fontWeight:700, marginBottom:20 }}>Photos</h2>

                    <div className="field">
                      <label className="field-label">
                        Photos
                        <span style={{ fontWeight:400, color:'var(--t3)', marginLeft:6, fontSize:12 }}>
                          (optionnel — max 8, JPG/PNG)
                        </span>
                      </label>

                      <label style={{ display:'block', cursor:'pointer' }}>
                        <input type="file" accept="image/jpeg,image/png,image/webp"
                          multiple onChange={handlePhotos}
                          disabled={compressing}
                          style={{ display:'none' }}/>
                        <div style={{ border:'2px dashed var(--g3)', borderRadius:14,
                          padding: previews.length > 0 ? 16 : '32px 20px',
                          textAlign:'center', background:'var(--g1)',
                          opacity: compressing ? .6 : 1 }}>

                          {compressing ? (
                            <div style={{ color:'var(--green)', fontWeight:600, fontSize:14 }}>
                              <div style={{ fontSize:28, marginBottom:8 }}>⏳</div>
                              {photoMsg}
                            </div>
                          ) : previews.length === 0 ? (
                            <>
                              <div style={{ fontSize:36, marginBottom:8 }}>📸</div>
                              <div style={{ fontSize:14, fontWeight:600, color:'var(--t1)', marginBottom:4 }}>
                                Clique pour ajouter des photos
                              </div>
                              <div style={{ fontSize:12, color:'var(--t3)' }}>
                                Hébergées sur Cloudinary — JPG ou PNG
                              </div>
                            </>
                          ) : (
                            <div>
                              <div style={{ display:'flex', flexWrap:'wrap', gap:8,
                                justifyContent:'center', marginBottom:8 }}>
                                {previews.map((url, i) => (
                                  <div key={i} style={{ position:'relative' }}>
                                    <img src={url} alt={`Photo ${i+1}`}
                                      style={{ width:80, height:80, objectFit:'cover',
                                        borderRadius:10, border:'2px solid var(--green)',
                                        display:'block' }}/>
                                    <button type="button"
                                      onClick={ev => { ev.preventDefault(); supprimerPhoto(i) }}
                                      style={{ position:'absolute', top:-6, right:-6,
                                        width:20, height:20, borderRadius:'50%',
                                        background:'var(--red)', color:'#fff', border:'none',
                                        cursor:'pointer', fontSize:11, fontWeight:700,
                                        display:'flex', alignItems:'center', justifyContent:'center' }}>
                                      ✕
                                    </button>
                                  </div>
                                ))}
                                {previews.length < 8 && (
                                  <div style={{ width:80, height:80, border:'2px dashed var(--g3)',
                                    borderRadius:10, display:'flex', alignItems:'center',
                                    justifyContent:'center', fontSize:24, color:'var(--t3)' }}>+</div>
                                )}
                              </div>
                              <div style={{ fontSize:12, color:'var(--green-d)', fontWeight:600 }}>
                                {photoMsg || `${previews.length} photo(s) prête(s)`}
                              </div>
                            </div>
                          )}
                        </div>
                      </label>
                    </div>

                    <div className="field-row" style={{ marginBottom:0 }}>
                      <div className="field">
                        <label className="field-label">Marque</label>
                        <input name="marque" className="field-input"
                          placeholder="Apple, Nike..." value={form.marque} onChange={handleChange}/>
                      </div>
                      <div className="field">
                        <label className="field-label">Couleur</label>
                        <input name="couleur" className="field-input"
                          placeholder="Noir, Blanc..." value={form.couleur} onChange={handleChange}/>
                      </div>
                    </div>

                    <div className="field">
                      <label className="field-label">Taille / Pointure</label>
                      <input name="taille" className="field-input"
                        placeholder="M, L, XL, 42..." value={form.taille} onChange={handleChange}/>
                    </div>

                    <label className="field" style={{ display:'flex', alignItems:'center',
                      gap:10, cursor:'pointer', marginBottom:20 }}>
                      <input type="checkbox" name="livraison" checked={form.livraison}
                        onChange={handleChange}
                        style={{ width:18, height:18, accentColor:'var(--green)', cursor:'pointer' }}/>
                      <div>
                        <div style={{ fontSize:14, fontWeight:600 }}>Livraison disponible</div>
                        <div style={{ fontSize:12, color:'var(--t3)', fontWeight:400 }}>
                          Je peux envoyer l'article
                        </div>
                      </div>
                    </label>

                    <div style={{ display:'flex', gap:12 }}>
                      <button type="button" className="btn btn-outline"
                        onClick={() => setEtape(1)} style={{ flex:1, padding:'13px' }}>
                        ← Retour
                      </button>
                      <button type="button" className="btn btn-green"
                        onClick={() => setEtape(3)}
                        style={{ flex:2, padding:'13px', fontSize:15 }}>
                        Continuer →
                      </button>
                    </div>
                  </div>
                )}

                {/* ─── ÉTAPE 3 — Publication ─── */}
                {etape === 3 && (
                  <div className="card" style={{ padding:24 }}>
                    <h2 style={{ fontSize:17, fontWeight:700, marginBottom:20 }}>
                      Localisation et publication
                    </h2>

                    <div className="field">
                      <label className="field-label">Ville *</label>
                      <select name="ville" className="field-select"
                        value={form.ville} onChange={handleChange}>
                        {VILLES.map(v => <option key={v}>{v}</option>)}
                      </select>
                    </div>

                    {/* Récap */}
                    <div style={{ background:'var(--g1)', border:'1px solid var(--g2)',
                      borderRadius:14, padding:16, marginBottom:20 }}>
                      <div style={{ fontSize:12, fontWeight:700, color:'var(--t3)',
                        textTransform:'uppercase', letterSpacing:'.5px', marginBottom:10 }}>
                        Récapitulatif
                      </div>
                      {[
                        ['Titre',      form.titre || '—'],
                        ['Catégorie',  form.categorie],
                        ['État',       {neuf:'Neuf',bon:'Bon état',usage:'Usagé'}[form.etat]],
                        ['Prix',       donMode ? '🤲 Gratuit (DON)' : (form.prix ? Number(form.prix).toLocaleString('fr-FR')+' GNF' : '—')],
                        ['Photos',     previews.length > 0 ? `${previews.length} photo(s) Cloudinary` : 'Aucune'],
                        ['Ville',      form.ville],
                        ['Livraison',  form.livraison ? 'Oui' : 'Non'],
                      ].map(([label, val]) => (
                        <div key={label} style={{ display:'flex', justifyContent:'space-between',
                          fontSize:13, paddingBottom:7, marginBottom:7,
                          borderBottom:'1px solid var(--g2)' }}>
                          <span style={{ color:'var(--t3)' }}>{label}</span>
                          <span style={{ fontWeight:600, color:'var(--t1)', textAlign:'right',
                            maxWidth:'60%', overflow:'hidden', textOverflow:'ellipsis',
                            whiteSpace:'nowrap' }}>{val}</span>
                        </div>
                      ))}
                    </div>

                    {/* Barre progression upload */}
                    {loading && blobs.length > 0 && progress > 0 && (
                      <div style={{ marginBottom:16 }}>
                        <div style={{ fontSize:13, color:'var(--green-d)', fontWeight:600, marginBottom:6 }}>
                          {photoMsg || 'Upload Cloudinary...'}
                        </div>
                        <div style={{ background:'var(--g2)', borderRadius:6, height:8, overflow:'hidden' }}>
                          <div style={{ height:'100%', background:'var(--green)',
                            width: progress+'%', transition:'.3s', borderRadius:6 }}/>
                        </div>
                        <div style={{ fontSize:11, color:'var(--t3)', marginTop:4 }}>{progress}%</div>
                      </div>
                    )}

                    <div style={{ display:'flex', gap:12 }}>
                      <button type="button" className="btn btn-outline"
                        onClick={() => setEtape(2)} style={{ flex:1, padding:'13px' }}>
                        ← Retour
                      </button>
                      <button type="submit" className="btn btn-green"
                        disabled={loading || compressing}
                        style={{ flex:2, padding:'13px', fontSize:15,
                          background: donMode ? 'var(--green-d)' : 'var(--green)' }}>
                        {loading
                          ? <><span className="spinner"/>&nbsp;Publication...</>
                          : donMode ? '🤲 Publier le DON' : "✅ Publier l'annonce"
                        }
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </div>

            {/* ── Sidebar conseils ── */}
            <div style={{ position:'sticky', top:90 }}>
              <div className="card" style={{ padding:20, marginBottom:16 }}>
                <div style={{ fontWeight:700, fontSize:15, marginBottom:14 }}>
                  💡 Conseils pour vendre vite
                </div>
                {[
                  {ico:'📸', t:'Bonne photo = +3x de contacts', s:'Fond clair, bonne lumière'},
                  {ico:'💰', t:'Prix juste = vente rapide',     s:'Regarde les prix similaires'},
                  {ico:'📝', t:'Description détaillée',         s:'État, taille, défauts'},
                  {ico:'📍', t:'Précise ta localisation',       s:'Les acheteurs filtrent par quartier'},
                ].map(c => (
                  <div key={c.t} style={{ display:'flex', gap:10, marginBottom:12 }}>
                    <span style={{ fontSize:20, flexShrink:0 }}>{c.ico}</span>
                    <div>
                      <div style={{ fontSize:13, fontWeight:600 }}>{c.t}</div>
                      <div style={{ fontSize:12, color:'var(--t3)', marginTop:2 }}>{c.s}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Info Cloudinary */}
              <div style={{ background:'var(--green-l)', border:'1px solid var(--green-m)',
                borderRadius:14, padding:16, marginBottom:16 }}>
                <div style={{ fontWeight:700, fontSize:14, color:'var(--green-d)', marginBottom:8 }}>
                  📸 Hébergement Cloudinary
                </div>
                <div style={{ fontSize:13, color:'var(--green-d)', lineHeight:1.6, opacity:.85 }}>
                  Tes photos sont stockées sur Cloudinary — 25 Go gratuits, accès rapide.
                </div>
              </div>

              <div style={{ background:'var(--green-l)', border:'1px solid var(--green-m)',
                borderRadius:14, padding:16 }}>
                <div style={{ fontWeight:700, fontSize:14, color:'var(--green-d)', marginBottom:8 }}>
                  🤲 Le système DON DEALOO
                </div>
                <div style={{ fontSize:13, color:'var(--green-d)', lineHeight:1.6, opacity:.85 }}>
                  Tu ne l'utilises plus ? Active le DON pour l'offrir gratuitement !
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>

      <Footer />

      <style>{`
        @media (max-width: 900px) {
          .pub-grid { grid-template-columns: 1fr !important; }
          .pub-grid > div:last-child { position: static !important; }
        }
      `}</style>
    </>
  )
}
