# 📊 ANALYSE COMPLÈTE DIAGRAMMES UML - PLATEFORME AGRICOLE INTELLIGENTE

**Date:** 2026-01-15  
**Version:** 1.0  
**Statut:** ✅ Complet

---

## 🎭 ACTEURS IDENTIFIÉS

| Acteur | Description | Rôle Système | Token Accès | Token Offline |
|--------|-------------|--------------|-------------|---------------|
| **Producteur** | Agriculteur créant des annonces de produits | PRODUCTEUR | 15 min | - |
| **Agent de Terrain** | Collecteur de données hors-ligne pour producteurs | AGENT | 15 min | 30j ✅ |
| **Acheteur** | Cherche et achète des produits agricoles | ACHETEUR | 15 min | - |
| **Coopérative** | Supervise et valide les producteurs | COOPERATIVE | 15 min | - |
| **Administrateur** | Gestion système et audit complet | ADMIN | 15 min | - |

---

## 📋 DIAGRAMME 1: AUTHENTIFICATION (Cas d'utilisation commune à tous les acteurs)

### Scope: Tous les utilisateurs

### Cas d'Utilisation:
| # | Cas | Endpoint | Méthode | Authentification | Description |
|---|-----|----------|---------|------------------|-------------|
| 1.1 | S'enregistrer | `/auth/register` | POST | ❌ Public | Créer nouveau compte utilisateur |
| 1.2 | Se connecter | `/auth/login` | POST | ❌ Public | Authentifier avec email/password |
| 1.3 | Rafraîchir token | `/auth/refresh` | POST | ❌ Public | Générer nouveau access token |
| 1.4 | Consulter profil | `/auth/profile` | GET | ✅ JWT | Obtenir profil utilisateur connecté |

### Fonctions Service (auth.service.ts):
```typescript
// Authentification
register(registerDto: RegisterDto): Promise<AuthResponseDto>
login(loginDto: LoginDto): Promise<AuthResponseDto>
refreshToken(refreshTokenDto: RefreshTokenDto): Promise<AuthResponseDto>
validateToken(token: string): Promise<JwtPayload>
logout(userId: string): Promise<void>

// Tokens
generateAccessToken(payload: any): string
generateRefreshToken(payload: any): string
generateOfflineAgentToken(agentId: string): string
validateRefreshToken(token: string): Promise<JwtPayload>
validateOfflineToken(token: string): Promise<JwtPayload>

// Gestion secrets
rotateRefreshToken(userId: string): Promise<string>
revokeToken(userId: string, tokenId?: string): Promise<void>
```

### DTO Swagger:
- `RegisterDto` - Email, Password, FirstName, LastName, Role, Phone(opt)
- `LoginDto` - Email, Password
- `RefreshTokenDto` - RefreshToken
- `AuthResponseDto` - AccessToken, RefreshToken, User, ExpiresIn

---

## 📋 DIAGRAMME 2: PRODUCTEUR AGRICOLE

### Scope: Producteur + Agent de terrain

### Cas d'Utilisation - Gestion Profil:
| # | Cas | Endpoint | Méthode | Rôles | Description |
|---|-----|----------|---------|-------|-------------|
| 2.1 | Créer profil producteur | `/producteurs` | POST | PRODUCTEUR, AGENT | Créer nouveau profil |
| 2.2 | Consulter mon profil | `/producteurs/my-profile` | GET | PRODUCTEUR | Consulter ses données |
| 2.3 | Mettre à jour profil | `/producteurs/:id` | PUT | PRODUCTEUR, AGENT, ADMIN | Modifier profil |
| 2.4 | Lister producteurs | `/producteurs` | GET | ADMIN, COOPERATIVE | Voir tous producteurs |
| 2.5 | Consulter producteur | `/producteurs/:id` | GET | ADMIN, COOPERATIVE, ACHETEUR | Détails producteur |
| 2.6 | Désactiver producteur | `/producteurs/:id` | DELETE | ADMIN | Supprimer profil |

### Cas d'Utilisation - Gestion Exploitations (Fermes):
| # | Cas | Endpoint | Méthode | Rôles | Description |
|---|-----|----------|---------|-------|-------------|
| 2.7 | Créer exploitation | `/exploitations` | POST | PRODUCTEUR, AGENT | Enregistrer ferme |
| 2.8 | Lister mes exploitations | `/exploitations/my-farms` | GET | PRODUCTEUR | Consulter ses fermes |
| 2.9 | Consulter exploitation | `/exploitations/:id` | GET | PRODUCTEUR, AGENT, ADMIN | Détails ferme |
| 2.10 | Mettre à jour exploitation | `/exploitations/:id` | PUT | PRODUCTEUR, AGENT | Modifier ferme |
| 2.11 | Supprimer exploitation | `/exploitations/:id` | DELETE | PRODUCTEUR, AGENT | Supprimer ferme |
| 2.12 | Ajouter activité | `/exploitations/:id/activities` | POST | PRODUCTEUR, AGENT | Ajouter culture/élevage |
| 2.13 | Lister activités | `/exploitations/:id/activities` | GET | PRODUCTEUR, ADMIN | Consulter cultures |
| 2.14 | Mettre à jour activité | `/exploitations/:id/activities/:actId` | PUT | PRODUCTEUR, AGENT | Modifier activité |
| 2.15 | Supprimer activité | `/exploitations/:id/activities/:actId` | DELETE | PRODUCTEUR, AGENT | Supprimer activité |

### Fonctions Service - ProducersService:
```typescript
// Gestion profil
create(userId: string, createProductorDto: CreateProductorDto): Promise<ProductorResponseDto>
findByUserId(userId: string): Promise<ProductorResponseDto>
findById(producerId: string): Promise<ProductorResponseDto>
findAll(skip: number, take: number, filters?: any): Promise<ProductorResponseDto[]>
update(producerId: string, updateProductorDto: UpdateProductorDto): Promise<ProductorResponseDto>
delete(producerId: string): Promise<void>
deactivate(producerId: string): Promise<ProductorResponseDto>

// Statistiques
getStats(producerId: string): Promise<any>
getActivitySummary(producerId: string): Promise<any>
```

### Fonctions Service - ExploitationsService:
```typescript
// Gestion exploitations
create(userId: string, createFarmDto: CreateFarmDto): Promise<FarmResponseDto>
findByProducerId(producerId: string, skip: number, take: number): Promise<FarmResponseDto[]>
findById(farmId: string): Promise<FarmResponseDto>
update(farmId: string, updateFarmDto: UpdateFarmDto): Promise<FarmResponseDto>
delete(farmId: string): Promise<void>

// Gestion activités
addActivity(farmId: string, createActivityDto: CreateActivityDto): Promise<ActivityResponseDto>
getActivities(farmId: string): Promise<ActivityResponseDto[]>
updateActivity(activityId: string, updateActivityDto: UpdateActivityDto): Promise<ActivityResponseDto>
deleteActivity(activityId: string): Promise<void>
getActivityDetails(activityId: string): Promise<ActivityResponseDto>

// Statistiques
getFarmStats(farmId: string): Promise<any>
getTotalSuperface(producerId: string): Promise<number>
getProductivityMetrics(farmId: string): Promise<any>
```

---

## 📋 DIAGRAMME 3: MARKETPLACE - ANNONCES

### Scope: Producteur, Agent, Acheteur, Coopérative, Admin

### Cas d'Utilisation:
| # | Cas | Endpoint | Méthode | Rôles | Description |
|---|-----|----------|---------|-------|-------------|
| 3.1 | Lister annonces publiées | `/annonces` | GET | PUBLIC | Voir toutes annonces actives |
| 3.2 | Rechercher annonces | `/annonces/search` | GET | PUBLIC | Filtrer par type, région, prix |
| 3.3 | Consulter annonce | `/annonces/:id` | GET | PUBLIC | Détails annonce + producteur |
| 3.4 | Créer annonce | `/annonces` | POST | PRODUCTEUR, AGENT | Créer nouvelle annonce |
| 3.5 | Consulter mes annonces | `/annonces/my-announcements` | GET | PRODUCTEUR | Mes annonces (tous statuts) |
| 3.6 | Mettre à jour annonce | `/annonces/:id` | PUT | PRODUCTEUR, AGENT | Modifier annonce |
| 3.7 | Publier annonce | `/annonces/:id/publish` | PATCH | PRODUCTEUR, AGENT | Changer statut PUBLIEE |
| 3.8 | Dépublier annonce | `/annonces/:id/unpublish` | PATCH | PRODUCTEUR, AGENT | Changer statut EN_ATTENTE |
| 3.9 | Supprimer annonce | `/annonces/:id` | DELETE | PRODUCTEUR, AGENT | Supprimer annonce |
| 3.10 | Consulter mises en relation | `/annonces/:id/relationships` | GET | PRODUCTEUR, ADMIN | Demandes achat reçues |

### Fonctions Service - AnnouncementsService:
```typescript
// Gestion annonces
create(userId: string, createAnnouncementDto: CreateAnnouncementDto): Promise<AnnouncementResponseDto>
findAll(skip: number, take: number, filters?: SearchFiltersDto): Promise<AnnouncementResponseDto[]>
findById(announcementId: string): Promise<AnnouncementResponseDto>
findByProducerId(producerId: string, skip: number, take: number): Promise<AnnouncementResponseDto[]>
update(announcementId: string, updateAnnouncementDto: UpdateAnnouncementDto): Promise<AnnouncementResponseDto>
delete(announcementId: string): Promise<void>

// Publication
publish(announcementId: string): Promise<AnnouncementResponseDto>
unpublish(announcementId: string): Promise<AnnouncementResponseDto>
updateStatus(announcementId: string, status: StatutAnnonce): Promise<AnnouncementResponseDto>

// Recherche
search(query: string, filters?: SearchFiltersDto): Promise<AnnouncementResponseDto[]>
searchByType(type: string): Promise<AnnouncementResponseDto[]>
searchByRegion(region: string): Promise<AnnouncementResponseDto[]>
getPopularAnnouncements(limit: number): Promise<AnnouncementResponseDto[]>

// Mises en relation
getRelationships(announcementId: string): Promise<MiseEnRelationResponseDto[]>
getRelationshipStats(announcementId: string): Promise<any>
```

---

## 📋 DIAGRAMME 4: MISE EN RELATION (Acheteur ↔ Producteur)

### Scope: Acheteur, Producteur, Admin

### Cas d'Utilisation:
| # | Cas | Endpoint | Méthode | Rôles | Description |
|---|-----|----------|---------|-------|-------------|
| 4.1 | Créer mise en relation | `/mises-en-relation` | POST | ACHETEUR | Demander mise en relation |
| 4.2 | Lister mes demandes | `/mises-en-relation/my-requests` | GET | ACHETEUR | Mes demandes d'achat |
| 4.3 | Consulter demande | `/mises-en-relation/:id` | GET | ACHETEUR, PRODUCTEUR, ADMIN | Détails demande |
| 4.4 | Accepter demande | `/mises-en-relation/:id/accept` | PATCH | PRODUCTEUR | Accepter mise en relation |
| 4.5 | Refuser demande | `/mises-en-relation/:id/reject` | PATCH | PRODUCTEUR | Refuser demande |
| 4.6 | Marquer réalisée | `/mises-en-relation/:id/complete` | PATCH | PRODUCTEUR, ACHETEUR | Transaction complétée |
| 4.7 | Annuler demande | `/mises-en-relation/:id` | DELETE | ACHETEUR, PRODUCTEUR | Annuler demande |

### Fonctions Service - MiseEnRelationService:
```typescript
// Gestion mise en relation
create(acheteurId: string, createRelationshipDto: CreateRelationshipDto): Promise<MiseEnRelationResponseDto>
findById(relationshipId: string): Promise<MiseEnRelationResponseDto>
findByBuyerId(acheteurId: string, skip: number, take: number): Promise<MiseEnRelationResponseDto[]>
findByProducerId(producerId: string, skip: number, take: number): Promise<MiseEnRelationResponseDto[]>
findByAnnouncementId(announcementId: string): Promise<MiseEnRelationResponseDto[]>

// Changement statut
acceptRelationship(relationshipId: string, producerId: string): Promise<MiseEnRelationResponseDto>
rejectRelationship(relationshipId: string, producerId: string, reason?: string): Promise<MiseEnRelationResponseDto>
completeRelationship(relationshipId: string): Promise<MiseEnRelationResponseDto>
cancelRelationship(relationshipId: string): Promise<void>

// Recherche
getPendingRequests(producerId: string): Promise<MiseEnRelationResponseDto[]>
getAcceptedRelationships(producerId: string): Promise<MiseEnRelationResponseDto[]>
getCompletedRelationships(acheteurId: string): Promise<MiseEnRelationResponseDto[]>
```

---

## 📋 DIAGRAMME 5: AGENT DE TERRAIN (Synchronisation Offline)

### Scope: Agent de terrain uniquement

### Cas d'Utilisation:
| # | Cas | Endpoint | Méthode | Rôles | Description |
|---|-----|----------|---------|-------|-------------|
| 5.1 | Obtenir token offline | `/agents/offline-token` | POST | AGENT | Créer token 30 jours |
| 5.2 | Valider token offline | `/auth/validate-offline` | POST | - | Vérifier validité token |
| 5.3 | Consulter statut token | `/agents/:id/token-status` | GET | AGENT | Etat token offline |
| 5.4 | Révoquer token | `/agents/:id/revoke-token` | POST | AGENT, ADMIN | Invalider token agent |
| 5.5 | Créer/sync producteur | `/sync/batch` | POST | AGENT | Synchroniser données |
| 5.6 | Créer/sync exploitation | `/sync/batch` | POST | AGENT | Inclus dans batch |
| 5.7 | Créer/sync annonce | `/sync/batch` | POST | AGENT | Inclus dans batch |
| 5.8 | Consulter historique sync | `/sync/history` | GET | AGENT | Voir synchronisations |
| 5.9 | Consulter sync échoués | `/sync/failed` | GET | AGENT | Batches avec erreurs |
| 5.10 | Rejeter batch échoué | `/sync/:journalId/retry` | POST | AGENT | Ressayer batch |

### Fonctions Service - AgentsService:
```typescript
// Token offline
generateOfflineToken(agentId: string): Promise<OfflineTokenResponseDto>
validateOfflineToken(token: string): Promise<OfflineTokenPayload>
revokeOfflineToken(agentId: string): Promise<void>
getOfflineTokenStatus(agentId: string): Promise<TokenStatusDto>
checkTokenExpiry(agentId: string): Promise<boolean>

// Gestion agents
findById(agentId: string): Promise<AgentResponseDto>
findAll(skip: number, take: number): Promise<AgentResponseDto[]>
updateAgentInfo(agentId: string, updateAgentDto: UpdateAgentDto): Promise<AgentResponseDto>
deactivateAgent(agentId: string): Promise<void>

// Statistiques
getAgentStats(agentId: string): Promise<any>
getSyncMetrics(agentId: string): Promise<any>
```

### Fonctions Service - SyncService:
```typescript
// Synchronisation IDEMPOTENTE (LWW)
syncBatch(agentId: string, syncBatchDto: SyncBatchDto): Promise<SyncResponseDto>
validateIdempotency(idClientGenere: string): Promise<boolean>
checkBatchAlreadyProcessed(idClientGenere: string): Promise<boolean>
applyLastWriteWins(existingData: any, incomingData: any, timestamp: Date): any

// Gestion sync
getSyncHistory(agentId: string, skip: number, take: number): Promise<SyncJournalResponseDto[]>
getFailedSyncs(agentId: string): Promise<SyncJournalResponseDto[]>
retrySyncBatch(journalSyncId: string): Promise<SyncResponseDto>
getSyncBatchDetails(journalSyncId: string): Promise<SyncJournalDetailDto>

// Audit
getSyncStats(agentId?: string): Promise<SyncStatsDto>
getConflictLog(agentId?: string): Promise<ConflictLogDto[]>
```

---

## 📋 DIAGRAMME 6: COOPÉRATIVE (Supervision & Validation)

### Scope: Coopérative + Admin

### Cas d'Utilisation:
| # | Cas | Endpoint | Méthode | Rôles | Description |
|---|-----|----------|---------|-------|-------------|
| 6.1 | Lister membres | `/cooperatives/:id/members` | GET | COOPERATIVE, ADMIN | Producteurs membres |
| 6.2 | Consulter membre | `/cooperatives/:id/members/:producerId` | GET | COOPERATIVE, ADMIN | Détails producteur |
| 6.3 | Ajouter membre | `/cooperatives/:id/members` | POST | COOPERATIVE, ADMIN | Enregistrer producteur |
| 6.4 | Retirer membre | `/cooperatives/:id/members/:producerId` | DELETE | COOPERATIVE, ADMIN | Supprimer membre |
| 6.5 | Lister annonces en attente | `/cooperatives/:id/pending-validations` | GET | COOPERATIVE, ADMIN | Queue validation |
| 6.6 | Valider annonce | `/cooperatives/:id/announcements/:annId/validate` | POST | COOPERATIVE, ADMIN | Approuver annonce |
| 6.7 | Rejeter annonce | `/cooperatives/:id/announcements/:annId/reject` | POST | COOPERATIVE, ADMIN | Refuser annonce |
| 6.8 | Historique validation | `/cooperatives/:id/validation-history` | GET | COOPERATIVE, ADMIN | Trace validations |
| 6.9 | Consulter tableau bord | `/cooperatives/:id/dashboard` | GET | COOPERATIVE, ADMIN | Statistiques |

### Fonctions Service - CooperativesService:
```typescript
// Gestion membres
getMembers(cooperativeId: string, skip: number, take: number): Promise<ProductorResponseDto[]>
getMemberDetails(cooperativeId: string, producerId: string): Promise<ProductorResponseDto>
addMember(cooperativeId: string, producerId: string): Promise<void>
removeMember(cooperativeId: string, producerId: string): Promise<void>
isMember(cooperativeId: string, producerId: string): Promise<boolean>
getMemberStats(cooperativeId: string, producerId: string): Promise<any>

// Validation annonces
getPendingValidations(cooperativeId: string, skip: number, take: number): Promise<ValidationQueueDto[]>
validateAnnouncement(cooperativeId: string, announcementId: string, notes?: string): Promise<AnnouncementResponseDto>
rejectAnnouncement(cooperativeId: string, announcementId: string, reason: string): Promise<AnnouncementResponseDto>
getValidationHistory(cooperativeId: string, skip: number, take: number): Promise<ValidationHistoryDto[]>
getValidationStats(cooperativeId: string): Promise<ValidationStatsDto>

// Tableau de bord
getDashboard(cooperativeId: string): Promise<CooperativeDashboardDto>
getMemberActivity(cooperativeId: string): Promise<any>
getValidationMetrics(cooperativeId: string): Promise<any>
```

---

## 📋 DIAGRAMME 7: ACHETEUR (Recherche & Procurement)

### Scope: Acheteur + Admin

### Cas d'Utilisation:
| # | Cas | Endpoint | Méthode | Rôles | Description |
|---|-----|----------|---------|-------|-------------|
| 7.1 | Lister annonces | `/annonces` | GET | PUBLIC | Annonces actives |
| 7.2 | Rechercher annonces | `/annonces/search` | GET | PUBLIC | Filtrer avancé |
| 7.3 | Consulter annonce | `/annonces/:id` | GET | PUBLIC | Détails + producteur |
| 7.4 | Consulter producteur | `/producteurs/:id` | GET | PUBLIC | Info producteur |
| 7.5 | Créer mise en relation | `/mises-en-relation` | POST | ACHETEUR | Demander achat |
| 7.6 | Consulter mes demandes | `/mises-en-relation/my-requests` | GET | ACHETEUR | Demandes envoyées |
| 7.7 | Annuler demande | `/mises-en-relation/:id` | DELETE | ACHETEUR | Retirer demande |
| 7.8 | Consulter panier | `/acheteurs/cart` | GET | ACHETEUR | Articles sélectionnés |
| 7.9 | Ajouter au panier | `/acheteurs/cart/add` | POST | ACHETEUR | Sauvegarder article |
| 7.10 | Récupérer suggestions | `/annonces/recommendations` | GET | ACHETEUR | Recommandations ML |

### Fonctions Service - BuyersService:
```typescript
// Recherche
searchAnnouncements(query: string, filters: SearchFiltersDto): Promise<AnnouncementResponseDto[]>
getAnnouncementDetail(announcementId: string): Promise<AnnouncementDetailDto>
getProducerProfile(producerId: string): Promise<ProducerProfileDto>
getRecommendations(buyerId: string, limit: number): Promise<AnnouncementResponseDto[]>

// Panier
getCart(buyerId: string): Promise<CartDto>
addToCart(buyerId: string, announcementId: string, quantity: number): Promise<CartDto>
removeFromCart(buyerId: string, announcementId: string): Promise<CartDto>
clearCart(buyerId: string): Promise<void>
getCartTotal(buyerId: string): Promise<number>

// Mise en relation
createRelationshipRequest(buyerId: string, announcementId: string): Promise<MiseEnRelationResponseDto>
getMyRequests(buyerId: string, skip: number, take: number): Promise<MiseEnRelationResponseDto[]>
trackRequest(relationshipId: string): Promise<MiseEnRelationStatusDto>

// Statistiques
getPurchaseHistory(buyerId: string): Promise<any>
getFavoriteProducts(buyerId: string): Promise<any>
getSpendingMetrics(buyerId: string): Promise<any>
```

---

## 📋 DIAGRAMME 8: ADMINISTRATEUR (Gestion Système)

### Scope: Admin uniquement

### Cas d'Utilisation - Gestion Utilisateurs:
| # | Cas | Endpoint | Méthode | Rôles | Description |
|---|-----|----------|---------|-------|-------------|
| 8.1 | Lister utilisateurs | `/admin/users` | GET | ADMIN | Tous utilisateurs |
| 8.2 | Consulter utilisateur | `/admin/users/:id` | GET | ADMIN | Détails utilisateur |
| 8.3 | Créer utilisateur | `/admin/users` | POST | ADMIN | Enregistrer nouvel utilisateur |
| 8.4 | Modifier utilisateur | `/admin/users/:id` | PUT | ADMIN | Mettre à jour info |
| 8.5 | Désactiver utilisateur | `/admin/users/:id` | DELETE | ADMIN | Bloquer accès |
| 8.6 | Réinitialiser password | `/admin/users/:id/reset-password` | POST | ADMIN | Forcer changement MDP |
| 8.7 | Changer rôle | `/admin/users/:id/role` | PATCH | ADMIN | Modifier rôle utilisateur |
| 8.8 | Consulter audit utilisateur | `/admin/users/:id/audit` | GET | ADMIN | Actions utilisateur |

### Cas d'Utilisation - Audit & Logs:
| # | Cas | Endpoint | Méthode | Rôles | Description |
|---|-----|----------|---------|-------|-------------|
| 8.9 | Consulter audit logs | `/admin/audit-logs` | GET | ADMIN | Trace actions système |
| 8.10 | Filtrer logs | `/admin/audit-logs` | GET | ADMIN | Par action, user, date |
| 8.11 | Exporter logs | `/admin/audit-logs/export` | GET | ADMIN | CSV/PDF/JSON |
| 8.12 | Consulter erreurs | `/admin/error-logs` | GET | ADMIN | Logs erreurs système |

### Cas d'Utilisation - Gestion Sync:
| # | Cas | Endpoint | Méthode | Rôles | Description |
|---|-----|----------|---------|-------|-------------|
| 8.13 | Batches échoués | `/admin/sync/failed-batches` | GET | ADMIN | Lister erreurs sync |
| 8.14 | Détails batch | `/admin/sync/:journalId/details` | GET | ADMIN | Erreurs spécifiques |
| 8.15 | Forcer rejeu batch | `/admin/sync/:journalId/force-retry` | POST | ADMIN | Traiter de force |
| 8.16 | Statistiques sync | `/admin/sync/stats` | GET | ADMIN | Métriques sync |

### Cas d'Utilisation - Statistiques Système:
| # | Cas | Endpoint | Méthode | Rôles | Description |
|---|-----|----------|---------|-------|-------------|
| 8.17 | Statistiques générales | `/admin/stats` | GET | ADMIN | Vue système complète |
| 8.18 | Utilisateurs par rôle | `/admin/stats/users-by-role` | GET | ADMIN | Distribution rôles |
| 8.19 | Activité 30 jours | `/admin/stats/activity-30d` | GET | ADMIN | Derniers 30 jours |
| 8.20 | Santé système | `/admin/health` | GET | ADMIN | DB, cache, API status |

### Fonctions Service - AdminService:
```typescript
// Gestion utilisateurs
listUsers(skip: number, take: number, filters?: any): Promise<UserResponseDto[]>
getUserDetails(userId: string): Promise<UserDetailDto>
createUser(createUserDto: CreateUserDto): Promise<UserResponseDto>
updateUser(userId: string, updateUserDto: UpdateUserDto): Promise<UserResponseDto>
deactivateUser(userId: string): Promise<void>
activateUser(userId: string): Promise<void>
resetUserPassword(userId: string): Promise<ResetPasswordResponseDto>
changeUserRole(userId: string, newRole: Role): Promise<UserResponseDto>
getUserAuditLog(userId: string, skip: number, take: number): Promise<AuditLogDto[]>

// Audit logs
getAuditLogs(skip: number, take: number, filters?: AuditLogFiltersDto): Promise<AuditLogDto[]>
getAuditLogsByAction(action: string, skip: number, take: number): Promise<AuditLogDto[]>
getAuditLogsByUser(userId: string, skip: number, take: number): Promise<AuditLogDto[]>
getAuditLogsByDateRange(startDate: Date, endDate: Date): Promise<AuditLogDto[]>
exportAuditLogs(format: 'csv' | 'json' | 'pdf', filters?: any): Promise<Buffer>
deleteOldAuditLogs(daysOld: number): Promise<number>

// Gestion sync
getFailedSyncBatches(skip: number, take: number): Promise<SyncJournalResponseDto[]>
getSyncBatchDetails(journalId: string): Promise<SyncBatchDetailDto>
forceSyncBatchRetry(journalId: string): Promise<SyncResponseDto>
getSyncStats(agentId?: string): Promise<SyncStatsDto>
getSyncConflicts(): Promise<ConflictLogDto[]>

// Statistiques système
getSystemStats(): Promise<SystemStatsDto>
getUsersStats(): Promise<UsersStatsDto>
getAnnouncementsStats(): Promise<AnnouncementsStatsDto>
getActivityStats(days: number): Promise<ActivityStatsDto>
getHealthStatus(): Promise<HealthStatusDto>
getDatabaseStats(): Promise<DatabaseStatsDto>

// Rapports
generateDailyReport(): Promise<ReportDto>
generateWeeklyReport(): Promise<ReportDto>
generateMonthlyReport(): Promise<ReportDto>
```

---

## 🔐 MATRICE CONTRÔLE D'ACCÈS (RBAC COMPLET)

```
Endpoint                           | PROD | AGENT | ACHETEUR | COOP | ADMIN | PUBLIC
──────────────────────────────────────────────────────────────────────────────────
POST /auth/register                 |  ✅  |   ✅  |    ✅    |  ✅  |   ✅  |  ✅
POST /auth/login                    |  ✅  |   ✅  |    ✅    |  ✅  |   ✅  |  ✅
POST /auth/refresh                  |  ✅  |   ✅  |    ✅    |  ✅  |   ✅  |  ✅
──────────────────────────────────────────────────────────────────────────────────
POST /producteurs                   |  ✅  |   ✅  |    ❌    |  ❌  |   ✅  |  ❌
GET  /producteurs/my-profile        |  ✅  |   ❌  |    ❌    |  ❌  |   ❌  |  ❌
GET  /producteurs                   |  ❌  |   ✅  |    ❌    |  ✅  |   ✅  |  ❌
GET  /producteurs/:id               |  ❌  |   ✅  |    ✅    |  ✅  |   ✅  |  ❌
PUT  /producteurs/:id               |  ✅  |   ✅  |    ❌    |  ❌  |   ✅  |  ❌
DELETE /producteurs/:id             |  ❌  |   ❌  |    ❌    |  ❌  |   ✅  |  ❌
──────────────────────────────────────────────────────────────────────────────────
POST /exploitations                 |  ✅  |   ✅  |    ❌    |  ❌  |   ✅  |  ❌
GET  /exploitations/my-farms        |  ✅  |   ❌  |    ❌    |  ❌  |   ❌  |  ❌
GET  /exploitations/:id             |  ✅  |   ✅  |    ❌    |  ✅  |   ✅  |  ❌
PUT  /exploitations/:id             |  ✅  |   ✅  |    ❌    |  ❌  |   ✅  |  ❌
DELETE /exploitations/:id           |  ✅  |   ✅  |    ❌    |  ❌  |   ✅  |  ❌
POST /exploitations/:id/activities  |  ✅  |   ✅  |    ❌    |  ❌  |   ✅  |  ❌
GET  /exploitations/:id/activities  |  ✅  |   ❌  |    ❌    |  ✅  |   ✅  |  ❌
──────────────────────────────────────────────────────────────────────────────────
GET  /annonces                      |  ✅  |   ✅  |    ✅    |  ✅  |   ✅  |  ✅
GET  /annonces/search               |  ✅  |   ✅  |    ✅    |  ✅  |   ✅  |  ✅
GET  /annonces/:id                  |  ✅  |   ✅  |    ✅    |  ✅  |   ✅  |  ✅
POST /annonces                      |  ✅  |   ✅  |    ❌    |  ❌  |   ✅  |  ❌
GET  /annonces/my-announcements     |  ✅  |   ❌  |    ❌    |  ❌  |   ❌  |  ❌
PUT  /annonces/:id                  |  ✅  |   ✅  |    ❌    |  ❌  |   ✅  |  ❌
PATCH /annonces/:id/publish         |  ✅  |   ✅  |    ❌    |  ❌  |   ✅  |  ❌
DELETE /annonces/:id                |  ✅  |   ✅  |    ❌    |  ❌  |   ✅  |  ❌
GET  /annonces/:id/relationships    |  ✅  |   ❌  |    ❌    |  ✅  |   ✅  |  ❌
──────────────────────────────────────────────────────────────────────────────────
POST /mises-en-relation             |  ❌  |   ❌  |    ✅    |  ❌  |   ✅  |  ❌
GET  /mises-en-relation/my-requests |  ❌  |   ❌  |    ✅    |  ❌  |   ❌  |  ❌
GET  /mises-en-relation/:id         |  ✅  |   ❌  |    ✅    |  ❌  |   ✅  |  ❌
PATCH /mises-en-relation/:id/accept |  ✅  |   ❌  |    ❌    |  ❌  |   ✅  |  ❌
PATCH /mises-en-relation/:id/reject |  ✅  |   ❌  |    ❌    |  ❌  |   ✅  |  ❌
DELETE /mises-en-relation/:id       |  ✅  |   ❌  |    ✅    |  ❌  |   ✅  |  ❌
──────────────────────────────────────────────────────────────────────────────────
POST /agents/offline-token          |  ❌  |   ✅  |    ❌    |  ❌  |   ✅  |  ❌
GET  /agents/:id/token-status       |  ❌  |   ✅  |    ❌    |  ❌  |   ✅  |  ❌
POST /agents/:id/revoke-token       |  ❌  |   ✅  |    ❌    |  ❌  |   ✅  |  ❌
POST /sync/batch                    |  ❌  |   ✅  |    ❌    |  ❌  |   ✅  |  ❌
GET  /sync/history                  |  ❌  |   ✅  |    ❌    |  ❌  |   ✅  |  ❌
GET  /sync/failed                   |  ❌  |   ✅  |    ❌    |  ❌  |   ✅  |  ❌
──────────────────────────────────────────────────────────────────────────────────
GET  /cooperatives/:id/members      |  ❌  |   ❌  |    ❌    |  ✅  |   ✅  |  ❌
GET  /cooperatives/:id/pending...   |  ❌  |   ❌  |    ❌    |  ✅  |   ✅  |  ❌
POST /cooperatives/:id/announce.../v|  ❌  |   ❌  |    ❌    |  ✅  |   ✅  |  ❌
──────────────────────────────────────────────────────────────────────────────────
GET  /admin/users                   |  ❌  |   ❌  |    ❌    |  ❌  |   ✅  |  ❌
POST /admin/users                   |  ❌  |   ❌  |    ❌    |  ❌  |   ✅  |  ❌
GET  /admin/audit-logs              |  ❌  |   ❌  |    ❌    |  ❌  |   ✅  |  ❌
GET  /admin/stats                   |  ❌  |   ❌  |    ❌    |  ❌  |   ✅  |  ❌
GET  /admin/sync/failed-batches     |  ❌  |   ❌  |    ❌    |  ❌  |   ✅  |  ❌
```

---

## 🔄 FLUX SYNCHRONISATION OFFLINE (IDEMPOTENT + LWW)

### Scénario Complet: Agent Terrain Collecte Données Hors-Ligne

**Prérequis**: Agent a token offline valide (30 jours)

#### Phase 1: Préparation (Online)
```
1. Agent se connecte (email + password)
2. Agent requête POST /agents/offline-token
3. Serveur crée JWT { type: 'offline-agent', exp: +30j }
4. Token stocké dans app mobile (sécurisé, crypté)
5. Agent peut travailler 30 jours offline avec ce token
```

#### Phase 2: Collecte Données (Offline)
```
Agent crée/modifie données SANS connexion réseau:

Opération 1 - CREATE Producteur:
  {
    "id": "op-1-uuid",
    "operationType": "CREATE",
    "entityType": "PRODUCTEUR",
    "timestamp": "2024-01-15T10:00:00Z",
    "data": { "name": "Jean Diallo", "city": "Bamako", ... }
  }

Opération 2 - CREATE Exploitation:
  {
    "id": "op-2-uuid",
    "operationType": "CREATE",
    "entityType": "EXPLOITATION",
    "timestamp": "2024-01-15T10:05:00Z",
    "data": { "producerId": "op-1-uuid", "name": "Ferme Nord", ... }
  }

Opération 3 - UPDATE Producteur (correction):
  {
    "id": "op-3-uuid",
    "operationType": "UPDATE",
    "entityType": "PRODUCTEUR",
    "entityId": "op-1-uuid",
    "timestamp": "2024-01-15T10:15:00Z",  // Plus récent
    "data": { "phone": "+221701234567" }  // Données mises à jour
  }

Opération 4 - CREATE Annonce:
  {
    "id": "op-4-uuid",
    "operationType": "CREATE",
    "entityType": "ANNONCE",
    "timestamp": "2024-01-15T10:20:00Z",
    "data": { "exploitationId": "op-2-uuid", "product": "Millet", ... }
  }
```

**Chaque opération est sauvegardée localement avec timestamp SANS connexion réseau**

#### Phase 3: Synchronisation (Online - Au retour connexion)

Agent envoie batch:
```json
POST /sync/batch
Content-Type: application/json
Authorization: Bearer <offline_token>

{
  "idClientGenere": "550e8400-e29b-41d4-a716-446655440000",  // UUID unique = IDEMPOTENCE
  "timestamp": "2024-01-15T18:30:00Z",                        // Quand batch envoyé
  "operations": [
    {
      "operationType": "CREATE",
      "entityType": "PRODUCTEUR",
      "data": { "name": "Jean Diallo", "city": "Bamako", ... }
    },
    {
      "operationType": "CREATE",
      "entityType": "EXPLOITATION",
      "data": { "producerId": "prod-123", "name": "Ferme Nord", ... }
    },
    {
      "operationType": "UPDATE",
      "entityType": "PRODUCTEUR",
      "entityId": "prod-123",
      "timestamp": "2024-01-15T10:15:00Z",
      "data": { "phone": "+221701234567" }
    },
    {
      "operationType": "CREATE",
      "entityType": "ANNONCE",
      "data": { "exploitationId": "farm-456", "product": "Millet", ... }
    }
  ]
}
```

#### Phase 4: Traitement Serveur (IDEMPOTENT + LWW)

```typescript
// Service pseudo-code
async syncBatch(agentId, syncBatchDto) {
  
  // 1. VÉRIFIER IDEMPOTENCE
  const existing = await db.journalSync.findOne({ 
    idClientGenere: syncBatchDto.idClientGenere 
  });
  
  if (existing && existing.status === 'OK') {
    // Batch déjà traité = Retourner résultat cached (IDEMPOTENCE!)
    return {
      status: 'OK',
      journalId: existing.id,
      message: 'Batch déjà synchronisé avec succès',
      timestamp: existing.createdAt
    };
  }
  
  // 2. CRÉER JOURNAL SYNCHRONISATION
  let journal = await db.journalSync.create({
    idClientGenere: syncBatchDto.idClientGenere,
    agentId,
    status: 'EN_ATTENTE',
    batchTimestamp: syncBatchDto.timestamp,
    operationCount: syncBatchDto.operations.length
  });
  
  // 3. TRAITER CHAQUE OPÉRATION
  const results = [];
  
  for (const op of syncBatchDto.operations) {
    try {
      let result;
      
      if (op.operationType === 'CREATE') {
        // INSERT si n'existe pas
        result = await this.handleCreate(op, agentId);
      } 
      else if (op.operationType === 'UPDATE') {
        // APPLY LWW: garder données les plus récentes
        result = await this.handleUpdateWithLWW(op);
      } 
      else if (op.operationType === 'DELETE') {
        // Marquer comme supprimé (soft delete)
        result = await this.handleDelete(op);
      }
      
      results.push({
        operationId: op.id,
        status: 'OK',
        entityType: op.entityType,
        entityId: result.id
      });
      
    } catch (error) {
      results.push({
        operationId: op.id,
        status: 'ECHEC',
        entityType: op.entityType,
        error: error.message
      });
    }
  }
  
  // 4. METTRE À JOUR JOURNAL
  const hasErrors = results.some(r => r.status === 'ECHEC');
  
  journal = await journal.update({
    status: hasErrors ? 'ECHEC' : 'OK',
    results: results,
    processedAt: new Date()
  });
  
  return {
    journalId: journal.id,
    status: journal.status,
    operationsProcessed: results.length,
    successCount: results.filter(r => r.status === 'OK').length,
    failureCount: results.filter(r => r.status === 'ECHEC').length,
    results: results
  };
}

// Stratégie Last-Write-Wins (LWW)
async handleUpdateWithLWW(operation) {
  const existing = await db[operation.entityType].findOne({
    id: operation.entityId
  });
  
  if (!existing) {
    // Entité n'existe pas = créer
    return await db[operation.entityType].create(operation.data);
  }
  
  // Comparer timestamps
  const incomingTime = new Date(operation.timestamp);
  const existingTime = new Date(existing.updatedAt);
  
  if (incomingTime > existingTime) {
    // Données entrantes plus récentes = APPLIQUER
    return await existing.update(operation.data);
  } else {
    // Données locales plus récentes = IGNORER (mais pas erreur!)
    return existing;  // Garder existant
  }
}
```

#### Phase 5: Réponse Serveur

**Scénario A: Succès complet**
```json
HTTP 200 OK

{
  "journalId": "journal-123",
  "status": "OK",
  "message": "Synchronisation réussie",
  "operationsProcessed": 4,
  "successCount": 4,
  "failureCount": 0,
  "results": [
    { "operationId": "op-1", "status": "OK", "entityType": "PRODUCTEUR", "entityId": "prod-123" },
    { "operationId": "op-2", "status": "OK", "entityType": "EXPLOITATION", "entityId": "farm-456" },
    { "operationId": "op-3", "status": "OK", "entityType": "PRODUCTEUR", "entityId": "prod-123" },
    { "operationId": "op-4", "status": "OK", "entityType": "ANNONCE", "entityId": "ann-789" }
  ],
  "processedAt": "2024-01-15T18:35:22Z"
}
```

**Scénario B: Erreur partielle**
```json
HTTP 200 OK (NON 400!)

{
  "journalId": "journal-124",
  "status": "ECHEC",
  "message": "Batch traité avec erreurs",
  "operationsProcessed": 4,
  "successCount": 3,
  "failureCount": 1,
  "results": [
    { "operationId": "op-1", "status": "OK", "entityType": "PRODUCTEUR", "entityId": "prod-123" },
    { "operationId": "op-2", "status": "OK", "entityType": "EXPLOITATION", "entityId": "farm-456" },
    { "operationId": "op-3", "status": "ECHEC", "entityType": "PRODUCTEUR", "error": "Phone invalid" },
    { "operationId": "op-4", "status": "OK", "entityType": "ANNONCE", "entityId": "ann-789" }
  ],
  "processedAt": "2024-01-15T18:35:22Z"
}
```

#### Phase 6: Agent Traite Résultat

Si `status === 'OK'`:
- ✅ Synchronisation réussie
- ✅ Données synchronisées
- ✅ Supprimer données locales (cache vidé)
- ✅ Afficher confirmation utilisateur

Si `status === 'ECHEC'`:
- ⚠️ Erreur partielle détectée
- ⚠️ Opérations réussies: oui
- ⚠️ Opérations échouées: sauvegarder localement
- ⚠️ Afficher liste erreurs
- ⚠️ Permettre rejeter batch: `POST /sync/:journalId/retry`

#### Phase 7: Rejeu Batch Échoué (Si nécessaire)

Agent peut rejeter le même batch:
```
GET /sync/failed  → Récupérer journalId des batches échoués
POST /sync/:journalId/retry  → Rejeter batch

Serveur:
- Récupère results avec status ECHEC
- Crée nouveau batch avec SEULEMENT opérations échouées
- Traite comme nouveau batch (UUID différent)
- Retourne résultat
```

---

## 🛡️ GARANTIES SÉCURITÉ & FIABILITÉ

| Propriété | Garantie | Mécanisme |
|-----------|----------|-----------|
| **Idempotence** | Batch rejoué = Même résultat | UUID `idClientGenere` unique (DB constraint) |
| **Last-Write-Wins** | Données plus récentes gagnent | Comparaison `timestamp` |
| **Zero Perte** | Zéro donnée perdue | Journal enregistre tout (status OK/ECHEC) |
| **Zero Doublon** | Zéro duplication | CREATE skippé si existe déjà |
| **Erreurs Partielles** | Certaines ops OK, d'autres échouent | Status ECHEC, détails des erreurs |
| **Rejeu Sûr** | Retry ne crée pas duplicata | Nouveau UUID = nouveau batch |
| **Audit Trail** | Trace complète | JournalSynchronisation enregistre tout |
| **Hors-Ligne Robuste** | Fonctionne 30j sans connexion | Token offline + cache local |

---

## 📞 SUPPORT & DOCUMENTATION

Pour questions:
- **Diagrammes UML**: Voir `docs/ANALYSE_DIAGRAMMES_UML.md`
- **Architecture Sync**: Voir `docs/ADRs.md` (ADR-003, ADR-005)
- **Configuration Swagger**: Voir `src/config/swagger.config.ts`
- **Tests**: Voir `src/**/*.spec.ts` (Jest)
- **FAQ**: Voir `FAQ.md`
