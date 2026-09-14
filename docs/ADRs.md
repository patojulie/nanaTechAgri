# ADR-001: Monolithe Modulaire vs Microservices

## Date
2024-01-15

## Status
ACCEPTÉE

## Context
La plateforme AGRI doit servir 5 acteurs métier (Producteur, Agent, Coopérative, Acheteur, Admin) avec des entités partagées (Utilisateur, Exploitation, Annonce, etc.). Deux approches possibles : monolithe modulaire ou microservices.

## Decision
**Monolithe modulaire NestJS** au stade MVP.

## Rationale
- **Complexité opérationnelle**: Microservices ajoute DevOps, déploiement, monitoring distribué (overkill pour MVP)
- **Entités partagées**: Producteur, Exploitation, Annonce sont utilisés par plusieurs acteurs → forte cohésion de domaine
- **Scalabilité future**: Structure modulaire (modules NestJS indépendants) permet extraction future en microservices sans refactoring majeur
- **Développement rapide**: Itération plus rapide, debugging plus facile, transactions ACID garanties
- **Performance**: Pas de latence réseau inter-services

## Consequences
- ✅ Plus rapide au MVP
- ✅ Transactions ACID fiables
- ❌ Évolutivité limitée si un seul module devient goulet (mitigué par architecture)
- ❌ Dépendance à une seule BD PostgreSQL (OK pour la phase 1)

## Alternatives Considered
1. **Microservices immédiat**: Rejeté (trop complexe pour MVP, pas de bénéfice prouvé)
2. **Monolithe monolithique**: Rejeté (peu flexible, difficulté à extraire modules)

---

# ADR-002: JWT + Refresh Token Rotation

## Date
2024-01-15

## Status
ACCEPTÉE

## Context
Authentification utilisateurs avec support offline pour agents de terrain (tokens valides 30 jours).

## Decision
**JWT avec deux tokens**:
- **Access Token**: Courte durée (15 min), révoqué à l'expiration
- **Refresh Token**: Longue durée (7 jours), rotation à chaque utilisation
- **Token Agent Offline**: Longue durée (30 jours), révocation côté serveur possible

## Rationale
- **Sécurité**: Access token court minimise l'exposition en cas de vol
- **UX**: Refresh token évite reconnexion fréquente
- **Offline Agent**: Token longue durée permet offline prolongé, révocation serveur permet suspension d'agent
- **Stateless**: JWT permet pas de session serveur (scalabilité)

## Implementation
```typescript
// auth.service.ts
const accessToken = this.jwtService.sign(payload, { expiresIn: 900 }); // 15 min
const refreshToken = this.jwtService.sign(payload, { 
  secret: JWT_REFRESH_SECRET, 
  expiresIn: 604800 
}); // 7 jours
const offlineToken = this.jwtService.sign({ ...payload, type: 'offline-agent' }, 
  { expiresIn: 2592000 }); // 30 jours
```

## Consequences
- ✅ Compromis sécurité/UX optimal
- ✅ Support offline robuste
- ⚠️ Nécessite deux secrets JWT (gérer en production)
- ⚠️ Refresh token stocké côté client (s'assurer HTTPS + secure cookies)

---

# ADR-003: Last-Write-Wins (LWW) pour Synchronisation Offline

## Date
2024-01-15

## Status
ACCEPTÉE

## Context
Agents de terrain synchronisent données collectées hors-ligne. Que faire si deux mises à jour hors-ligne modifient le même objet avant sync?

## Decision
**Last-Write-Wins (LWW) avec horodatage**:
- Chaque opération porte un timestamp créé côté client
- En cas de conflit: version avec timestamp plus récent l'emporte
- Historique conservé pour audit (AuditLog)

## Rationale
- **Simple**: Pas de résolution complexe de conflits
- **Déterministe**: Même résultat indépendamment de l'ordre d'arrivée au serveur
- **Offline-friendly**: Agents ne doivent pas attendre résolution
- **Audit**: Historique permet investigation conflits

## Alternatives Considered
1. **Reject on conflict**: Trop stricte pour offline (forcerait retry par utilisateur)
2. **Custom resolution**: Trop complexe, nécessite domaine expertise
3. **Vector Clocks**: Overkill pour MVP, complique client

## Consequences
- ✅ Simple à implémenter
- ✅ Non-bloquant pour agents
- ❌ Perte possible de données (dernière écriture gagne), mais Acceptable pour MVP + audit trail
- ⚠️ Nécessite synchronisation temps client/serveur (NTP recommandée)

---

# ADR-004: Architecture Adaptateurs pour Notifications Multicanal

## Date
2024-01-15

## Status
ACCEPTÉE

## Context
Système doit supporter SMS, USSD, vocal, push, email. Chaque canal a API différente (Twilio, Africa's Talking, IVR propriétaire, Firebase).

## Decision
**Pattern Adaptateur** avec interface commune `NotificationProvider`:

```typescript
interface NotificationProvider {
  send(message: NotificationMessage): Promise<void>;
  getStatus(messageId: string): Promise<MessageStatus>;
}

// Implémentations concrètes
class TwilioSMSProvider implements NotificationProvider { ... }
class AfricasTalkingUSSDProvider implements NotificationProvider { ... }
class FirebasePushProvider implements NotificationProvider { ... }
```

File d'attente (BullMQ + Redis) découple API des envois.

## Rationale
- **Flexibilité**: Ajouter nouveau canal = implémenter une interface
- **Découplage**: API n'attend pas les appels SMS/USSD (pas de timeout API)
- **Retries**: BullMQ gère retries automatiques + fallback canaux
- **Monitoring**: Queue observable, métriques sur livraison

## Consequences
- ✅ Scalable à nouveaux canaux
- ✅ Non-bloquant pour requêtes HTTP
- ❌ Complexité ajoutée (Redis, BullMQ)
- ⚠️ Nécessite config par provider (credentials API)

---

# ADR-005: Idempotence via UUID Unique Client (JournalSynchronisation)

## Date
2024-01-15

## Status
ACCEPTÉE

## Context
Synchronisation offline: agent envoie batch d'opérations (create/update/delete). Réseau non-fiable → possibilité de retry involontaire → risque de duplication.

## Decision
**Chaque batch génère UUID unique côté client** (`idClientGenere`). Serveur vérifie unicité:
- 1ère envoi: Processé, statut enregistré en JournalSynchronisation
- Retry (même UUID): Retour résultat précédent, pas de retraitement

```typescript
// sync.service.ts
const existingJournal = await prisma.journalSynchronisation.findUnique({
  where: { idClientGenere } // Unique constraint
});
if (existingJournal) return previousResult; // Idempotence
```

## Rationale
- **Fiabilité**: Retries réseau sûrs (pas de duplication)
- **Simple**: UUID génération triviale côté client
- **Traçabilité**: JournalSynchronisation enregistre tous les attempts

## Consequences
- ✅ Requêtes idempotentes (propriété REST)
- ✅ Sûr pour retries automatiques
- ⚠️ UUID doit être unique côté client (v4 crypto recommandée)
- ⚠️ Serveur doit conserver historique (disk space pour gros volumes)

---

# ADR-006: Prisma comme ORM

## Date
2024-01-15

## Status
ACCEPTÉE

## Context
Choix d'ORM pour NestJS: Prisma vs TypeORM?

## Decision
**Prisma** avec schéma déclaratif (schema.prisma).

## Rationale
- **Schéma déclaratif**: Lisible, proche de vos diagrammes UML
- **Type-safe**: Auto-génération client TS exact
- **Migrations versionnées**: Prisma Migrate simple et fiable
- **Developer Experience**: CLI excellent (studio, seed, push)
- **Avenir**: Prisma continue à matcher vos besoins

## Alternatives Considered
- **TypeORM**: Plus verbeux (decorators), migration plus lourde
- **Sequelize**: JS-first, moins type-safe

## Consequences
- ✅ Schéma central, source de vérité
- ✅ Migrations simples
- ❌ Moins flexible que queries manuelles (OK pour 90% des cas)
- ⚠️ Raw queries si besoin: `prisma.$queryRaw`

---

# ADR-007: Structure des Modules: Controller → Service → Repository

## Date
2024-01-15

## Status
ACCEPTÉE

## Context
Organisation interne chaque module.

## Decision
**Trois couches**:
1. **Controller**: HTTP routes, validation DTO, appels service
2. **Service**: Logique métier, appels repository
3. **Repository (via Prisma)**: Accès BD directement

```
producteurs.module.ts
├── producteurs.controller.ts  (routes, validation)
├── producteurs.service.ts     (logique: chiffrement pieceId, validation)
├── dto/
│   └── productor.dto.ts       (validation input/output)
└── producteurs.spec.ts        (tests unitaires)
```

## Rationale
- **Testabilité**: Service testable sans HTTP (unit tests)
- **Séparation concerns**: Chaque couche responsabilité claire
- **Réutilisabilité**: Service réutilisable (API GraphQL future, jobs, etc.)

## Consequences
- ✅ Code organisé, testable
- ✅ Facile à onboard nouveaux devs
- ❌ Plus de fichiers (3-4 par fonctionnalité)

---

# ADR-008: Validation Globale avec class-validator + ValidationPipe

## Date
2024-01-15

## Status
ACCEPTÉE

## Context
Validation input utilisateur (emails, numéros, ranges, etc.).

## Decision
**Validation déclarative** via decorators + `ValidationPipe` global:

```typescript
export class CreateProductorDto {
  @IsString()
  @MinLength(2)
  nom: string;

  @IsEmail()
  email: string;

  @IsNumber()
  @Min(0)
  @Max(120)
  age: number;
}

// main.ts
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true
}));
```

## Rationale
- **Déclaratif**: Validation lisible dans les DTOs
- **Réutilisable**: Mêmes DTOs pour tous les endpoints
- **Sécurité**: `whitelist` + `forbidNonWhitelisted` évite injection
- **Cohérent**: Standard NestJS

## Consequences
- ✅ Validation centralisée, facile à maintenir
- ✅ Messages d'erreur standardisés
- ❌ Overhead mineur (transform, whitelist check)

---

Pour plus de détails ou pour ajouter des ADRs, voir la documentation du projet.
