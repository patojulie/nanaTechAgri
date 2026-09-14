# 🔄 Guide Rapide Migration Prisma → TypeORM

## Pattern de Conversion

### Avant (Prisma)
```typescript
import { PrismaService } from '../database/prisma.service';

constructor(private prisma: PrismaService) {}

// Create
const item = await this.prisma.entityName.create({
  data: { ...data }
});

// Find
const item = await this.prisma.entityName.findUnique({
  where: { id }
});

// Update
const item = await this.prisma.entityName.update({
  where: { id },
  data: updateData
});

// Delete
await this.prisma.entityName.delete({
  where: { id }
});
```

### Après (TypeORM)
```typescript
import { TypeOrmService } from '../database/typeorm.service';

constructor(private typeorm: TypeOrmService) {}

// Create
const item = await this.typeorm.entityName.save(
  this.typeorm.entityName.create({ ...data })
);

// Find
const item = await this.typeorm.entityName.findOne({
  where: { id }
});

// Update (Fetch, modify, save)
const item = await this.typeorm.entityName.findOne({ where: { id } });
Object.assign(item, updateData);
const updated = await this.typeorm.entityName.save(item);

// Delete
const item = await this.typeorm.entityName.findOne({ where: { id } });
await this.typeorm.entityName.remove(item);
```

## Services à Migrer (10 restants)

1. ✅ auth.service.ts - DONE
2. ✅ users.service.ts - DONE
3. ✅ producteurs.service.ts - DONE
4. ⏳ exploitations.service.ts - FAIRE
5. ⏳ annonces.service.ts - FAIRE
6. ⏳ agents.service.ts - FAIRE
7. ⏳ sync.service.ts - FAIRE (CRITQUE!)
8. ⏳ health.controller.ts - FAIRE
9. ⏳ strategies/jwt.strategy.ts - FAIRE
10. ⏳ guards/jwt-auth.guard.ts - FAIRE

## Replaces Automatiques

```bash
# Find all Prisma references
grep -r "PrismaService" src/

# Replace in all service files
sed -i 's/PrismaService/TypeOrmService/g' src/**/*.service.ts
sed -i 's/this.prisma/this.typeorm/g' src/**/*.service.ts

# Fix findUnique → findOne
sed -i 's/findUnique/findOne/g' src/**/*.service.ts
sed -i 's/.create({\s*data:/.create(/g' src/**/*.service.ts
sed -i 's/})\s*}/}/g' src/**/*.service.ts
```

## Patterns Clés

### Find All avec Pagination
```typescript
// Prisma
const items = await this.prisma.item.findMany({ skip, take });

// TypeORM
const items = await this.typeorm.item.find({ skip, take });
```

### Update avec Transaction
```typescript
// Prisma
await this.prisma.$transaction([...])

// TypeORM
await this.typeorm.transaction(async () => { ... })
```

### Relations
```typescript
// Prisma: Relations chargées automatiquement par défaut (select)
// TypeORM: Utiliser leftJoinAndSelect ou relations: ['relation']
```

## Priorité Migration

1. **CRITIQUE**: sync.service.ts (nombreux appels Prisma)
2. **HAUTE**: agents.service.ts (offline tokens)
3. **HAUTE**: annonces.service.ts (marketplace)
4. **MOYENNE**: exploitations.service.ts
5. **BASSE**: health.controller.ts, strategies, guards

## Command pour Bulk Migrate

```bash
# After manual fixes, verify no Prisma references remain
grep -r "prisma\." src/ | grep -v node_modules | wc -l
# Should return 0

# Verify TypeORM usage
grep -r "typeorm\." src/ | grep -v node_modules | wc -l
# Should be high (all service methods)
```
