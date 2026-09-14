import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';

/**
 * Configuration Swagger centralisée pour la Plateforme Agricole Intelligente
 * 
 * Cette configuration crée une documentation API complète avec:
 * - Tags pour chaque module
 * - Schémas de sécurité JWT
 * - Exemples de réponses
 * - Groupes d'endpoints
 * 
 * Accès: http://localhost:3000/api/docs
 */
export function setupSwagger(app: INestApplication, apiPrefix: string): void {
  const config = new DocumentBuilder()
    // Informations générales
    .setTitle('🌾 AGRI Intelligent Platform - API Documentation')
    .setDescription(
      `
API Backend pour la Plateforme Agricole Intelligente
      
**Architecture**: Monolithe modulaire NestJS avec support offline pour agents de terrain

**5 Acteurs Métier**:
- 🚜 Producteur Agricole - Créer exploitations et annonces
- 🚁 Agent de Terrain - Collecte données hors-ligne (30 jours)
- 🛒 Acheteur - Rechercher et acheter produits
- 🤝 Coopérative - Superviser et valider producteurs
- ⚙️ Administrateur - Gestion système et audit

**Fonctionnalités Clés**:
- JWT Authentication (Access + Refresh + Offline tokens)
- RBAC (Role-Based Access Control) avec 5 rôles
- Synchronisation offline idempotente (Last-Write-Wins)
- Marketplace complet avec mise en relation
- Audit trail complet
- Validation globale avec class-validator

**Sécurité**:
- Helmet pour headers sécurité
- CORS configurable
- Rate limiting (Throttler)
- Validation DTOs avec whitelist
- Hachage passwords avec bcrypt

**Documentation**:
- [Architecture Decision Records](./docs/ADRs.md)
- [Analyse Diagrammes UML](./docs/ANALYSE_DIAGRAMMES_UML.md)
- [README](./README.md)
- [Contributing Guide](./CONTRIBUTING.md)

**Déploiement**:
- Docker multi-stage ready
- PostgreSQL 14+
- Redis pour cache/sessions
- GitHub Actions CI/CD
    `,
    )
    .setVersion('0.1.0')
    .setContact(
      'AGRI Intelligent',
      'https://agri-intelligent.com',
      'support@agri-intelligent.com',
    )
    .setLicense(
      'MIT',
      'https://opensource.org/licenses/MIT',
    )
    .setBasePath(apiPrefix)
    .setExternalDoc(
      'Documentation Complète',
      './docs/ANALYSE_DIAGRAMMES_UML.md',
    )

    // Authentification JWT
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT access token (durée: 15 minutes)',
        name: 'Authorization',
        in: 'header',
      },
      'access-token',
    )
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT offline token pour agents de terrain (durée: 30 jours)',
        name: 'Authorization',
        in: 'header',
      },
      'offline-token',
    )

    // Tags avec descriptions
    .addTag(
      'Auth',
      'Authentification et autorisation - Login, Register, Refresh tokens',
    )
    .addTag(
      'Users',
      'Gestion des utilisateurs - CRUD utilisateurs',
    )
    .addTag(
      'Producteurs',
      'Gestion profils producteurs agricoles - Données producteurs, zones géographiques',
    )
    .addTag(
      'Exploitations',
      'Gestion exploitations agricoles (fermes) - Fermes, superficies, activités',
    )
    .addTag(
      'Annonces',
      'Marketplace - Annonces de produits à vendre',
    )
    .addTag(
      'Mises-en-Relation',
      'Mise en relation producteur ↔ acheteur - Demandes d\'achat',
    )
    .addTag(
      'Agents',
      'Agents de terrain - Tokens offline, gestion agents',
    )
    .addTag(
      'Sync',
      '⭐ SYNCHRONISATION OFFLINE - Batch sync, idempotence, Last-Write-Wins',
    )
    .addTag(
      'Cooperatives',
      'Coopératives - Supervision producteurs, validation annonces',
    )
    .addTag(
      'Acheteurs',
      'Acheteurs - Recherche, panier, mise en relation',
    )
    .addTag(
      'Admin',
      '🔐 ADMINISTRATION - Gestion utilisateurs, audit, statistiques',
    )
    .addTag(
      'Notifications',
      'Notifications multicanal - Email, SMS, Push',
    )
    .addTag(
      'Export',
      'Export données - CSV, Excel, PDF',
    )
    .addTag(
      'Health',
      'Health checks - Liveness, readiness probes (Kubernetes)',
    )

    // Schémas réutilisables
    .addApiKey(
      { type: 'apiKey', in: 'header', name: 'X-API-Key' },
      'api-key',
    )

    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Configuration UI Swagger
  SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
    swaggerOptions: {
      // UI Options
      persistAuthorization: true,
      displayOperationId: false,
      displayRequestDuration: true,
      filter: true,
      showRequestHeaders: true,
      docExpansion: 'list',
      defaultModelsExpandDepth: 1,
      defaultModelExpandDepth: 1,

      // Scheme/Protocol
      schemes: ['http', 'https'],
      deepLinking: true,
      syncUrlWithStoredSwaggerConfig: true,
      tryItOutEnabled: true,
      requestSnippetsEnabled: true,
      validatorUrl: 'https://validator.swagger.io',
      supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch', 'head', 'options', 'trace'],
    },
    customCss: `
      body {
        margin: 0;
        background: #f5f5f5;
      }
      .topbar {
        display: none;
      }
    `,
    customSiteTitle: 'AGRI Intelligent - API Docs',
  });

  console.log(`
  ╔════════════════════════════════════════════════════════════╗
  ║                                                            ║
  ║   📚 Swagger Documentation prête!                          ║
  ║                                                            ║
  ║   Accès: http://localhost:3000/${apiPrefix}/docs           ║
  ║                                                            ║
  ║   ✅ ${document.tags.length} Tags configurés                       ║
  ║   ✅ Sécurité: JWT Bearer Auth (Access + Offline)         ║
  ║   ✅ Exemples de réponses inclus                           ║
  ║   ✅ RBAC matrice d'accès documentée                       ║
  ║                                                            ║
  ╚════════════════════════════════════════════════════════════╝
  `);
}
