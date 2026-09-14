# 🎯 Prochaines Étapes - Guide d'Implémentation

Ce document détaille les tâches prioritaires pour continuer le développement post-MVP.

---

## 🔴 PRIORITÉ 1: Tests Unitaires (Blocage MVP)

**Objectif:** Atteindre >80% coverage avant production.

### Tâche 1.1: Tests Auth Module
**Fichier:** `src/auth/auth.service.spec.ts`
**Effort:** 4h
**Template:** Voir [MODULES_GUIDE.md#5-sects---tests-unitaires](MODULES_GUIDE.md#5-sects---tests-unitaires)

```bash
# 1. Copier template de MODULES_GUIDE.md
# 2. Adapter pour AuthService
# 3. Tester:
#    - register() avec validation email
#    - login() avec hash password
#    - refreshToken() avec rotation
#    - generateOfflineAgentToken()
# 4. Tests erreurs:
#    - Email déjà existant
#    - Password invalide
#    - Token expiré
npm test auth.service.spec.ts
```

### Tâche 1.2: Tests Users Module
**Fichier:** `src/users/users.service.spec.ts`
**Effort:** 3h

```bash
# Tests CRUD
# - findAll() avec pagination
# - findById() + 404
# - update() + validation
# - deactivate()
npm test users.service.spec.ts
```

### Tâche 1.3: Tests Sync Module (CRITIQUE!)
**Fichier:** `src/sync/sync.service.spec.ts`
**Effort:** 6h (complexe)

```bash
# CRITIQUES:
# - Idempotence: même batch UUID → même résultat
# - Last-Write-Wins: timestamp comparison
# - Error handling: batch with errors still processes others
# - Retry: failed sync can be retried

# Cas de test à couvrir:
# 1. New batch: process all operations
# 2. Duplicate batch: return cached result (IDEMPOTENCE!)
# 3. Mixed operations: CREATE + UPDATE + DELETE
# 4. Partial errors: some fail, others succeed
# 5. Conflict resolution: newer timestamp wins
# 6. Retry failed batch: new UUID, same data
```

### Tâche 1.4: Tests Autres Modules
**Fichier:** `src/*/**.service.spec.ts`
**Effort:** 10h
- Producteurs service
- Exploitations service + activities
- Annonces service
- Agents service

### Vérifier Couverture
```bash
npm run test:cov
# Target: >80% statements, branches, functions, lines
```

---

## 🟡 PRIORITÉ 2: Modules Stubs → Implémentation

### Tâche 2.1: Cooperatives Module
**Fichier:** `src/cooperatives/`
**Effort:** 8h
**Objectif:** Supervision et validation annonces

```typescript
// Services à implémenter:
CooperativesService:
- create() // Créer coopérative
- findAll() // Lister coopératives
- getMembers() // Producteurs membres
- validateAnnouncement() // Valider annonce producteur
- getValidationPending() // Annonces en attente validation

// Controllers:
POST /cooperatives // Créer
GET /cooperatives // Lister
GET /cooperatives/:id/members // Membres
POST /cooperatives/:id/announcements/:annId/validate // Valider
GET /cooperatives/:id/pending-validations // Queue validation
```

**Permissions:** COOPERATIVE role access only
**Schema:** Ajouter à prisma/schema.prisma si nécessaire

### Tâche 2.2: Acheteurs Module
**Fichier:** `src/acheteurs/`
**Effort:** 8h
**Objectif:** Marketplace buyer features

```typescript
// Services:
AcheteursService:
- searchAnnouncements() // Recherche + filters
- getAnnouncementDetail()
- createMiseEnRelation() // Demande mise en relation
- getMiseEnRelations() // Mes demandes
- updateMiseEnRelation() // Statut (ACCEPTE, REFUSE, REALISEE)

// Controllers:
GET /acheteurs/announcements/search // Search
GET /acheteurs/announcements/:id // Détails
POST /acheteurs/mises-en-relation // Créer demande
GET /acheteurs/mises-en-relation // Mes demandes
PUT /acheteurs/mises-en-relation/:id // Update
```

**Permissions:** ACHETEUR role access
**Relations:** Linking Annonce ↔ MiseEnRelation ↔ Acheteur

### Tâche 2.3: Admin Module
**Fichier:** `src/admin/`
**Effort:** 10h
**Objectif:** Administration système

```typescript
// Services:
AdminService:
- listUsers() // Tous utilisateurs
- getUserDetails()
- deactivateUser()
- listAuditLogs() // Voir trace actions
- getSystemStats() // Nombre users/annonces/syncs
- getFailedSyncs() // Batches échoués pour debug

// Controllers:
GET /admin/users // Tous users
GET /admin/users/:id
DELETE /admin/users/:id // Deactivate
GET /admin/audit-logs // Trace
GET /admin/audit-logs/filter // Filter by entity/user/date
GET /admin/stats // Dashboard
GET /admin/sync/failed // Failed syncs
```

**Permissions:** ADMIN only
**Audit:** Log tous les changements dans AuditLog

### Tâche 2.4: Export Module
**Fichier:** `src/export/`
**Effort:** 8h
**Objectif:** Export données

```typescript
// Services:
ExportService:
- exportAnnoncesCSV()
- exportAnnoncesExcel()
- exportAnnouncesPDF()
- exportProducteursCSV()
- etc.

// Controllers:
GET /export/annonces/csv
GET /export/annonces/excel
GET /export/annonces/pdf
GET /export/producteurs/csv
```

**Dépendances:** xlsx, pdfkit, csv libraries
**Permissions:** ADMIN ou own data

---

## 🟠 PRIORITÉ 3: Notifications Multicanal

**Fichier:** `src/notifications/`
**Effort:** 12h
**Objectif:** Envoyer SMS/USSD/vocal/push alerts

### Tâche 3.1: Architecture Setup
```typescript
// notifications.service.ts:
interface NotificationProvider {
  send(message: SendNotificationDto): Promise<SendResult>
}

// Providers:
- TwilioSMSProvider (SMS)
- AfricasTalkingUSSDProvider (USSD)
- VocalProvider (vocal calls)
- FirebasePushProvider (mobile push)

// Service pattern:
async sendNotification(target: string, message: string, channel: 'SMS'|'USSD'|'PUSH'|'VOCAL') {
  const provider = this.getProvider(channel)
  return provider.send({ target, message })
}
```

### Tâche 3.2: SMS Provider (Twilio)
```bash
npm install twilio

# Implementation:
- Twilio account setup
- TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN in .env
- Send SMS logic
- Delivery tracking
```

### Tâche 3.3: USSD Provider (Africa's Talking)
```bash
# Implementation:
- Africa's Talking account setup
- AT_USERNAME, AT_API_KEY in .env
- Send USSD logic
```

### Tâche 3.4: Queue Integration
```bash
npm install --save @nestjs/bull bull

# Use BullMQ for async delivery:
async sendAsync(dto: SendNotificationDto) {
  await this.notificationQueue.add('send', dto, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 }
  })
}
```

### Tâche 3.5: Controllers
```typescript
// Endpoints:
POST /notifications/send // Send
GET /notifications/history // Historique
GET /notifications/:id/status // Statut delivery
```

---

## 🔵 PRIORITÉ 4: Optimisations & Security

### Tâche 4.1: Données Sensibles Chiffrement
**Fichier:** `src/common/encryption.service.ts`
**Effort:** 4h

```typescript
// Créer:
EncryptionService:
- encrypt(text: string): string
- decrypt(text: string): string

// Utiliser dans Producteur:
@Encrypted()
numeroPieceIdentification: string

// Middleware Prisma:
this.prisma.$use(async (params, next) => {
  if (params.model === 'Producteur' && params.action === 'update') {
    params.data = encryptSensitiveFields(params.data)
  }
  return next(params)
})
```

### Tâche 4.2: Audit Trail Complet
**Fichier:** `src/common/audit.interceptor.ts`
**Effort:** 3h

```typescript
// Créer AuditLog record pour chaque action:
- User ID
- Entity type + ID
- Action (CREATE/UPDATE/DELETE)
- Old value + new value
- Timestamp
- IP address

// Dashboard:
GET /admin/audit-logs
```

### Tâche 4.3: Rate Limiting
**Effort:** 2h

```bash
npm install @nestjs/throttler

// Apply:
@Throttle(10, 60) // 10 requests per 60 seconds
@Post('/auth/login')
```

### Tâche 4.4: Input Validation Advanced
**Effort:** 3h

- Custom validators (phone format, GPS coordinates, etc.)
- Sanitization (XSS prevention)
- Test validation edge cases

---

## 🟢 PRIORITÉ 5: Performance & Observabilité

### Tâche 5.1: Database Indexes
**Effort:** 2h

```prisma
// Add to schema.prisma:
model Producteur {
  @@index([userId])
  @@index([region])
}

model Annonce {
  @@index([status])
  @@index([producteurId])
  @@fulltext([titre, description]) // For search
}

// Migrate:
npm run prisma:migrate "add indexes"
```

### Tâche 5.2: Caching Strategy
**Effort:** 4h

```typescript
// Use Redis for:
- User sessions
- Announcement listings
- Cooperative validation queue

// Implementation:
@UseInterceptors(CacheInterceptor)
@Get('/announcements')
findAll()

// Clear cache on update:
this.cacheManager.del('announcements')
```

### Tâche 5.3: Logging Observability
**Effort:** 3h

```bash
npm install pino pino-http @sentry/node

// Structure logs:
- Request ID (correlation)
- User ID (user tracking)
- Entity ID (audit)
- Duration (performance)
- Error stack traces
```

### Tâche 5.4: Monitoring & Alerts
**Effort:** 5h

```bash
# Setup:
- Sentry for error tracking
- Datadog/New Relic for APM
- Alerts for failed syncs
- Health check dashboard
```

---

## 📋 Checklist Post-MVP

- [ ] Tests >80% coverage
- [ ] Modules stubs implémentés
- [ ] Notifications working (at least SMS)
- [ ] Data encryption for sensitive fields
- [ ] Audit trail for compliance
- [ ] Performance optimized (DB indexes + caching)
- [ ] Security hardened (rate limiting, XSS prevention)
- [ ] Monitoring/alerting setup
- [ ] Production deployment tested
- [ ] Team trained on architecture

---

## 🚀 Deployment Checklist

Before going to production:

```bash
# 1. Security
- npm audit fix
- Env vars in production secrets manager
- HTTPS/TLS configured
- CORS properly set
- SQL injection testing

# 2. Performance
- Load testing (k6, Artillery)
- Database query optimization
- Cache hit rates checked
- Rate limiting active

# 3. Monitoring
- Sentry/Datadog enabled
- Health checks working
- Logs centralized
- Alerts configured

# 4. Documentation
- API docs (Swagger) complete
- Runbook for operations
- Incident response plan
- Backup/restore tested

# 5. Testing
- Unit tests passing
- Integration tests passing
- E2E tests for critical flows
- Offline sync tested

# Final commands:
docker-compose up -d
npm run db:push
npm run db:seed
npm run start:prod

# Health check:
curl http://localhost:3000/health
```

---

## 📅 Estimated Timeline

| Phase | Tasks | Effort | Timeline |
|-------|-------|--------|----------|
| **Tests** | 1.1-1.4 | ~20h | Week 1-2 |
| **Modules** | 2.1-2.4 | ~30h | Week 2-4 |
| **Notifications** | 3.1-3.5 | ~12h | Week 3 |
| **Optimization** | 4.1-5.4 | ~20h | Week 4-5 |
| **Production** | Deploy + test | ~10h | Week 5-6 |
| **Total** | | ~92h | 6 weeks |

---

## 👥 Team Assignment Recommendation

```
Dev 1 (Senior): Tests + Sync optimization
Dev 2 (Mid): Cooperatives + Acheteurs modules
Dev 3 (Mid): Notifications + Export module
Dev 4 (Junior): Admin module + Audit trail
DevOps: Deployment + monitoring setup
```

---

## 📞 Getting Help

- **Code questions:** Check [FAQ.md](FAQ.md) + existing modules
- **Architecture:** See [docs/ADRs.md](docs/ADRs.md)
- **Patterns:** See [MODULES_GUIDE.md](MODULES_GUIDE.md)
- **Setup issues:** See [CONTRIBUTING.md](CONTRIBUTING.md)

---

**Let's ship this! 🚀**

Start with Priority 1 (Tests) - they unlock everything else!
