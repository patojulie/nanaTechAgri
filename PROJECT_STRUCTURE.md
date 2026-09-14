# 📊 Structure Complète du Projet AGRI Backend

## Vue d'Ensemble

```
agri_backend/
├── 📄 package.json ..................... Dépendances + scripts npm
├── 📄 tsconfig.json .................... Config TypeScript
├── 📄 .env ............................ Variables d'environnement (dev)
├── 📄 .env.example .................... Template env
├── 📄 .gitignore ...................... Git configuration
├── 📄 .eslintrc.json .................. ESLint config
├── 📄 .prettierrc.json ................ Prettier config
├── 📄 .nest-cli.json .................. NestJS CLI config
├── 📄 jest.config.js .................. Tests Jest config
├── 📄 Dockerfile ...................... Image Docker
├── 📄 docker-compose.yml .............. Services (PostgreSQL, Redis)
│
├── 📄 README.md ....................... Quick start + architecture
├── 📄 CONTRIBUTING.md ................. Guide développeurs
├── 📄 IMPLEMENTATION_SUMMARY.md ....... Résumé implémentation
├── 📄 MODULES_GUIDE.md ................ Template créer modules
├── 📄 DEPENDENCIES.md ................. Dépendances expliquées
├── 📄 FAQ.md .......................... Questions fréquentes
├── 📄 PROJECT_STRUCTURE.md ............ Ce fichier (vous êtes ici!)
│
├── 📁 .github/
│   └── 📁 workflows/
│       └── 📄 ci-cd.yml .............. GitHub Actions pipeline
│
├── 📁 docs/
│   └── 📄 ADRs.md ..................... 8 Architecture Decision Records
│
├── 📁 prisma/
│   ├── 📄 schema.prisma ............... Schéma BD complet (22 entités)
│   └── 📄 seed.ts ..................... Données de test
│
└── 📁 src/
    ├── 📄 main.ts ..................... Entrypoint application
    ├── 📄 app.module.ts ............... Module racine (import 11 modules)
    ├── 📄 app.controller.ts ........... Health check /health
    ├── 📄 app.service.ts .............. Logique App
    │
    ├── 📁 auth/ ........................ AUTHENTIFICATION & SÉCURITÉ
    │   ├── 📄 auth.module.ts
    │   ├── 📄 auth.service.ts ........ JWT, login, register, refresh
    │   ├── 📄 auth.controller.ts ..... POST /auth/login, /register, /refresh
    │   ├── 📁 strategies/
    │   │   ├── 📄 jwt.strategy.ts
    │   │   └── 📄 refresh-token.strategy.ts
    │   ├── 📁 guards/
    │   │   ├── 📄 jwt-auth.guard.ts
    │   │   └── 📄 roles.guard.ts
    │   └── 📁 dto/
    │       └── 📄 auth.dto.ts
    │
    ├── 📁 users/ ....................... UTILISATEURS (base commune)
    │   ├── 📄 users.module.ts
    │   ├── 📄 users.service.ts ....... CRUD utilisateurs
    │   ├── 📄 users.controller.ts .... GET /users, /users/:id, PUT /users/:id
    │   └── 📁 dto/
    │       └── 📄 user.dto.ts
    │
    ├── 📁 producteurs/ ................. PRODUCTEURS AGRICOLES
    │   ├── 📄 producteurs.module.ts
    │   ├── 📄 producteurs.service.ts . Création profil, validation
    │   ├── 📄 producteurs.controller.ts POST /producteurs, GET, PUT, DELETE
    │   └── 📁 dto/
    │       └── 📄 productor.dto.ts
    │
    ├── 📁 exploitations/ ............... EXPLOITATIONS (FERMES)
    │   ├── 📄 exploitations.module.ts
    │   ├── 📄 exploitations.service.ts  CRUD exploitations + activités
    │   ├── 📄 exploitations.controller.ts POST, GET, PUT, DELETE /exploitations
    │   └── 📁 dto/
    │       └── 📄 farm.dto.ts
    │
    ├── 📁 annonces/ ................... MARKETPLACE
    │   ├── 📄 annonces.module.ts
    │   ├── 📄 annonces.service.ts .... Logique marketplace
    │   ├── 📄 annonces.controller.ts . CRUD annonces
    │   └── 📁 dto/
    │       └── 📄 announcement.dto.ts
    │
    ├── 📁 agents/ ★★★ AGENTS TERRAIN ★★★
    │   ├── 📄 agents.module.ts
    │   ├── 📄 agents.service.ts ...... Profil agents + offline tokens
    │   ├── 📄 agents.controller.ts ... POST /agents, offline-token
    │   └── 📁 dto/
    │       └── 📄 agent.dto.ts
    │
    ├── 📁 sync/ ★★★ OFFLINE SYNC ★★★ (ARCHITECTURE CLÉ!)
    │   ├── 📄 sync.module.ts
    │   ├── 📄 sync.service.ts ........ Idempotence + Last-Write-Wins (LWW)
    │   │                              UUID unique (idClientGenere)
    │   │                              JournalSynchronisation
    │   ├── 📄 sync.controller.ts ..... POST /sync/batch
    │   │                              GET /sync/failed
    │   │                              POST /sync/:journalId/retry
    │   └── 📁 dto/
    │       └── 📄 sync.dto.ts ........ SyncBatchDto, SyncOperationDto
    │
    ├── 📁 cooperatives/ ............... COOPÉRATIVES (STUB)
    │   └── 📄 cooperatives.module.ts
    │
    ├── 📁 acheteurs/ .................. ACHETEURS (STUB)
    │   └── 📄 acheteurs.module.ts
    │
    ├── 📁 admin/ ....................... ADMINISTRATION (STUB)
    │   └── 📄 admin.module.ts
    │
    ├── 📁 notifications/ .............. NOTIFICATIONS (STUB)
    │   └── 📄 notifications.module.ts
    │
    ├── 📁 export/ ..................... EXPORT DONNÉES (STUB)
    │   └── 📄 export.module.ts
    │
    ├── 📁 health/ ..................... HEALTH CHECKS
    │   ├── 📄 health.module.ts
    │   └── 📄 health.controller.ts .. GET /health, /health/live, /health/ready
    │
    ├── 📁 database/ ................... BASE DE DONNÉES
    │   ├── 📄 database.module.ts
    │   └── 📄 prisma.service.ts ..... Connexion BD + migrations
    │
    ├── 📁 config/ ..................... CONFIGURATION
    │   ├── 📄 config.module.ts
    │   ├── 📄 env.ts ................. Chargement .env
    │   └── 📄 env.validation.ts ..... Validation variables
    │
    └── 📁 common/ ..................... UTILITAIRES PARTAGÉS
        ├── 📄 common.module.ts
        ├── 📁 filters/
        │   └── 📄 http-exception.filter.ts
        ├── 📁 interceptors/
        │   └── 📄 logging.interceptor.ts
        ├── 📁 decorators/
        │   ├── 📄 roles.decorator.ts
        │   └── 📄 public.decorator.ts
        ├── 📁 guards/
        │   └── (auth guards partagés)
        └── 📁 logging/
            ├── 📄 logging.module.ts
            └── 📄 logger.service.ts
```

## 📊 Statistiques du Projet

| Métrique | Valeur |
|----------|--------|
| **Modules** | 11 (8 complets, 3 stubs) |
| **Services** | 8+ |
| **Controllers** | 8+ |
| **DTOs** | ~25 |
| **Fichiers Source** | ~50 |
| **Entités BD** | 22 (Prisma models) |
| **Routes API** | ~35 endpoints |
| **Tests** | À écrire (structure en place) |
| **Documentation** | 100% (README, ADRs, guides) |

## 🎯 Flux Données Principal

```
Frontend (Mobile/Web)
        ↓
   HTTP REST API
        ↓
┌─────────────────────┐
│   NestJS Backend    │
├─────────────────────┤
│  Auth Guard (JWT)   │
│  Roles Guard (RBAC) │
│  Validation Pipe    │
├─────────────────────┤
│  Controller Layer   │
│   (HTTP routes)     │
├─────────────────────┤
│  Service Layer      │
│  (business logic)   │
├─────────────────────┤
│  Repository Layer   │
│  (Prisma ORM)       │
├─────────────────────┤
│  PostgreSQL + Redis │
└─────────────────────┘
```

## 🔄 Flux Synchronisation Offline (CLÉS!)

```
Agent (Mode Offline)
   ↓
Collecte de données (pas de connexion)
   ↓
Accumule operations dans queue locale
   ↓
Regain de connexion
   ↓
Crée SyncBatch:
├─ idClientGenere: UUID unique (idempotence)
├─ dateCreationClient: Timestamp
└─ operations[]:
    ├─ operation: CREATE|UPDATE|DELETE
    ├─ entity: PRODUCTEUR|EXPLOITATION|ANNONCE|...
    ├─ id: entity ID
    ├─ timestamp: operation timestamp (LWW)
    └─ data: payload
   ↓
POST /api/sync/batch (avec offlineToken)
   ↓
Serveur vérifie idempotence:
├─ Si déjà traité: Retour résultat précédent
└─ Si nouveau: Traite chaque opération
   ↓
Last-Write-Wins (LWW):
├─ Cherche entité existante
├─ Compares timestamps
└─ Garde version la plus récente
   ↓
Crée JournalSynchronisation (trace complète):
├─ status: EN_ATTENTE → OK ou ECHEC
├─ nombreEnregistrements
└─ errorsDetails (si erreurs)
   ↓
Agent reçoit résultat:
├─ success: true|false
├─ journal: détails sync
└─ errorsDetails?: erreurs par operation
```

## 🔐 Flux Authentification

```
Utilisateur
   ↓
POST /auth/login (email, password)
   ↓
AuthService.login():
├─ Trouve utilisateur par email
├─ Hash & compare password (bcrypt)
├─ Génère JWT tokens:
│  ├─ accessToken (15 min, utilisé pour API)
│  └─ refreshToken (7 jours, pour renouvellement)
└─ Retourne { accessToken, refreshToken }
   ↓
Frontend stocke tokens
   ↓
Requête API:
┌─ Authorization: Bearer <accessToken>
   ↓
JwtAuthGuard:
├─ Extrait token du header
├─ Valide signature JWT
└─ Ajoute user au Req.user
   ↓
RolesGuard (si @Roles):
├─ Vérifie Req.user.role
└─ Compare vs @Roles decorator
   ↓
Route Handler
   ↓
Token expiré?
└─ POST /auth/refresh (refreshToken)
   └─ Retourne nouveau accessToken
```

## 📈 Croissance Modulaire

Phase 1 (MVP - Actuel):
- ✅ Auth, Users, Producteurs, Exploitations, Annonces
- ✅ Agents + Offline Sync (CLÉS!)
- ⏳ Cooperatives, Acheteurs, Admin, Notifications, Export (stubs)

Phase 2 (Post-MVP):
- [ ] Implémentation Cooperatives (validation, supervision)
- [ ] Implémentation Acheteurs (mises en relation)
- [ ] Notifications multicanal (SMS, USSD, vocal, push)
- [ ] Export (CSV, Excel, PDF)
- [ ] Admin dashboard

Phase 3 (Évolution):
- [ ] GraphQL en parallèle REST
- [ ] Mobile SDK
- [ ] Extracting microservices (si besoin)
- [ ] Advanced search (Elasticsearch)
- [ ] Real-time (WebSockets)

## 🚀 Démarrage Rapide

```bash
# 1. Setup
cd agri_backend
docker-compose up -d postgres redis
npm install && npm run prisma:generate

# 2. BD
npm run db:push && npm run prisma:seed

# 3. Dev
npm run start:dev

# 4. Documentation
# ➜ API: http://localhost:3000/api
# 📖 Swagger: http://localhost:3000/api/docs
# 🗂️  Studio: npm run prisma:studio
```

## 📚 Documentation Clés

1. **[README.md](README.md)** - Vue d'ensemble, quick start
2. **[CONTRIBUTING.md](CONTRIBUTING.md)** - Guide dev, setup, conventions
3. **[docs/ADRs.md](docs/ADRs.md)** - 8 Architecture Decision Records
4. **[MODULES_GUIDE.md](MODULES_GUIDE.md)** - Template création modules
5. **[FAQ.md](FAQ.md)** - Questions fréquentes
6. **[DEPENDENCIES.md](DEPENDENCIES.md)** - Dépendances détaillées
7. **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - Résumé final

## ✅ Points Clés à Retenir

1. **Monolithe Modulaire**: NestJS permet extraction future en microservices
2. **Sécurité**: JWT + RBAC + validation systématique
3. **Offline Sync**: Idempotence via UUID client + Last-Write-Wins
4. **Architecture**: Controllers → Services → Prisma ORM
5. **Extensibilité**: Chaque module indépendant, réutilisable
6. **Documentation**: 100% doc pour onboarding dev
7. **CI/CD**: GitHub Actions pipeline ready
8. **Testing**: Structure en place, à écrire

## 🎓 Pour Commencer

1. Lire [README.md](README.md) (5 min)
2. Lire [CONTRIBUTING.md](CONTRIBUTING.md) (10 min)
3. Consulter [FAQ.md](FAQ.md) (5 min)
4. Setup local: `docker-compose up`, `npm install`, `npm run start:dev`
5. Tester API via Swagger (http://localhost:3000/api/docs)
6. Copier pattern d'un module existant (ex: producteurs/) pour nouveau module

---

**Vous êtes maintenant prêts à développer sur AGRI! 🚀**

Prochaines étapes:
- [ ] Implémenter modules stubs (cooperatives, acheteurs, admin)
- [ ] Écrire tests (coverage >80%)
- [ ] Notifications multicanal
- [ ] Performance tuning
- [ ] Production hardening
- [ ] GraphQL layer
- [ ] Mobile SDK

Pour questions: Voir [FAQ.md](FAQ.md) ou consulter les doc NestJS/Prisma.
