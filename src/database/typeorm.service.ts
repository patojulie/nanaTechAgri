import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import {
  Utilisateur,
  Producteur,
  Exploitation,
  ActiviteExploitation,
  Annonce,
  Agent,
  EnregistrementCompte,
  Cooperative,
  ValidationFiche,
  TableauDeBordCooperative,
  Acheteur,
  MiseEnRelation,
  JournalSynchronisation,
  Notification,
  ExportDonnees,
  AuditLog,
} from './entities';

/**
 * TypeOrmService: Centralizes access to all repositories
 * Replaces PrismaService from Prisma ORM
 */
@Injectable()
export class TypeOrmService implements OnModuleInit, OnModuleDestroy {
  private logger = new Logger('TypeOrmService');

  // Repositories
  utilisateur: Repository<Utilisateur>;
  producteur: Repository<Producteur>;
  exploitation: Repository<Exploitation>;
  activiteExploitation: Repository<ActiviteExploitation>;
  annonce: Repository<Annonce>;
  agent: Repository<Agent>;
  enregistrementCompte: Repository<EnregistrementCompte>;
  cooperative: Repository<Cooperative>;
  validationFiche: Repository<ValidationFiche>;
  tableauDeBordCooperative: Repository<TableauDeBordCooperative>;
  acheteur: Repository<Acheteur>;
  miseEnRelation: Repository<MiseEnRelation>;
  journalSynchronisation: Repository<JournalSynchronisation>;
  notification: Repository<Notification>;
  exportDonnees: Repository<ExportDonnees>;
  auditLog: Repository<AuditLog>;

  constructor(
    private dataSource: DataSource,
    @InjectRepository(Utilisateur) utilisateurRepo: Repository<Utilisateur>,
    @InjectRepository(Producteur) producteurRepo: Repository<Producteur>,
    @InjectRepository(Exploitation) exploitationRepo: Repository<Exploitation>,
    @InjectRepository(ActiviteExploitation) activiteExploitationRepo: Repository<ActiviteExploitation>,
    @InjectRepository(Annonce) annonceRepo: Repository<Annonce>,
    @InjectRepository(Agent) agentRepo: Repository<Agent>,
    @InjectRepository(EnregistrementCompte) enregistrementCompteRepo: Repository<EnregistrementCompte>,
    @InjectRepository(Cooperative) cooperativeRepo: Repository<Cooperative>,
    @InjectRepository(ValidationFiche) validationFicheRepo: Repository<ValidationFiche>,
    @InjectRepository(TableauDeBordCooperative) tableauDeBordCooperativeRepo: Repository<TableauDeBordCooperative>,
    @InjectRepository(Acheteur) acheteurRepo: Repository<Acheteur>,
    @InjectRepository(MiseEnRelation) miseEnRelationRepo: Repository<MiseEnRelation>,
    @InjectRepository(JournalSynchronisation) journalSynchronisationRepo: Repository<JournalSynchronisation>,
    @InjectRepository(Notification) notificationRepo: Repository<Notification>,
    @InjectRepository(ExportDonnees) exportDonneesRepo: Repository<ExportDonnees>,
    @InjectRepository(AuditLog) auditLogRepo: Repository<AuditLog>,
  ) {
    this.utilisateur = utilisateurRepo;
    this.producteur = producteurRepo;
    this.exploitation = exploitationRepo;
    this.activiteExploitation = activiteExploitationRepo;
    this.annonce = annonceRepo;
    this.agent = agentRepo;
    this.enregistrementCompte = enregistrementCompteRepo;
    this.cooperative = cooperativeRepo;
    this.validationFiche = validationFicheRepo;
    this.tableauDeBordCooperative = tableauDeBordCooperativeRepo;
    this.acheteur = acheteurRepo;
    this.miseEnRelation = miseEnRelationRepo;
    this.journalSynchronisation = journalSynchronisationRepo;
    this.notification = notificationRepo;
    this.exportDonnees = exportDonneesRepo;
    this.auditLog = auditLogRepo;
  }

  async onModuleInit() {
    try {
      await this.dataSource.query('SELECT NOW()'); // Vérifier connexion
      this.logger.log('✓ Base de données connectée avec succès');
      
      // Auto-sync schema en dev
      if (process.env.NODE_ENV === 'development') {
        this.logger.log('🔄 Synchronisation du schéma (mode développement)...');
        await this.dataSource.synchronize();
        this.logger.log('✓ Schéma synchronisé');
      }
    } catch (error) {
      this.logger.error(`✗ Erreur de connexion BD: ${error.message}`);
      throw error;
    }
  }

  async onModuleDestroy() {
    if (this.dataSource.isInitialized) {
      await this.dataSource.destroy();
      this.logger.log('✓ Connexion BD fermée');
    }
  }

  /**
   * Démarrer une transaction
   */
  async transaction<T>(callback: () => Promise<T>): Promise<T> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const result = await callback();
      await queryRunner.commitTransaction();
      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
