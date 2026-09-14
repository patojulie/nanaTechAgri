# AGRI Intelligent Platform - Backend API

API backend monolithique modulaire pour la plateforme agricole intelligente. Architecture basée sur **NestJS**, conçue pour supporter les 5 acteurs métier (Producteur, Agent, Coopérative, Acheteur, Administrateur) avec capacités offline pour les agents de terrain.

## 🚀 Quick Start

### Prérequis
- Node.js 18+
- PostgreSQL 14+
- Redis 6+

### Installation

```bash
# Cloner et installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env

# Générer le client Prisma
npm run prisma:generate

# Créer la base de données et appliquer les migrations
npm run db:push

# (Optionnel) Peupler la BD avec des données de test
npm run prisma:seed

# Démarrer l'application
npm run start:dev
```

L'API est disponible sur `http://localhost:3000/api`
Documentation Swagger: `http://localhost:3000/api/docs`

### Configuration PostgreSQL (Développement)

```bash
# Créer une base de données PostgreSQL
createdb agri_db

# Configuration .env minimale
DATABASE_URL="postgresql://postgres:password@localhost:5432/agri_db"
```

## 📁 Architecture des modules

```
src/
├── auth/              # JWT, refresh tokens, guards RBAC
├── users/             # Gestion utilisateurs (base commune)
├── producteurs/       # Producteurs, création de profil
├── exploitations/     # Exploitations + ActivitéExploitation
├── annonces/          # Marketplace (CRUD annonces)
├── agents/            # Agents de terrain + tokens offline
├── sync/              # Synchronisation offline (idempotence, LWW)
├── cooperatives/      # Coopératives, validation, TableauDeBord
├── acheteurs/         # Acheteurs, MiseEnRelation
├── admin/             # Gestion rôles, utilisateurs, audit
├── notifications/     # Multicanal: SMS, USSD, vocal, push
├── export/            # Export données (CSV, Excel, PDF)
├── health/            # Health checks, probes K8s
├── database/          # Prisma service, migrations
├── common/            # Guards, interceptors, filters, pipes
├── config/            # Variables d'environnement (Joi)
└── main.ts            # Entrypoint
```

## 🔐 Sécurité

### Authentification
- **Access Token (JWT)**: Courte durée (~15 min), renouvellement via refresh token
- **Refresh Token**: Longue durée (7 jours), rotation à chaque utilisation
- **Token Agent Offline**: Longue durée (30 jours) avec révocation serveur possible

```typescript
// Exemple d'utilisation
const { accessToken, refreshToken } = await authService.login(email, password);
// Utiliser accessToken pour les requêtes: Authorization: Bearer <accessToken>
```

### Autorisation (RBAC)
Cinq rôles avec permissions distinct:
- **PRODUCTEUR**: Crée/gère ses exploitations, annonces
- **AGENT**: Enregistre producteurs, synchronise données (offline)
- **COOPERATIVE**: Valide fiches producteurs/annonces, supervision
- **ACHETEUR**: Consulte annonces, crée relations commerciales
- **ADMIN**: Gestion complète (utilisateurs, rôles, audit, configurations)

```typescript
// Utiliser le décorateur @Roles pour protéger les endpoints
@Roles(Role.PRODUCTEUR, Role.AGENT)
@UseGuards(RolesGuard)
@Post('...')
```

### Validation
- **Input validation**: class-validator + class-transformer sur tous les DTO
- **Global ValidationPipe**: whitelist, forbidNonWhitelisted
- **Données sensibles**: `pieceIdentification` chiffrée au repos (à configurer avec crypto)

### Rate Limiting
Throttler configuré par défaut: 10 requêtes/60s
- Particulièrement important pour SMS/USSD/vocal (endpoints exposés)

## 🔄 Synchronisation Offline (Agent de terrain)

Le module `sync/` implémente une synchronisation robuste pour les agents travaillant sans connexion:

### Idempotence
Chaque batch porte un **UUID unique** (`idClientGenere`) généré côté client. Rejouer le même batch retourne le même résultat sans duplication.

```typescript
// Exemple: Synchroniser un batch
const batch: SyncBatchDto = {
  idClientGenere: '550e8400-e29b-41d4-a716-446655440000', // UUID unique
  dateCreationClient: '2024-01-15T10:30:00Z',
  operations: [
    {
      operation: 'CREATE',
      entity: 'PRODUCTEUR',
      id: 'prod-123',
      timestamp: '2024-01-15T10:00:00Z',
      data: { nom: 'Jean', prenom: 'Dupont', region: 'Kayes' }
    },
    {
      operation: 'UPDATE',
      entity: 'ANNONCE',
      id: 'ann-456',
      timestamp: '2024-01-15T10:15:00Z',
      data: { quantiteDisponible: 500 }
    }
  ]
};

const result = await fetch('/api/sync/batch', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${offlineToken}` },
  body: JSON.stringify(batch)
});
```

### Résolution de conflits
**Stratégie Last-Write-Wins (LWW)**: Si deux versions du même objet existent, garder celle avec le timestamp le plus récent. Historique conservé pour audit.

### Reprise sur erreur
- Endpoint `/sync/failed`: Liste les batches échoués
- Endpoint `/sync/:journalId/retry`: Rejoue un batch échoué
- `JournalSynchronisation`: Trace complète avec statuts (EN_ATTENTE, OK, ECHEC)

## 📧 Notifications Multicanal

Architecture en **adaptateurs** pour supporter plusieurs canaux:

```
NotificationProvider (interface)
├── SMSProvider (Twilio/Africa's Talking)
├── USSDProvider (Passerelle télécom)
├── VocalProvider (IVR)
├── PushProvider (Firebase, APNs)
└── EmailProvider
```

Tous les envois passent par une **file d'attente** (BullMQ + Redis) pour:
- Découpler l'API des appels sortants
- Gérer les retries automatiques
- Éviter de bloquer les requêtes HTTP

Configuration par canal dans `ConfigurationCanal`.

## 📊 Base de données (Prisma)

Schéma complet dans `prisma/schema.prisma` avec:
- Entités métier (Producteur, Exploitation, Annonce, etc.)
- Relations (1:*, *:*, etc.) reflétant vos diagrammes UML
- Enums (Role, StatutAnnonce, CanalAcces, etc.)
- Audit trail (AuditLog) pour la traçabilité

### Migrations
```bash
# Créer une nouvelle migration
npm run prisma:migrate

# Visualiser le schéma
npm run prisma:studio

# Réinitialiser la BD (DEV uniquement)
npm run db:reset
```

## 🧪 Tests

```bash
# Tests unitaires (Jest)
npm run test

# Mode watch
npm run test:watch

# Couverture
npm run test:cov

# Tests e2e
npm run test:e2e
```

## 📝 Logs et Observabilité

### Logging structuré (Pino)
```typescript
this.logger.log('Message', 'Context');
this.logger.error('Erreur', error, 'Context');
```

### Interceptors
- `LoggingInterceptor`: Loggue automatiquement les requêtes HTTP avec durées
- Filtres d'exception globaux normalisant les réponses d'erreur

### Health Checks
```bash
curl http://localhost:3000/health
curl http://localhost:3000/health/live   # Liveness probe
curl http://localhost:3000/health/ready  # Readiness probe
```

## 🚢 Déploiement

### Docker
```bash
# Construire l'image
docker build -t agri-backend .

# Lancer le conteneur
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e JWT_SECRET="..." \
  agri-backend
```

### Kubernetes (future)
Health checks et probes configurés pour K8s. Migrations Prisma peuvent être appliquées automatiquement via init container.

### CI/CD
- Lint: `npm run lint`
- Tests: `npm run test`
- Build: `npm run build`
- Migrations: `npm run prisma:migrate:prod`

## 📚 Documentation API

- **Swagger/OpenAPI**: `http://localhost:3000/api/docs` (auto-généré)
- **Par module**: README dans chaque dossier module
- **ADRs**: Voir dossier `docs/adr/` pour les décisions architecturales

## 🤝 Contribution

1. Feature branch: `git checkout -b feature/feature-name`
2. Tests & Lint: `npm run test && npm run lint`
3. Pull request avec description

## 📝 License

MIT

---

## Contacts & Support

Pour les questions ou issues, contacter l'équipe AGRI.
