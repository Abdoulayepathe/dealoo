import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth'
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from './config'

// ═══════════════════════════════════════════════════
// INSCRIPTION PAR EMAIL + MOT DE PASSE
// ═══════════════════════════════════════════════════
export async function inscrireEmail({ prenom, nom, email, telephone, ville, typeCompte, motDePasse }) {
  const { user } = await createUserWithEmailAndPassword(auth, email, motDePasse)
  await updateProfile(user, { displayName: `${prenom} ${nom}` })

  await setDoc(doc(db, 'utilisateurs', user.uid), {
    prenom,
    nom,
    email,
    telephone,
    whatsapp:         telephone,
    ville,
    role:             'utilisateur',
    type_compte:      typeCompte || 'acheteur',
    photo:            '',
    note:             0,
    nb_ventes:        0,
    nb_dons:          0,
    date_inscription: serverTimestamp(),
    est_verifie:      false,
  })

  return user
}

// ═══════════════════════════════════════════════════
// CONNEXION PAR EMAIL + MOT DE PASSE
// ═══════════════════════════════════════════════════
export async function connecterEmail({ email, motDePasse }) {
  const { user } = await signInWithEmailAndPassword(auth, email, motDePasse)
  return user
}

// ═══════════════════════════════════════════════════
// DÉCONNEXION
// ═══════════════════════════════════════════════════
export function deconnecter() {
  return signOut(auth)
}

// ═══════════════════════════════════════════════════
// OBSERVER L'ÉTAT DE CONNEXION
// ═══════════════════════════════════════════════════
export function observerAuth(callback) {
  return onAuthStateChanged(auth, callback)
}

// ═══════════════════════════════════════════════════
// RÉCUPÉRER LE PROFIL FIRESTORE
// ═══════════════════════════════════════════════════
export async function getProfil(uid) {
  const snap = await getDoc(doc(db, 'utilisateurs', uid))
  return snap.exists() ? snap.data() : null
}

// ═══════════════════════════════════════════════════
// DÉFINIR LE RÔLE D'UN UTILISATEUR (Super Admin only)
// ═══════════════════════════════════════════════════
export async function setUserRole(uid, role) {
  await updateDoc(doc(db, 'utilisateurs', uid), { role })
}
