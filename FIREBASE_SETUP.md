# Configurer Firebase Storage — DEALOO

## Le problème : Upload bloqué à 0%

Firebase Storage bloque les uploads si les **règles de sécurité** ne sont pas configurées.

---

## Solution 1 — Régler dans la console (rapide)

### Étape 1 — Activer Storage
1. Va sur https://console.firebase.google.com/project/dealoo-ac91d/storage
2. Si pas encore activé → clique **"Commencer"** → Mode test → **Créer**

### Étape 2 — Modifier les règles Storage
1. Dans Storage → onglet **"Règles"**
2. **Remplace tout** par ce code :

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /annonces/{annonceId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

3. Clique **"Publier"**

### Étape 3 — Modifier les règles Firestore
1. Dans Firestore → onglet **"Règles"**
2. **Remplace tout** par :

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
    match /annonces/{id} {
      allow read: if true;
    }
  }
}
```

3. Clique **"Publier"**

---

## Solution 2 — Mode test complet (développement uniquement)

Si tu veux tout ouvrir pour le développement :

**Storage :**
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

**Firestore :**
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

⚠️ **Attention** : le mode test complet doit être sécurisé avant la mise en production.

---

## Vérifier que Storage est bien activé

Dans la console Firebase, vérifie que :
- ✅ `dealoo-ac91d.firebasestorage.app` apparaît dans Storage
- ✅ L'onglet "Règles" montre les règles que tu as mises
- ✅ L'onglet "Fichiers" est vide (mais accessible)
