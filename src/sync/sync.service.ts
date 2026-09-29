import { Injectable, BadRequestException, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { TypeOrmService } from '../database/typeorm.service';
import { SyncBatchDto, SyncResponseDto, SyncJournalResponseDto } from './dto/sync.dto';
import { StatutSynchronisation } from '../database/entities/journal-synchronisation.entity';
import { v4 as uuidv4 } from 'uuid';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { AgentManagedService } from '../agents/agent-managed.service';
import {
  CreateManagedUserDto,
  UpdateManagedUserDto,
  CreateManagedFarmDto,
  UpdateManagedFarmDto,
} from '../agents/dto/managed.dto';

@Injectable()
export class SyncService {
  private logger = new Logger('SyncService');

  constructor(
    private typeorm: TypeOrmService,
    private managed: AgentManagedService,
  ) {}

  /**
   * Synchroniser un lot d'opérations hors-ligne
   * Point d'entrée principal pour les agents en mode offline
   *
   * Stratégie: Last-write-wins avec horodatage
   * Idempotence garantie par idClientGenere (UUID unique)
   */
  async syncBatch(userId: string, agentId: string, syncBatchDto: SyncBatchDto): Promise<SyncResponseDto> {
    const { idClientGenere, dateCreationClient, operations } = syncBatchDto;

    // Vérifier l'idempotence : cette opération a-t-elle déjà été traitée?
    const existingJournal = await this.typeorm.journalSynchronisation.findOne({
      where: { idClientGenere },
    });

    if (existingJournal) {
      this.logger.warn(
        `Tentative de rejeu du batch ${idClientGenere} - retour du résultat précédent`,
      );

      const journal = this.formatJournalResponse(existingJournal);
      return {
        success: existingJournal.statut === StatutSynchronisation.OK,
        journal,
        message: 'Batch déjà traité (opération idempotente)',
      };
    }

    // Créer le journal de synchronisation
    let journal = await this.typeorm.journalSynchronisation.save(
      this.typeorm.journalSynchronisation.create({
        utilisateurId: userId,
        agentId,
        idClientGenere,
        dateCreationClient: new Date(dateCreationClient),
        nombreEnregistrements: operations.length,
        statut: StatutSynchronisation.EN_ATTENTE,
        payloadOperations: JSON.stringify(operations.map((op) => this.redactSecrets(op))),
      }),
    );

    // Traiter chaque opération
    const errorsDetails = [];

    for (const operation of operations) {
      try {
        await this.processOperation(operation, userId);
        this.logger.log(
          `✓ Opération ${operation.operation} sur ${operation.entity}:${operation.id}`,
        );
      } catch (error) {
        this.logger.error(
          `✗ Erreur lors de l'opération ${operation.operation}: ${error.message}`,
        );
        errorsDetails.push({
          operation: operation.operation,
          entity: operation.entity,
          id: operation.id,
          error: error.message,
        });
      }
    }

    // Mettre à jour le statut du journal
    const hasErrors = errorsDetails.length > 0;
    journal.statut = hasErrors ? StatutSynchronisation.ECHEC : StatutSynchronisation.OK;
    journal.messageErreur = hasErrors ? JSON.stringify(errorsDetails) : null;
    journal = await this.typeorm.journalSynchronisation.save(journal);

    this.logger.log(
      `Synchronisation ${hasErrors ? 'ECHEC PARTIEL' : 'RÉUSSIE'}: ${operations.length} opérations, ${errorsDetails.length} erreurs`,
    );

    return {
      success: !hasErrors,
      journal: this.formatJournalResponse(journal),
      errorsDetails: hasErrors ? errorsDetails : undefined,
      message: hasErrors
        ? `Synchronisation partielle: ${operations.length - errorsDetails.length}/${operations.length} opérations réussies`
        : `Synchronisation réussie: ${operations.length} opérations`,
    };
  }

  /**
   * Traiter une opération individuelle
   * Support: CREATE, UPDATE, DELETE
   * Last-write-wins: si deux versions du même objet existent, garder la plus récente par timestamp
   */
  private async processOperation(operation: any, userId: string): Promise<void> {
    const { entity, operation: operationType, id, timestamp, data } = operation;
    const operationTime = new Date(timestamp);

    // Un agent n'a jamais le droit de supprimer : seul un admin désactive un compte.
    if (String(operationType).toUpperCase() === 'DELETE') {
      throw new ForbiddenException('La suppression est interdite pour un agent de terrain');
    }

    switch (entity.toUpperCase()) {
      case 'UTILISATEUR':
        await this.handleManagedUser(operationType, id, data, operationTime, userId);
        break;

      case 'EXPLOITATION':
        await this.handleManagedFarm(operationType, id, data, operationTime, userId);
        break;

      case 'PRODUCTEUR':
      case 'ACHETEUR':
        throw new BadRequestException(
          `Entité ${entity} : utiliser UTILISATEUR (le profil est imbriqué dans le compte)`,
        );

      case 'ACTIVITE':
        await this.handleActivityOperation(operationType, id, data, operationTime, userId);
        break;

      case 'ANNONCE':
        await this.handleAnnouncementOperation(operationType, id, data, operationTime, userId);
        break;

      default:
        throw new BadRequestException(`Entité non supportée: ${entity}`);
    }
  }

  private async handleManagedUser(
    operationType: string,
    id: string,
    data: any,
    timestamp: Date,
    userId: string,
  ): Promise<void> {
    switch (operationType.toUpperCase()) {
      case 'CREATE': {
        const dto = await this.toDto(CreateManagedUserDto, { ...data, id });
        await this.managed.createUser(userId, dto);
        break;
      }
      case 'UPDATE': {
        const dto = await this.toDto(UpdateManagedUserDto, data);
        await this.managed.updateUser(userId, id, dto, { clientTimestamp: timestamp });
        break;
      }
      default:
        throw new BadRequestException(`Opération non supportée: ${operationType}`);
    }
  }

  private async handleManagedFarm(
    operationType: string,
    id: string,
    data: any,
    timestamp: Date,
    userId: string,
  ): Promise<void> {
    switch (operationType.toUpperCase()) {
      case 'CREATE': {
        const dto = await this.toDto(CreateManagedFarmDto, { ...data, id });
        await this.managed.createFarm(userId, dto);
        break;
      }
      case 'UPDATE': {
        const dto = await this.toDto(UpdateManagedFarmDto, data);
        await this.managed.updateFarm(userId, id, dto, { clientTimestamp: timestamp });
        break;
      }
      default:
        throw new BadRequestException(`Opération non supportée: ${operationType}`);
    }
  }

  /** Les données d'un lot ne passent pas par le ValidationPipe HTTP : on les valide ici. */
  private async toDto<T extends object>(cls: new () => T, data: unknown): Promise<T> {
    const instance = plainToInstance(cls, data ?? {}, { enableImplicitConversion: true });
    const errors = await validate(instance, { whitelist: true, forbidNonWhitelisted: true });
    if (errors.length > 0) {
      const messages = errors.flatMap((e) => Object.values(e.constraints ?? { [e.property]: 'invalide' }));
      throw new BadRequestException(messages.join('; '));
    }
    return instance;
  }

  /** Le journal ne doit jamais conserver un mot de passe temporaire en clair. */
  private redactSecrets(operation: any): any {
    if (operation?.data && typeof operation.data === 'object' && 'temporaryPassword' in operation.data) {
      return { ...operation, data: { ...operation.data, temporaryPassword: '[REDACTED]' } };
    }
    return operation;
  }

  private async handleActivityOperation(
    operationType: string,
    id: string,
    data: any,
    timestamp: Date,
    userId: string,
  ): Promise<void> {
    switch (operationType.toUpperCase()) {
      case 'CREATE':
        const existing = await this.typeorm.activiteExploitation.findOne({ where: { id } });
        if (!existing) {
          await this.typeorm.activiteExploitation.save(
            this.typeorm.activiteExploitation.create({ id, ...data }),
          );
        } else {
          Object.assign(existing, data);
          await this.typeorm.activiteExploitation.save(existing);
        }
        break;

      case 'UPDATE':
        const activity = await this.typeorm.activiteExploitation.findOne({ where: { id } });
        if (activity && new Date(activity.updatedAt) < timestamp) {
          Object.assign(activity, data);
          await this.typeorm.activiteExploitation.save(activity);
        }
        break;

      case 'DELETE':
        const toDelete = await this.typeorm.activiteExploitation.findOne({ where: { id } });
        if (toDelete) {
          await this.typeorm.activiteExploitation.remove(toDelete);
        }
        break;

      default:
        throw new BadRequestException(`Opération non supportée: ${operationType}`);
    }
  }

  private async handleAnnouncementOperation(
    operationType: string,
    id: string,
    data: any,
    timestamp: Date,
    userId: string,
  ): Promise<void> {
    switch (operationType.toUpperCase()) {
      case 'CREATE':
        const existing = await this.typeorm.annonce.findOne({ where: { id } });
        if (!existing) {
          await this.typeorm.annonce.save(
            this.typeorm.annonce.create({ id, ...data }),
          );
        } else {
          Object.assign(existing, data);
          await this.typeorm.annonce.save(existing);
        }
        break;

      case 'UPDATE':
        const announcement = await this.typeorm.annonce.findOne({ where: { id } });
        if (announcement && new Date(announcement.updatedAt) < timestamp) {
          Object.assign(announcement, data);
          await this.typeorm.annonce.save(announcement);
        }
        break;

      case 'DELETE':
        const toDelete = await this.typeorm.annonce.findOne({ where: { id } });
        if (toDelete) {
          await this.typeorm.annonce.remove(toDelete);
        }
        break;

      default:
        throw new BadRequestException(`Opération non supportée: ${operationType}`);
    }
  }


  /**
   * Obtenir l'historique de synchronisation d'un agent
   * Utile pour le tableau de reprise sur erreur
   */
  async getSyncHistory(userId: string, skip = 0, take = 20): Promise<SyncJournalResponseDto[]> {
    const journals = await this.typeorm.journalSynchronisation.find({
      where: { utilisateurId: userId },
      skip,
      take,
      order: { dateSynchronisation: 'DESC' },
    });

    return journals.map((j) => this.formatJournalResponse(j));
  }

  /**
   * Obtenir les synchronisations en erreur pour un agent
   */
  async getFailedSyncs(agentId: string): Promise<SyncJournalResponseDto[]> {
    const failedSyncs = await this.typeorm.journalSynchronisation.find({
      where: {
        agentId,
        statut: StatutSynchronisation.ECHEC,
      },
      order: { dateSynchronisation: 'DESC' },
    });

    return failedSyncs.map((j) => this.formatJournalResponse(j));
  }

  /**
   * Rejouer une synchronisation échouée
   */
  async retrySyncBatch(journalId: string, userId: string): Promise<SyncResponseDto> {
    const journal = await this.findOwnedJournal(journalId, userId);

    const operations = JSON.parse(journal.payloadOperations);

    // Les mots de passe temporaires ne sont pas conservés : rejouer côté serveur créerait
    // un compte dont personne ne connaît le mot de passe.
    if (operations.some((op: any) => op?.data?.temporaryPassword === '[REDACTED]')) {
      throw new BadRequestException(
        "Ce lot contient des créations de compte : rejouez-le depuis l'application (mot de passe temporaire non conservé côté serveur)",
      );
    }

    // Générer un nouveau UUID pour le retry (pour garantir l'idempotence du retry)
    const retryBatch: SyncBatchDto = {
      idClientGenere: uuidv4(),
      dateCreationClient: journal.dateCreationClient.toISOString(),
      operations,
    };

    return this.syncBatch(journal.utilisateurId, journal.agentId, retryBatch);
  }

  async getSyncDetails(journalId: string, userId: string): Promise<SyncJournalResponseDto> {
    return this.formatJournalResponse(await this.findOwnedJournal(journalId, userId));
  }

  private async findOwnedJournal(journalId: string, userId: string) {
    const journal = await this.typeorm.journalSynchronisation.findOne({ where: { id: journalId } });
    if (!journal || journal.utilisateurId !== userId) {
      throw new NotFoundException(`Journal de synchronisation ${journalId} non trouvé`);
    }
    return journal;
  }

  private formatJournalResponse(journal: any): SyncJournalResponseDto {
    return {
      id: journal.id,
      utilisateurId: journal.utilisateurId,
      agentId: journal.agentId,
      idClientGenere: journal.idClientGenere,
      nombreEnregistrements: journal.nombreEnregistrements,
      statut: journal.statut,
      dateSynchronisation: journal.dateSynchronisation,
      messageErreur: journal.messageErreur ? JSON.parse(journal.messageErreur) : undefined,
    };
  }
}
