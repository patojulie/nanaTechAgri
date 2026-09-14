# ❓ FAQ - Questions Fréquentes

## 🚀 Démarrage

### Q: Erreur "Cannot find module '@nestjs/common'"
**A:** Les dépendances ne sont pas installées.
```bash
npm install
npm run prisma:generate
```

### Q: "Port 3000 already in use"
**A:** Changer le port dans `.env` ou tuer le processus:
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :3000
kill -9 <PID>

# Ou changer le port dans le .env
PORT=3001
```

### Q: "Cannot connect to database"
**A:** Vérifier la chaîne `DATABASE_URL`:
```bash
# Option 1: Vérifier PostgreSQL est running
docker-compose ps

# Option 2: Vérifier credentials dans .env
echo $DATABASE_URL

# Option 3: Tester la connexion
psql "postgresql://user:pass@localhost:5432/agri_db"
```

### Q: "Prisma migration failed"
**A:** Réinitialiser la BD (dev uniquement!):
```bash
# ATTENTION: Cela réinitialise tout!
npm run db:reset

# Ou manual:
psql -c "DROP DATABASE agri_db;"
npm run db:push
npm run prisma:seed
```

---

## 🔐 Authentification

### Q: Comment tester les endpoints avec authentication?
**A:** Récupérer un token d'abord:
```bash
# Récupérer token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@agri.local","password":"Admin123!"}'

# Réponse:
# {"accessToken":"eyJhbGc...", "refreshToken":"eyJhbGc..."}

# Utiliser le token
curl http://localhost:3000/api/users \
  -H "Authorization: Bearer eyJhbGc..."
```

### Q: Token expiré, comment le renouveler?
**A:** Utiliser l'endpoint `/auth/refresh`:
```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"eyJhbGc..."}'
```

### Q: Comment obtenir un token offline pour agent?
**A:** Via l'endpoint `/agents/offline-token` avec access token agent:
```bash
curl -X POST http://localhost:3000/api/agents/offline-token \
  -H "Authorization: Bearer <accessToken>"
```

### Q: Permissions insuffisantes (403), pourquoi?
**A:** Vérifier le rôle de l'utilisateur connecté:
```bash
# Récupérer le profil utilisateur
curl http://localhost:3000/api/users/me \
  -H "Authorization: Bearer <token>"

# Vérifier le rôle (ADMIN, PRODUCTEUR, AGENT, etc.)
# Vérifier l'endpoint require le rôle (@Roles decorator)
```

---

## 🗄️ Base de Données

### Q: Comment explorer la BD?
**A:** Utiliser Prisma Studio:
```bash
npm run prisma:studio
# ➜  http://localhost:5555
```

### Q: Ajouter une migration?
**A:**
```bash
# Éditer schema.prisma
# Puis créer migration:
npm run prisma:migrate "description de la migration"

# Vérifier la migration:
ls prisma/migrations/
```

### Q: Données de test?
**A:** Seed script peuple la BD:
```bash
npm run prisma:seed

# Comptes test créés:
# admin@agri.local / Admin123!
# producteur1@agri.local / Prod123!
# agent1@agri.local / Agent123!
# ...
```

### Q: Comment chiffrer données sensibles (pieceIdentification)?
**A:** À implémenter - voir ADR-002 pour le plan.
Pour MVP, utiliser Prisma middleware:
```typescript
// Add to PrismaService
this.prisma.$use(async (params, next) => {
  if (params.model === 'Producteur' && params.action === 'findUnique') {
    const result = await next(params);
    if (result?.pieceIdentification) {
      result.pieceIdentification = decrypt(result.pieceIdentification);
    }
    return result;
  }
  return next(params);
});
```

---

## 🔄 Synchronisation Offline

### Q: Comment synchroniser des données hors-ligne?
**A:** Via l'endpoint `/api/sync/batch`:
```bash
curl -X POST http://localhost:3000/api/sync/batch \
  -H "Authorization: Bearer <offlineToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "idClientGenere": "550e8400-e29b-41d4-a716-446655440000",
    "dateCreationClient": "2024-01-15T10:30:00Z",
    "operations": [
      {
        "operation": "CREATE",
        "entity": "PRODUCTEUR",
        "id": "prod-123",
        "timestamp": "2024-01-15T10:00:00Z",
        "data": { "nom": "Dupont", "region": "Kayes" }
      }
    ]
  }'
```

### Q: Batch rejected - pourquoi?
**A:** Possibles raisons:
1. **idClientGenere non-unique**: Déjà utilisé
2. **Operation invalide**: Utiliser CREATE/UPDATE/DELETE
3. **Entity non supportée**: Vérifier entity name (case-sensitive: PRODUCTEUR, EXPLOITATION, etc.)
4. **Data invalide**: Vérifier validation métier
5. **Timestamp futur**: Ne pas utiliser timestamp trop éloigné du serveur

### Q: Batch échoué, comment retry?
**A:**
```bash
# 1. Lister les syncs échoués
curl http://localhost:3000/api/sync/failed \
  -H "Authorization: Bearer <token>"

# 2. Rejouer un batch échoué
curl -X POST http://localhost:3000/api/sync/:journalId/retry \
  -H "Authorization: Bearer <token>"
```

### Q: Conflit de données (deux agents modifient même record)?
**A:** Stratégie Last-Write-Wins (LWW):
- Utilisateur A: Modifie produit à 10:00
- Utilisateur B: Modifie produit à 10:15
- Résultat: Modifications de B gagnent (timestamp plus récent)

Voir [ADR-003](docs/ADRs.md#adr-003-last-write-wins-lww-pour-synchronisation-offline) pour détails.

---

## 🧪 Tests

### Q: Lancer les tests?
**A:**
```bash
npm test                # Une fois
npm run test:watch    # Watch mode
npm run test:cov      # Couverture
```

### Q: Ajouter des tests?
**A:** Voir [MODULES_GUIDE.md](MODULES_GUIDE.md#5-sects---tests-unitaires) pour template.
```bash
# Template test
export class MyService.spec.ts:
describe('MyService', () => {
  let service: MyService;
  
  beforeEach(async () => { ... });
  
  it('should do something', () => { ... });
});
```

### Q: Test échoue, comment debugger?
**A:**
```bash
# Mode watch avec logs détaillés
npm run test:watch -- --verbose

# Ou debugger VSCode (voir CONTRIBUTING.md)
```

---

## 📦 Déploiement

### Q: Déployer en production?
**A:** Voir la section Déploiement dans [README.md](README.md#-déploiement).

### Q: Créer image Docker?
**A:**
```bash
# Build
docker build -t agri-backend:latest .

# Lancer localement
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e JWT_SECRET="..." \
  agri-backend:latest

# Ou via docker-compose
docker-compose up
```

### Q: Configurer Kubernetes?
**A:** Health checks sont déjà configurés (liveness/readiness).
À faire: Créer manifests K8s (deployment.yaml, service.yaml, etc.)

---

## 🐛 Debugging

### Q: Comment voir les logs?
**A:** Les logs vont dans console (stdout):
```bash
npm run start:dev
# [Nest] 12345 - 2024-01-15T10:30:00Z [NestFactory] Nest application successfully started +123ms
```

Pour logs persistants:
```bash
npm run start:dev > app.log 2>&1
tail -f app.log
```

### Q: Debugger avec VSCode?
**A:** Voir [CONTRIBUTING.md - Déboguer](CONTRIBUTING.md#-déboguer).

### Q: Voir les requêtes/réponses HTTP?
**A:** Logging interceptor est actif. Voir LoggingInterceptor.

Ou utiliser Postman/Insomnia pour inspecter requêtes.

---

## 📖 Documentation

### Q: Où trouver la doc API?
**A:** Swagger/OpenAPI sur `http://localhost:3000/api/docs`.

### Q: Ajouter une route à la doc?
**A:** Utiliser les decorateurs Swagger:
```typescript
@ApiOperation({ summary: 'Description courte' })
@ApiResponse({ type: MyResponseDto })
@ApiParam({ name: 'id', description: 'ID entité' })
@Get(':id')
async findById(@Param('id') id: string): Promise<MyResponseDto> {
  // ...
}
```

### Q: Documenter un nouveau module?
**A:** Voir [MODULES_GUIDE.md](MODULES_GUIDE.md) pour template.

---

## 🔧 Configuration

### Q: Changer configuration (port, BD, etc.)?
**A:** Éditer `.env`:
```bash
# Copier template
cp .env.example .env

# Éditer
nano .env
# NODE_ENV=development
# PORT=3001
# DATABASE_URL="postgresql://..."
# JWT_SECRET="dev_secret"
```

### Q: Où sont définies les variables?
**A:** Deux endroits:
1. `.env` - Fichier local (git-ignored)
2. `src/config/env.validation.ts` - Validation avec Joi

### Q: Valider les variables d'environnement?
**A:**
```bash
# Sera validé au démarrage
npm run start:dev
# Si erreur: Error: Missing required env variable...
```

---

## 📚 Architecture

### Q: Quel est le diagramme architecture?
**A:** Voir [README.md - Architecture](README.md#-architecture-des-modules).

Monolithe modulaire NestJS:
```
┌─────────────────────────────────────────┐
│         Frontend (Mobile/Web)            │
└─────────────────────────────────────────┘
              │   HTTP/REST   │
┌─────────────────────────────────────────┐
│      NestJS Backend (Monolithe)         │
├─────────────────────────────────────────┤
│ ┌─auth──┐ ┌─users───┐ ┌─producteurs─┐ │
│ │ JWT   │ │ CRUD    │ │ Profiles    │ │
│ │ RBAC  │ │ Gestion │ │ Validation  │ │
│ └───────┘ └─────────┘ └─────────────┘ │
├─────────────────────────────────────────┤
│ ┌─exploitations─┐ ┌─annonces──────┐   │
│ │ Fermes        │ │ Marketplace   │   │
│ │ Cultures      │ │ Mises en rel. │   │
│ └───────────────┘ └───────────────┘   │
├─────────────────────────────────────────┤
│ ┌─sync ★ OFFLINE ★─────────────────┐  │
│ │ Idempotence via UUID client      │  │
│ │ Last-Write-Wins (LWW)            │  │
│ │ JournalSynchronisation           │  │
│ └──────────────────────────────────┘  │
├─────────────────────────────────────────┤
│ ┌──Database──┐ ┌──Redis───┐           │
│ │ Prisma ORM │ │ Queue    │           │
│ │ PostgreSQL │ │ Cache    │           │
│ └────────────┘ └──────────┘           │
└─────────────────────────────────────────┘
```

### Q: Pourquoi monolithe vs microservices?
**A:** Voir [ADR-001](docs/ADRs.md#adr-001-monolithe-modulaire-vs-microservices).
TL;DR: Complexité opérationnelle trop élevée pour MVP.

### Q: Peut-on extraire en microservices?
**A:** Oui! Architecture modulaire NestJS le permet:
- Chaque module peut devenir un microservice
- Modules faiblement couplés (via interfaces)
- Voir NestJS microservices docs

---

## 🆘 Problèmes Courants

### Q: "Cannot find module" après merge
**A:** Dépendances changées, réinstaller:
```bash
npm install
npm run prisma:generate
```

### Q: Tests fail aléatoirement
**A:** Possiblement timeout BD. Augmenter:
```typescript
jest.setTimeout(30000); // ms
```

### Q: Performance lente
**A:**
1. Vérifier les logs de requête (query times)
2. Utiliser `npm run prisma:studio` pour explorer
3. Ajouter indexes BD
4. Utiliser select/include Prisma (voir docs)

### Q: Erreurs lors du build
**A:**
```bash
npm run typecheck  # Voir erreurs TypeScript
npm run lint       # Voir erreurs linting
npm run build      # Voir erreurs compilation
```

---

## 🤝 Contribution

### Q: Comment contribuer?
**A:** Voir [CONTRIBUTING.md](CONTRIBUTING.md).

### Q: Comment faire une PR?
**A:**
1. Créer branche: `git checkout -b feature/mon-feature`
2. Faire changements
3. Tests: `npm run test`
4. Lint: `npm run lint`
5. Commit: `git commit -m "feat: description"`
6. Push & PR

### Q: Comment ajouter un nouveau module?
**A:** Voir [MODULES_GUIDE.md](MODULES_GUIDE.md) pour template complet.

---

## 📞 Plus de Questions?

- Lire la documentation: [README.md](README.md), [CONTRIBUTING.md](CONTRIBUTING.md), [ADRs.md](docs/ADRs.md)
- Consulter NestJS docs: https://docs.nestjs.com
- Consulter Prisma docs: https://www.prisma.io/docs
- Créer une issue sur GitHub

---

**Dernière mise à jour:** 2024-01-15
