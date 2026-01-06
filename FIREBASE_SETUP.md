# Firebase Setup Guide

## 1. Backend - Firebase Admin SDK

### Obtenir les credentials :
1. Aller sur [Firebase Console](https://console.firebase.google.com)
2. Sélectionner votre projet "casual-coach"
3. Aller dans **Project Settings** (⚙️) > **Service Accounts**
4. Cliquer sur **Generate New Private Key**
5. Télécharger le fichier JSON

### Configurer les variables d'environnement :
Dans `Backend/.env`, ajouter :
```env
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@casual-coach.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

**Important :** Remplacer les `\n` par de vrais retours à la ligne dans le fichier .env

## 2. Frontend - Firebase Authentication

### Installer les dépendances :
```bash
cd Frontend
npm install firebase @react-native-async-storage/async-storage
```

### Configuration déjà faite :
- ✅ `config/firebase.config.ts` créé
- ✅ `services/authService.ts` créé

## 3. Firestore Database

### Activer Firestore :
1. Dans Firebase Console > **Build** > **Firestore Database**
2. Cliquer sur **Create Database**
3. Choisir **Start in production mode**
4. Sélectionner une région proche (ex: europe-west1)

### Configurer les règles de sécurité :
Dans Firestore > **Rules**, copier :
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 4. Activer Authentication

1. Dans Firebase Console > **Build** > **Authentication**
2. Cliquer sur **Get Started**
3. Activer **Email/Password** dans l'onglet **Sign-in method**

## 5. Tester la configuration

### Backend :
```bash
cd Backend
npm install firebase-admin
npm run dev
```

### Frontend :
```bash
cd Frontend
npm start
```

## Structure Firestore

```
users (collection)
  └── {firebaseUid}
      ├── email: string
      ├── createdAt: timestamp
      ├── updatedAt: timestamp
      └── strava: {
            accessToken: string
            refreshToken: string
            expiresAt: number
          }
```

## Migration

Le système actuel avec `userId` aléatoire sera remplacé par le Firebase UID.

**Avantages :**
- ✅ Authentification sécurisée
- ✅ Multi-device automatique
- ✅ Tokens persistés dans Firestore
- ✅ Règles de sécurité
