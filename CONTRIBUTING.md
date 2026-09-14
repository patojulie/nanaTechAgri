# Guide de Contribution - AGRI Backend

Merci de contribuer à AGRI Intelligent Platform! Ce guide vous aidera à configurer votre environnement de développement et à contribuer efficacement.

## 🚀 Setup Initial

### 1. Cloner et installer

```bash
git clone https://github.com/agri-intelligent/agri_backend.git
cd agri_backend

# Installer dépendances
npm install

# Copier variables d'environnement
cp .env.example .env
```

### 2. Setup base de données

Deux options:

**Option A: Avec Docker (Recommandé)**
```bash
docker-compose up -d postgres redis

# Attendre que postgres soit prêt (~10s)
npm run prisma:generate
npm run db:push
npm run prisma:seed
```

**Option B: PostgreSQL/Redis locaux**
```bash
# Éditer .env avec vos credentials
DATABASE_URL="postgresql://your_user:your_password@localhost:5432/agri_db"
REDIS_URL="redis://localhost:6379"

npm run prisma:generate
npm run db:push
npm run prisma:seed
```

### 3. Démarrer dev server

```bash
npm run start:dev

# Vérifie via Swagger
curl http://localhost:3000/api/docs
```

## 📝 Conventions de Code

### Nommage
- **Variables/Fonctions**: camelCase
- **Classes**: PascalCase
- **Constantes**: UPPER_SNAKE_CASE
- **Fichiers de service**: `*.service.ts`
- **Fichiers de contrôleur**: `*.controller.ts`
- **Fichiers de DTO**: `dto/*.dto.ts`

### Structure d'un Module
```
src/mon-module/
├── mon-module.module.ts      # Déclaration module
├── mon-module.controller.ts  # Routes HTTP
├── mon-module.service.ts     # Logique métier
├── dto/
│   ├── create-*.dto.ts
│   └── update-*.dto.ts
├── mon-module.spec.ts        # Tests
└── README.md                 # Doc module
```

### Validation
- Utiliser `class-validator` décorateurs dans les DTOs
- Tous les inputs doivent être validés
- Retourner des messages d'erreur clairs

```typescript
export class CreateProductorDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  nom: string;

  @IsEmail()
  email: string;

  @IsNumber()
  @Min(0)
  @Max(120)
  numberOfYears: number;
}
```

### Gestion d'Erreurs
- Lever des exceptions NestJS (BadRequestException, NotFoundException, etc.)
- Inclure des messages d'erreur explicites
- Logger les erreurs importantes

```typescript
if (!user) {
  this.logger.warn(`User not found: ${userId}`);
  throw new NotFoundException(`Utilisateur ${userId} non trouvé`);
}
```

### Logging
```typescript
private logger = new Logger('MonService');

this.logger.log('Action réussie');
this.logger.warn('Attention!');
this.logger.error('Erreur grave', error.stack);
```

## 🧪 Tests

### Écrire des tests unitaires

```typescript
// mon-module.service.spec.ts
describe('MonService', () => {
  let service: MonService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [MonService, { provide: PrismaService, useValue: prismaService }],
    }).compile();

    service = module.get(MonService);
    prisma = module.get(PrismaService);
  });

  it('should create an item', async () => {
    const mockData = { id: '1', nom: 'Test' };
    jest.spyOn(prisma.item, 'create').mockResolvedValue(mockData);

    const result = await service.create(createDto);
    expect(result).toEqual(mockData);
  });
});
```

### Lancer les tests
```bash
npm run test               # Une fois
npm run test:watch        # Mode watch
npm run test:cov          # Avec couverture
```

## 📦 Commits et PRs

### Commit Messages
Suivre [Conventional Commits](https://www.conventionalcommits.org/):
```
feat: ajouter validation des annonces
fix: corriger bug synchronisation offline
docs: documenter module agents
refactor: simplifier sync service
test: ajouter tests d'intégration
chore: mettre à jour dépendances
```

### Créer une PR
1. **Branche**: `feature/feature-name` ou `fix/bug-name`
2. **Tests**: Tous les tests doivent passer
3. **Lint**: `npm run lint` doit réussir
4. **Coverage**: Essayer de maintenir >80%
5. **Description**: Expliquer la motivation, les changes

```markdown
## Description
Détail succinct des changements.

## Type de changement
- [ ] Bug fix
- [ ] Nouvelle fonctionnalité
- [ ] Breaking change
- [ ] Mise à jour documentation

## Checklist
- [ ] Tests unitaires ajoutés
- [ ] Documentation mise à jour
- [ ] Lint réussit
- [ ] Pas de breaking changes
```

## 🎯 Workflow Développement

### 1. Créer une branche
```bash
git checkout -b feature/ma-feature
```

### 2. Faire des changements
```bash
# Éditer les fichiers
npm run start:dev  # Tester en local

# Formater le code
npm run format

# Vérifier les erreurs
npm run typecheck
npm run lint
```

### 3. Tester
```bash
npm run test:watch  # Tests unitaires
npm run test:cov    # Couverture
```

### 4. Commit et push
```bash
git add .
git commit -m "feat: ajouter ma feature"
git push origin feature/ma-feature
```

### 5. Créer une PR sur GitHub
- Décrire les changements
- Référencer les issues liées
- Attendre la review et les CI checks

## 🐛 Déboguer

### VSCode Launch Config
Ajouter à `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Nest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/nest",
  "args": ["start", "--debug", "--watch"],
  "restart": true,
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

### Breakpoints dans VSCode
- Mettre des breakpoints (F9)
- Lancer "Nest Debug"
- Exécuter les requêtes (Postman, curl, etc.)

### Logs structurés
```typescript
this.logger.log('Sync started', { userId, agentId, operationCount: 5 });
```

## 📚 Documentation

### Documenter un module
Créer un `README.md` dans le dossier du module:
```markdown
# Module Producteurs

## Description
Gestion des profils producteurs.

## Routes
- `GET /producteurs/:id` - Récupérer un producteur
- `POST /producteurs` - Créer un producteur
- `PUT /producteurs/:id` - Mettre à jour

## DTOs
- `CreateProductorDto`: Validation création
- `UpdateProductorDto`: Validation mise à jour

## Règles métier
- Numéro de pièce d'identification est chiffré
- Producteur peut créer plusieurs exploitations
```

### Commenter le code complexe
```typescript
/**
 * Synchroniser les opérations hors-ligne
 * 
 * @param userId - ID de l'utilisateur/agent
 * @param syncBatch - Batch avec UUID unique pour idempotence
 * @returns Résultat de sync avec statuts et erreurs
 * 
 * @throws BadRequestException Si entité non supportée
 * 
 * Stratégie: Last-Write-Wins avec horodatage
 */
async syncBatch(userId: string, syncBatch: SyncBatchDto): Promise<SyncResponseDto> {
  // ...
}
```

## ✨ Bonnes Pratiques

1. **DRY (Don't Repeat Yourself)**: Extraire du code réutilisable
2. **SOLID**: Single Responsibility, Open/Closed, etc.
3. **Permissions**: Toujours vérifier @Roles et JwtAuthGuard
4. **Transactions**: Utiliser Prisma transactions pour atomicité
5. **Performance**: Utiliser select/include Prisma pour éviter over-fetching
6. **Type Safety**: Éviter `any`, utiliser les types stricts
7. **Erreurs claires**: Messages d'erreur en français et explicites
8. **Logs**: Logger les actions importantes et erreurs

## 🚨 Points d'Attention

### Migrations Prisma
Toujours commiter `prisma/migrations`:
```bash
npm run prisma:migrate
# Commiter le dossier migrations/ créé
```

### Secrets
Ne jamais commiter `.env`:
```bash
echo ".env" >> .gitignore
cp .env .env.local  # Pour dev local
```

### Breaking Changes
Documenter dans les PRs les breaking changes et versioning.

## 📞 Support

- **Questions**: Créer une issue ou discussion
- **Bugs**: Créer une issue avec reproduction
- **Features**: Proposer dans les discussions

---

Merci de contribuer! 🙌
