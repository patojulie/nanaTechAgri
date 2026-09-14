# 📐 Guide Création de Modules - Patterns & Templates

Ce guide vous aide à créer de nouveaux modules en suivant les patterns établis du projet AGRI.

## 📋 Checklist Nouveau Module

Créer un nouveau module `mon-module`:

- [ ] Créer dossier `src/mon-module/`
- [ ] Créer `mon-module.module.ts`
- [ ] Créer `mon-module.service.ts` (logique métier)
- [ ] Créer `mon-module.controller.ts` (routes HTTP)
- [ ] Créer `dto/mon-module.dto.ts` (validation)
- [ ] Créer `mon-module.spec.ts` (tests unitaires)
- [ ] Créer `README.md` (doc module)
- [ ] Importer module dans `app.module.ts`

## 📂 Structure Standard

```
src/mon-module/
├── mon-module.module.ts        # Déclaration module
├── mon-module.controller.ts    # Routes HTTP (@Post, @Get, etc.)
├── mon-module.service.ts       # Logique métier
├── mon-module.spec.ts          # Tests unitaires
├── dto/
│   ├── create-*.dto.ts         # Validation création (request)
│   ├── update-*.dto.ts         # Validation mise à jour
│   └── *.response.dto.ts       # Response type (output)
└── README.md                   # Documentation module
```

## 🔧 Template Module

### 1. `.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { MonModuleService } from './mon-module.service';
import { MonModuleController } from './mon-module.controller';

@Module({
  imports: [DatabaseModule],
  providers: [MonModuleService],
  controllers: [MonModuleController],
  exports: [MonModuleService], // Exporter si réutilisé par autres modules
})
export class MonModuleModule {}
```

### 2. `.service.ts` - Logique Métier

```typescript
import { Injectable, Logger, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateMonModuleDto, UpdateMonModuleDto, MonModuleResponseDto } from './dto/mon-module.dto';

@Injectable()
export class MonModuleService {
  private logger = new Logger('MonModuleService');

  constructor(private prisma: PrismaService) {}

  /**
   * Créer une entité
   * @throws ConflictException si déjà existe
   */
  async create(createDto: CreateMonModuleDto): Promise<MonModuleResponseDto> {
    try {
      const item = await this.prisma.monEntite.create({
        data: {
          // Mapping DTOs → Prisma
          ...createDto,
        },
      });

      this.logger.log(`Item créé: ${item.id}`);
      return this.formatResponse(item);
    } catch (error) {
      if (error.code === 'P2002') {
        // Unique constraint
        throw new ConflictException('Cet item existe déjà');
      }
      this.logger.error(`Erreur création: ${error.message}`);
      throw new BadRequestException('Erreur lors de la création');
    }
  }

  /**
   * Récupérer par ID
   * @throws NotFoundException si non trouvé
   */
  async findById(id: string): Promise<MonModuleResponseDto> {
    const item = await this.prisma.monEntite.findUnique({
      where: { id },
    });

    if (!item) {
      throw new NotFoundException(`Item ${id} non trouvé`);
    }

    return this.formatResponse(item);
  }

  /**
   * Lister avec pagination
   */
  async findAll(skip = 0, take = 10): Promise<MonModuleResponseDto[]> {
    const items = await this.prisma.monEntite.findMany({
      skip,
      take,
      orderBy: { dateCreation: 'desc' },
    });

    return items.map((item) => this.formatResponse(item));
  }

  /**
   * Mettre à jour
   * @throws NotFoundException si non trouvé
   */
  async update(id: string, updateDto: UpdateMonModuleDto): Promise<MonModuleResponseDto> {
    try {
      const item = await this.prisma.monEntite.update({
        where: { id },
        data: updateDto,
      });

      this.logger.log(`Item mis à jour: ${id}`);
      return this.formatResponse(item);
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Item ${id} non trouvé`);
      }
      throw new BadRequestException('Erreur lors de la mise à jour');
    }
  }

  /**
   * Supprimer
   * @throws NotFoundException si non trouvé
   */
  async delete(id: string): Promise<void> {
    try {
      await this.prisma.monEntite.delete({
        where: { id },
      });

      this.logger.log(`Item supprimé: ${id}`);
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Item ${id} non trouvé`);
      }
      throw new BadRequestException('Erreur lors de la suppression');
    }
  }

  /**
   * Formater la réponse (DTO output)
   * - Exclure données sensibles
   * - Mapper champs internes
   */
  private formatResponse(item: any): MonModuleResponseDto {
    return {
      id: item.id,
      // ... autres champs
      dateCreation: item.dateCreation,
      dateModification: item.dateModification,
    };
  }
}
```

### 3. `.controller.ts` - Routes HTTP

```typescript
import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Req, Query, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam } from '@nestjs/swagger';
import { MonModuleService } from './mon-module.service';
import { CreateMonModuleDto, UpdateMonModuleDto, MonModuleResponseDto } from './dto/mon-module.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('MonModule')
@Controller('mon-module')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MonModuleController {
  constructor(private monModuleService: MonModuleService) {}

  @Post()
  @Roles(Role.ADMIN, Role.PRODUCTEUR) // Seulement ces rôles
  @UseGuards(RolesGuard)
  @HttpCode(201)
  @ApiOperation({ summary: 'Créer un item' })
  @ApiResponse({ status: 201, type: MonModuleResponseDto })
  async create(@Body() createDto: CreateMonModuleDto): Promise<MonModuleResponseDto> {
    return this.monModuleService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister tous les items' })
  @ApiResponse({ type: [MonModuleResponseDto] })
  async findAll(
    @Query('skip') skip = 0,
    @Query('take') take = 10,
  ): Promise<MonModuleResponseDto[]> {
    return this.monModuleService.findAll(skip, take);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir un item par ID' })
  @ApiParam({ name: 'id', description: 'ID de l\'item' })
  @ApiResponse({ type: MonModuleResponseDto })
  async findById(@Param('id') id: string): Promise<MonModuleResponseDto> {
    return this.monModuleService.findById(id);
  }

  @Put(':id')
  @Roles(Role.ADMIN, Role.PRODUCTEUR)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Mettre à jour un item' })
  @ApiResponse({ type: MonModuleResponseDto })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateMonModuleDto,
  ): Promise<MonModuleResponseDto> {
    return this.monModuleService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Supprimer un item' })
  @HttpCode(204)
  async delete(@Param('id') id: string): Promise<void> {
    return this.monModuleService.delete(id);
  }
}
```

### 4. `dto/mon-module.dto.ts` - Validation & Response

```typescript
import { IsString, IsEmail, IsOptional, MinLength, MaxLength, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO Création - Validation request body
 */
export class CreateMonModuleDto {
  @ApiProperty({ example: 'John', description: 'Prénom' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  prenom: string;

  @ApiProperty({ example: 'john@example.com', description: 'Email unique' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 25, description: 'Âge en années' })
  @IsNumber()
  @Min(0)
  @Max(120)
  age: number;

  @ApiProperty({ example: 'Note optionnelle', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  notes?: string;
}

/**
 * DTO Mise à jour - Champs optionnels
 */
export class UpdateMonModuleDto {
  @ApiProperty({ example: 'John', required: false })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @IsOptional()
  prenom?: string;

  @ApiProperty({ example: 26, required: false })
  @IsNumber()
  @Min(0)
  @Max(120)
  @IsOptional()
  age?: number;

  @ApiProperty({ example: 'Note mise à jour', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}

/**
 * DTO Response - Output de l'API
 * ⚠️ Exclure données sensibles (mots de passe, tokens, etc.)
 */
export class MonModuleResponseDto {
  @ApiProperty({ description: 'ID unique' })
  id: string;

  @ApiProperty({ description: 'Prénom' })
  prenom: string;

  @ApiProperty({ description: 'Email (non sensible dans ce cas)' })
  email: string;

  @ApiProperty({ description: 'Âge' })
  age: number;

  @ApiProperty({ required: false })
  notes?: string;

  @ApiProperty({ description: 'Date de création' })
  dateCreation: Date;

  @ApiProperty({ description: 'Dernière modification' })
  dateModification: Date;
}
```

### 5. `.spec.ts` - Tests Unitaires

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { MonModuleService } from './mon-module.service';
import { PrismaService } from '../database/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('MonModuleService', () => {
  let service: MonModuleService;
  let prisma: PrismaService;

  const mockPrismaService = {
    monEntite: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MonModuleService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<MonModuleService>(MonModuleService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create an item', async () => {
      const createDto = { prenom: 'John', email: 'john@example.com', age: 25 };
      const mockItem = { id: '1', ...createDto, dateCreation: new Date() };

      mockPrismaService.monEntite.create.mockResolvedValue(mockItem);

      const result = await service.create(createDto);

      expect(result).toEqual(mockItem);
      expect(prisma.monEntite.create).toHaveBeenCalledWith({
        data: createDto,
      });
    });

    it('should throw ConflictException on duplicate', async () => {
      const createDto = { prenom: 'John', email: 'john@example.com', age: 25 };

      mockPrismaService.monEntite.create.mockRejectedValue({ code: 'P2002' });

      await expect(service.create(createDto)).rejects.toThrow('ConflictException');
    });
  });

  describe('findById', () => {
    it('should find item by id', async () => {
      const mockItem = { id: '1', prenom: 'John', email: 'john@example.com', age: 25 };

      mockPrismaService.monEntite.findUnique.mockResolvedValue(mockItem);

      const result = await service.findById('1');

      expect(result).toEqual(mockItem);
      expect(prisma.monEntite.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrismaService.monEntite.findUnique.mockResolvedValue(null);

      await expect(service.findById('999')).rejects.toThrow(NotFoundException);
    });
  });

  // ... autres tests
});
```

### 6. `README.md` - Documentation Module

```markdown
# Module MonModule

## Description
Gestion des items du système.

## Routes API

### Créer un item
```
POST /api/mon-module
Authorization: Bearer <token>
Content-Type: application/json

{
  "prenom": "John",
  "email": "john@example.com",
  "age": 25
}
```

### Récupérer tous les items
```
GET /api/mon-module?skip=0&take=10
Authorization: Bearer <token>
```

### Récupérer un item
```
GET /api/mon-module/:id
Authorization: Bearer <token>
```

### Mettre à jour un item
```
PUT /api/mon-module/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "prenom": "Jane"
}
```

### Supprimer un item
```
DELETE /api/mon-module/:id
Authorization: Bearer <token>
```

## Règles Métier
- Email doit être unique
- Âge doit être entre 0 et 120
- Prénom requis (min 2 caractères)

## Permissions
- ADMIN: Accès complet (create, read, update, delete)
- PRODUCTEUR: Peut créer et modifier ses items
- Autres: Lecture seulement

## Erreurs Possibles
- `409 Conflict`: Email déjà existant
- `404 Not Found`: Item non trouvé
- `400 Bad Request`: Validation échouée
- `401 Unauthorized`: Token absent ou expiré
- `403 Forbidden`: Permissions insuffisantes

## Dépendances
- PrismaService: Accès BD
- JwtAuthGuard: Authentification
- RolesGuard: Autorisation

## Exemples

### cURL
```bash
# Créer
curl -X POST http://localhost:3000/api/mon-module \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"prenom":"John","email":"john@example.com","age":25}'

# Récupérer
curl http://localhost:3000/api/mon-module/1 \
  -H "Authorization: Bearer $TOKEN"
```

### JavaScript (Fetch)
```javascript
const token = 'your_jwt_token';

// Créer
const res = await fetch('http://localhost:3000/api/mon-module', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ prenom: 'John', email: 'john@example.com', age: 25 })
});

const item = await res.json();
console.log(item);
```
```

## ✅ Checklist Complétion

Avant de fusionner votre module:

- [ ] Service implémenté avec logique métier
- [ ] Controller avec routes et guards
- [ ] DTOs avec validation class-validator
- [ ] Tests unitaires (>80% couverture)
- [ ] Logger sur actions critiques
- [ ] Gestion d'erreurs complète
- [ ] Docs Swagger via ApiProperty
- [ ] README module
- [ ] Module importé dans app.module.ts
- [ ] Seed data si nécessaire

## 🎯 Points Importants

1. **Validation**: Toujours valider inputs avec class-validator
2. **Erreurs**: Utiliser exceptions NestJS (NotFoundException, BadRequestException, etc.)
3. **Logging**: Logger les actions importantes et erreurs
4. **Tests**: Tester happy path + error cases
5. **Prisma**: Utiliser select/include pour éviter over-fetching
6. **DTO Output**: Exclure données sensibles (mots de passe, secrets)
7. **Permissions**: Vérifier @Roles + @UseGuards(RolesGuard)
8. **Pagination**: Implémenter skip/take sur GET /
9. **Docs Swagger**: Ajouter @ApiOperation, @ApiResponse, @ApiParam
10. **Timestamps**: Laisser Prisma gérer dateCreation/dateModification

---

Pour plus d'info, voir CONTRIBUTING.md et les modules existants (producteurs/, annonces/, etc.).
