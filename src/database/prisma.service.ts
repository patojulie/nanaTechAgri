// DEPRECATED: Le projet utilise maintenant TypeORM au lieu de Prisma
// Ce fichier est conservé pour compatibilité mais n'est plus utilisé
// Voir typeorm.service.ts pour les opérations de base de données

import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class PrismaService {
  private logger = new Logger('PrismaService');

  constructor() {
    this.logger.warn('⚠️  PrismaService est déprécié - utilisez TypeOrmService à la place');
  }
}
