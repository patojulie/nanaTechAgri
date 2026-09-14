import { Injectable, BadRequestException, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { TypeOrmService } from '../database/typeorm.service';
import { AuthService } from '../auth/auth.service';
import { CreateFieldAgentDto, UpdateFieldAgentDto, FieldAgentResponseDto, OfflineTokenDto, AccountRegistrationDto } from './dto/agent.dto';

@Injectable()
export class FieldAgentsService {
  private logger = new Logger('FieldAgentsService');

  constructor(
    private typeorm: TypeOrmService,
    private authService: AuthService,
  ) {}

  async create(userId: string, createFieldAgentDto: CreateFieldAgentDto): Promise<FieldAgentResponseDto> {
    // Vérifier si un agent existe déjà pour cet utilisateur
    const existingAgent = await this.typeorm.agent.findOne({
      where: { utilisateurId: userId },
    });

    if (existingAgent) {
      throw new ConflictException('Un profil agent existe déjà pour cet utilisateur');
    }

    // Vérifier que le numéro d'identifiant est unique
    const existingByNumber = await this.typeorm.agent.findOne({
      where: { numeroIdentifiant: createFieldAgentDto.identificationNumber },
    });

    if (existingByNumber) {
      throw new ConflictException('Ce numéro d\'identifiant est déjà utilisé');
    }

    try {
      const agent = await this.typeorm.agent.save(
        this.typeorm.agent.create({
          utilisateurId: userId,
          numeroIdentifiant: createFieldAgentDto.identificationNumber,
          zone: createFieldAgentDto.zone,
        }),
      );

      this.logger.log(`Agent de terrain créé: ${agent.id}`);
      return this.formatResponse(agent);
    } catch (error) {
      this.logger.error(`Erreur lors de la création de l'agent: ${error.message}`);
      throw new BadRequestException('Erreur lors de la création de l\'agent');
    }
  }

  async findById(id: string): Promise<FieldAgentResponseDto> {
    const agent = await this.typeorm.agent.findOne({
      where: { id },
    });

    if (!agent) {
      throw new NotFoundException(`Agent avec l'ID ${id} non trouvé`);
    }

    return this.formatResponse(agent);
  }

  async findByUserId(userId: string): Promise<FieldAgentResponseDto> {
    const agent = await this.typeorm.agent.findOne({
      where: { utilisateurId: userId },
    });

    if (!agent) {
      throw new NotFoundException(`Agent avec l'utilisateur ID ${userId} non trouvé`);
    }

    return this.formatResponse(agent);
  }

  async findAll(skip = 0, take = 10): Promise<FieldAgentResponseDto[]> {
    const agents = await this.typeorm.agent.find({
      skip,
      take,
    });

    return agents.map((a) => this.formatResponse(a));
  }

  async update(id: string, updateFieldAgentDto: UpdateFieldAgentDto): Promise<FieldAgentResponseDto> {
    try {
      const agent = await this.typeorm.agent.findOne({
        where: { id },
      });
      if (!agent) {
        throw new NotFoundException(`Agent avec l'ID ${id} non trouvé`);
      }
      Object.assign(agent, updateFieldAgentDto);
      const updated = await this.typeorm.agent.save(agent);

      this.logger.log(`Agent mis à jour: ${id}`);
      return this.formatResponse(updated);
    } catch (error) {
      throw new BadRequestException('Erreur lors de la mise à jour');
    }
  }

  // Générer un token spécial pour le mode offline
  async generateOfflineToken(userId: string): Promise<OfflineTokenDto> {
    const user = await this.typeorm.utilisateur.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Générer un token avec longue durée pour l'offline
    const offlineToken = this.authService.generateOfflineAgentToken(userId, user.role);

    this.logger.log(`Token offline généré pour l'agent: ${userId}`);

    return {
      offlineToken,
      expiresIn: 2592000, // 30 jours en secondes
    };
  }

  // Enregistrer un compte pour un agent (ex: créer un compte producteur via agent)
  async registerAccountOnBehalfOf(
    agentId: string,
    accountRegistrationDto: AccountRegistrationDto,
  ): Promise<object> {
    try {
      const registration = await this.typeorm.enregistrementCompte.save(
        this.typeorm.enregistrementCompte.create({
          agentId,
          typeSousacription: accountRegistrationDto.typeSousacription,
          nombreAccounts: accountRegistrationDto.nombreAccounts || 1,
          details: accountRegistrationDto.details,
        }),
      );

      this.logger.log(`Compte enregistré par l'agent ${agentId}: ${registration.id}`);

      return {
        id: registration.id,
        typeSousacription: registration.typeSousacription,
        nombreAccounts: registration.nombreAccounts,
        dateEnregistrement: registration.dateEnregistrement,
      };
    } catch (error) {
      this.logger.error(`Erreur lors de l'enregistrement: ${error.message}`);
      throw new BadRequestException('Erreur lors de l\'enregistrement du compte');
    }
  }

  async updateLastConnection(userId: string): Promise<void> {
    try {
      const agent = await this.typeorm.agent.findOne({
        where: { utilisateurId: userId },
      });
      if (agent) {
        agent.derniereConnexion = new Date();
        await this.typeorm.agent.save(agent);
      }
    } catch (error) {
      this.logger.warn(`Erreur lors de la mise à jour de la dernière connexion: ${error.message}`);
    }
  }

  private formatResponse(agent: any): FieldAgentResponseDto {
    return {
      id: agent.id,
      userId: agent.utilisateurId,
      identificationNumber: agent.numeroIdentifiant,
      zone: agent.zone,
      status: agent.statut,
      lastConnection: agent.derniereConnexion,
      createdAt: agent.dateCreation,
    };
  }
}
