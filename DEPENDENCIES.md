# 📦 Package.json - Scripts et Dépendances

Ce fichier documente la structure complète `package.json` pour le projet AGRI.

## Scripts NPM

```json
{
  "scripts": {
    "prebuild": "rimraf dist",
    "build": "nest build",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:debug": "nest start --debug --watch",
    "start:prod": "node dist/main",
    
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix",
    "typecheck": "tsc --noEmit",
    
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:e2e": "jest --config ./test/jest-e2e.json",
    
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev --name",
    "prisma:migrate:prod": "prisma migrate deploy",
    "prisma:studio": "prisma studio",
    "prisma:seed": "ts-node prisma/seed.ts",
    
    "db:push": "prisma db push",
    "db:reset": "prisma migrate reset",
    "db:seed": "npm run prisma:seed",
    
    "docker:build": "docker build -t agri-backend .",
    "docker:run": "docker run -p 3000:3000 agri-backend",
    "docker:compose": "docker-compose up -d",
    "docker:compose:stop": "docker-compose down",
    
    "format": "prettier --write \"src/**/*.ts\" \"test/**/*.ts\""
  }
}
```

## Dépendances Principales

```json
{
  "dependencies": {
    "@nestjs/axios": "^3.0.1",
    "@nestjs/bull": "^10.0.1",
    "@nestjs/common": "^10.3.0",
    "@nestjs/config": "^3.1.1",
    "@nestjs/core": "^10.3.0",
    "@nestjs/jwt": "^11.0.1",
    "@nestjs/passport": "^10.0.3",
    "@nestjs/platform-express": "^10.3.0",
    "@nestjs/swagger": "^7.1.17",
    "@nestjs/terminus": "^10.0.1",
    "@prisma/client": "^5.7.1",
    "bcrypt": "^5.1.1",
    "bull": "^4.11.5",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.0",
    "helmet": "^7.1.0",
    "joi": "^17.11.0",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1",
    "pino": "^8.17.2",
    "pino-http": "^8.5.0",
    "redis": "^4.6.12",
    "reflect-metadata": "^0.1.13",
    "rimraf": "^5.0.5",
    "rxjs": "^7.8.1",
    "swagger-ui-express": "^7.0.0",
    "uuid": "^9.0.1"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.3.2",
    "@nestjs/schematics": "^10.0.3",
    "@nestjs/testing": "^10.3.0",
    "@types/bcrypt": "^5.0.2",
    "@types/express": "^4.17.21",
    "@types/jest": "^29.5.11",
    "@types/node": "^20.10.6",
    "@types/passport-jwt": "^3.0.13",
    "@types/supertest": "^6.0.2",
    "@typescript-eslint/eslint-plugin": "^6.17.0",
    "@typescript-eslint/parser": "^6.17.0",
    "eslint": "^8.56.0",
    "eslint-config-prettier": "^9.1.0",
    "eslint-plugin-prettier": "^5.1.2",
    "jest": "^29.7.0",
    "prettier": "^3.1.1",
    "prisma": "^5.7.1",
    "supertest": "^6.3.3",
    "ts-jest": "^29.1.1",
    "ts-loader": "^9.5.1",
    "ts-node": "^10.9.2",
    "typescript": "^5.3.3"
  }
}
```

## Versions Node

```json
{
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  }
}
```

## Explication Dépendances Clés

### Framework & Core
- **@nestjs/common, @nestjs/core**: Framework principal
- **@nestjs/platform-express**: Middleware Express (server HTTP)
- **reflect-metadata, rxjs**: Dépendances NestJS internes

### Authentification & Sécurité
- **@nestjs/jwt, @nestjs/passport**: JWT + Passport.js
- **passport-jwt**: Stratégie JWT pour Passport
- **bcrypt**: Hachage mot de passe
- **helmet**: Headers de sécurité HTTP

### Base de Données
- **@prisma/client**: Client ORM
- **prisma**: CLI Prisma (migrations, studio)

### Validation & Config
- **class-validator, class-transformer**: Validation DTOs
- **joi**: Validation variables d'environnement
- **@nestjs/config**: Gestion configuration

### Queue & Cache
- **bull, @nestjs/bull**: Queue jobs
- **redis**: Cache + transport queue

### API & Documentation
- **@nestjs/swagger, swagger-ui-express**: Swagger/OpenAPI
- **@nestjs/axios**: HTTP client

### Observabilité
- **@nestjs/terminus**: Health checks
- **pino, pino-http**: Logging structuré

### Utilitaires
- **uuid**: Génération UUIDs (pour idempotence sync)
- **rimraf**: Nettoyage dossiers (build)

### Dev Dependencies
- **@nestjs/cli**: Code generation
- **jest, ts-jest**: Tests
- **supertest**: HTTP testing
- **eslint, prettier**: Linting & formatting
- **ts-node**: Exécution TypeScript direct
- **TypeScript**: Compilation TS

---

## Installation Complète

```bash
# Cloner le repo
git clone https://github.com/agri-intelligent/agri_backend.git
cd agri_backend

# Installer les dépendances
npm install

# Générer Prisma client
npm run prisma:generate

# Créer BD et peupler données test
docker-compose up -d postgres redis
npm run db:push
npm run prisma:seed

# Démarrer dev server
npm run start:dev
```

---

## Vérification Versions

```bash
# Checker versions installées
npm list @nestjs/core
npm list prisma

# Checker outdate packages
npm outdated
```

---

## Migration Versions

Quand upgrader les dépendances:

```bash
# Voir versions disponibles
npm view @nestjs/core versions

# Upgrader une dépendance
npm install @nestjs/core@latest

# Upgrader toutes les dépendances (attention: breaking changes possibles)
npm update

# Audit sécurité
npm audit
npm audit fix
```

---

## Dépendances Optionnelles (Futures)

À ajouter pour les phases suivantes:

```json
{
  "optional": {
    "@nestjs/graphql": "^12.0.0",
    "apollo-server-express": "^3.12.0",
    "graphql": "^16.8.1",
    "ioredis": "^5.3.2",
    "@elastic/elasticsearch": "^8.11.0",
    "winston": "^3.11.0",
    "winston-elasticsearch": "^0.17.4",
    "@sentry/node": "^7.84.0",
    "dataloader": "^2.2.2"
  }
}
```

### Quand ajouter:
- **GraphQL**: Requêtes flexibles pour mobile (à explorer)
- **elasticsearch**: Recherche avancée annonces
- **winston**: Logging plus avancé
- **Sentry**: Error tracking production
- **dataloader**: Optimisation N+1 queries

---

## Notes Importantes

1. **Pinned Versions**: Les versions sont pinned `^X.Y.Z` pour stabilité
2. **Security Audits**: Lancer `npm audit` régulièrement
3. **Node Version**: Utiliser Node 18+ (LTS actuel)
4. **Prisma Migrations**: Ne jamais skip migrations en production
5. **Development**: Certains packages dev-only (`@types/*`, `jest`, etc.)

---

Pour l'installation initiale complète, voir [CONTRIBUTING.md](CONTRIBUTING.md#setup-initial).
