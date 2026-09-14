import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { TypeOrmService } from '../database/typeorm.service';
import { SyncBatchDto, SyncResponseDto, SyncJournalResponseDto } from './dto/sync.dto';
import { StatutSynchronisation } from '../database/entities/journal-synchronisation.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SyncService {
  private logger = new Logger('SyncService');

  constructor(private typeorm: TypeOrmService) {}

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
        payloadOperations: JSON.stringify(operations),
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

    switch (entity.toUpperCase()) {
      case 'PRODUCTEUR':
        await this.handleProductorOperation(operationType, id, data, operationTime, userId);
        break;

      case 'EXPLOITATION':
        await this.handleFarmOperation(operationType, id, data, operationTime, userId);
        break;

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

  private async handleProductorOperation(
    operationType: string,
    id: string,
    data: any,
    timestamp: Date,
    userId: string,
  ): Promise<void> {
    switch (operationType.toUpperCase()) {
      case 'CREATE':
        const existing = await this.typeorm.producteur.findOne({ where: { id } });
        if (!existing) {
          await this.typeorm.producteur.save(
            this.typeorm.producteur.create({ id, utilisateurId: userId, ...data }),
          );
        } else {
          Object.assign(existing, data);
          await this.typeorm.producteur.save(existing);
        }
        break;

      case 'UPDATE':
        const prod = await this.typeorm.producteur.findOne({ where: { id } });
        // Last-write-wins
        if (prod && new Date(prod.updatedAt) < timestamp) {
          Object.assign(prod, data);
          await this.typeorm.producteur.save(prod);
        }
        break;

      case 'DELETE':
        const toDelete = await this.typeorm.producteur.findOne({ where: { id } });
        if (toDelete) {
          await this.typeorm.producteur.remove(toDelete);
        }
        break;

      default:
        throw new BadRequestException(`Opération non supportée: ${operationType}`);
    }
  }

  private async handleFarmOperation(
    operationType: string,
    id: string,
    data: any,
    timestamp: Date,
    userId: string,
  ): Promise<void> {
    switch (operationType.toUpperCase()) {
      case 'CREATE':
        const existing = await this.typeorm.exploitation.findOne({ where: { id } });
        if (!existing) {
          await this.typeorm.exploitation.save(
            this.typeorm.exploitation.create({ id, ...data }),
          );
        } else {
          Object.assign(existing, data);
          await this.typeorm.exploitation.save(existing);
        }
        break;

      case 'UPDATE':
        const farm = await this.typeorm.exploitation.findOne({ where: { id } });
        if (farm && new Date(farm.updatedAt) < timestamp) {
          Object.assign(farm, data);
          await this.typeorm.exploitation.save(farm);
        }
        break;

      case 'DELETE':
        const toDelete = await this.typeorm.exploitation.findOne({ where: { id } });
        if (toDelete) {
          await this.typeorm.exploitation.remove(toDelete);
        }
        break;

      default:
        throw new BadRequestException(`Opération non supportée: ${operationType}`);
    }
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
  async retrySyncBatch(journalId: string): Promise<SyncResponseDto> {
    const journal = await this.typeorm.journalSynchronisation.findOne({
      where: { id: journalId },
    });

    if (!journal) {
      throw new NotFoundException(`Journal de synchronisation ${journalId} non trouvé`);
    }

    const operations = JSON.parse(journal.payloadOperations);

    // Générer un nouveau UUID pour le retry (pour garantir l'idempotence du retry)
    const retryBatch: SyncBatchDto = {
      idClientGenere: uuidv4(),
      dateCreationClient: journal.dateCreationClient.toISOString(),
      operations,
    };

    return this.syncBatch(journal.utilisateurId, journal.agentId, retryBatch);
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
