# DEALOO Web App — React + Firebase

## 🚀 Installation rapide

```bash
cd dealoo-web
npm install
cp .env.example .env   # remplis tes clés Firebase
npm run dev
```

Ouvre **http://localhost:5173**

---

## 🔥 Configuration Firebase (obligatoire)

### Étape 1 — Créer le projet Firebase

1. Va sur [console.firebase.google.com](https://console.firebase.google.com)
2. Clique **"Créer un projet"** → nomme-le `dealoo`
3. Désactive Google Analytics (optionnel)

### Étape 2 — Activer Authentication

1. Dans le menu : **Authentication → Commencer**
2. Onglet **"Sign-in method"** → active :
   - ✅ **Email/Mot de passe**
   - ✅ **Téléphone** (pour le SMS OTP)

### Étape 3 — Ajouter ton domaine (pour SMS)

Dans **Authentication → Paramètres → Domaines autorisés** :
- Ajoute `localhost` (déjà là par défaut)
- En production : ajoute ton domaine

### Étape 4 — Récupérer tes clés

1. ⚙️ **Paramètres du projet → Tes applications**
2. Clique sur l'icône `</>`  (Web)
3. Enregistre l'app → copie le `firebaseConfig`

### Étape 5 — Remplir le fichier .env

```env
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=dealoo-xxxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=dealoo-xxxx
VITE_FIREBASE_STORAGE_BUCKET=dealoo-xxxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123:web:abc
```

### Étape 6 — Activer Firestore

1. **Firestore Database → Créer une base de données**
2. Choisis **"Mode production"**
3. Région : `europe-west1` (recommandé)

---

## 📱 Comment fonctionne le SMS OTP

```
Utilisateur entre son numéro (ex: 620 000 000)
         ↓
Le code ajoute +224 automatiquement
         ↓
Firebase envoie un SMS réel au numéro
         ↓
Utilisateur entre le code à 6 chiffres
         ↓
Firebase vérifie → compte créé ✅
```

**Note :** Firebase offre **10 000 SMS gratuits/mois**

---

## 📁 Structure du projet

```
src/
├── firebase/
│   ├── config.js      ← Initialisation Firebase
│   └── auth.js        ← Toutes les fonctions auth (email + SMS)
├── context/
│   └── AuthContext.jsx ← État global de connexion
├── pages/
│   ├── Connexion.jsx   ← Login email/mdp
│   ├── Inscription.jsx ← Signup + SMS OTP
│   └── Accueil.jsx     ← Page principale
├── components/
│   ├── Navbar.jsx      ← Navigation responsive
│   └── Footer.jsx      ← Pied de page
└── styles/
    └── index.css       ← CSS global + variables
```

## 📋 Étapes du projet

- [x] ① Auth (email + SMS Firebase OTP)
- [x] ② Accueil (grille articles, filtres, recherche)
- [ ] ③ Fiche article + Publication
- [ ] ④ Chat + Notifications + Favoris
- [ ] ⑤ Profil + Portefeuille + Commandes
- [ ] ⑥ Mes Annonces + Paramètres
- [ ] ⑦ Panel Administrateur
- [ ] ⑧ Super Admin Panel
