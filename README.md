# AI Coach

Application mobile de coaching sportif avec intégration Strava.

## Structure du projet

- `Backend/` - API Node.js/Express/TypeScript
- `Frontend/` - Application React Native/Expo

## Configuration

### Backend

1. Installer les dépendances:
```bash
cd Backend
npm install
```

2. Configurer les variables d'environnement:
```bash
cp .env.example .env
# Éditer .env avec vos credentials Strava
```

3. Démarrer le serveur de développement:
```bash
npm run dev
```

Le backend sera accessible sur `http://localhost:3000`

### Frontend

1. Installer les dépendances:
```bash
cd Frontend
npm install
```

2. **Important pour Expo Go**: Configurer l'adresse IP du backend

Éditer `Frontend/config/api.config.ts` et remplacer `localhost` par l'adresse IP locale de votre machine:
```typescript
BASE_URL: 'http://192.168.1.78:3000/api/v1'  // Remplacer par votre IP
```

Pour trouver votre IP:
```bash
ipconfig  # Windows
# Chercher "Adresse IPv4" dans la section Wi-Fi
```

3. Démarrer l'application:
```bash
npm start
```

## Intégration Strava

L'intégration Strava a été migrée vers une architecture backend/frontend sécurisée. Voir [MIGRATION_STRAVA.md](MIGRATION_STRAVA.md) pour plus de détails.

### Configuration Strava

1. Les credentials Strava (CLIENT_ID et CLIENT_SECRET) doivent être configurés dans `Backend/.env`
2. Le frontend récupère la configuration depuis le backend
3. Les tokens d'accès sont stockés côté serveur pour plus de sécurité

## Démarrage rapide

1. Configurer le backend avec vos credentials Strava dans `Backend/.env`
2. Configurer l'adresse IP dans `Frontend/config/api.config.ts`
3. Démarrer le backend: `cd Backend && npm run dev`
4. Démarrer le frontend: `cd Frontend && npm start`
5. Scanner le QR code avec l'application Expo Go

**Note**: Votre téléphone et votre PC doivent être sur le même réseau WiFi.

## Troubleshooting

Si l'application ne peut pas se connecter au backend:
1. Vérifier que le backend est bien démarré
2. Vérifier que l'adresse IP est correcte dans `api.config.ts`
3. Vérifier le pare-feu Windows (autoriser le port 3000)
4. Tester l'accès: ouvrir `http://192.168.1.78:3000/api/v1/health` dans un navigateur

Voir [test-connection.md](test-connection.md) pour un guide détaillé.

## Documentation

- [Migration Strava](MIGRATION_STRAVA.md) - Détails sur l'architecture de sécurité Strava
- [Test de connexion](test-connection.md) - Guide pour connecter Expo Go au backend
- [Dépannage](TROUBLESHOOTING.md) - Solutions aux erreurs courantes

## Build

### Build Android avec EAS
```bash
cd Frontend
eas build --profile preview --platform android
