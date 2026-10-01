import {
  Injectable,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { In } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { TypeOrmService } from '../database/typeorm.service';
import { Agent, Role, Utilisateur, Exploitation, CanalAcces } from '../database/entities';
import { FarmResponseDto } from '../exploitations/dto/farm.dto';
import { LanguesService } from '../langues/langues.service';
import {
  CreateManagedUserDto,
  UpdateManagedUserDto,
  CreateManagedFarmDto,
  UpdateManagedFarmDto,
  ManagedUserResponseDto,
  MANAGED_ROLES,
} from './dto/managed.dto';

/** Options communes aux mises à jour rejouées depuis la file hors ligne. */
export interface ManagedWriteOptions {
  /**
   * Horodatage local de la modification (hors ligne). Règle « la plus récente gagne » :
   * si le serveur a été modifié après, la mise à jour est ignorée.
   */
  clientTimestamp?: Date;
}

/**
 * Comptes et exploitations inscrits par un agent de terrain.
 *
 * Règles :
 *  - un agent ne voit et ne modifie QUE ce qu'il a créé (utilisateurs.createdByAgentId);
 *  - jamais de suppression (réservée à l'admin via /users/{id}/deactivate);
 *  - Producteur.id / Acheteur.id = id de l'utilisateur, pour que l'app puisse rattacher une
 *    exploitation à un producteur créé hors ligne avant même la synchronisation.
 */
@Injectable()
export class AgentManagedService {
  private logger = new Logger('AgentManagedService');

  constructor(
    private typeorm: TypeOrmService,
    private languesService: LanguesService,
  ) {}

  // ---------------------------------------------------------------- utilisateurs

  async createUser(agentUserId: string, dto: CreateManagedUserDto): Promise<ManagedUserResponseDto> {
    const agent = await this.getAgent(agentUserId);

    if (!(MANAGED_ROLES as readonly Role[]).includes(dto.role)) {
      throw new ForbiddenException('Un agent ne peut inscrire que des producteurs ou des acheteurs');
    }
    if (dto.role === Role.PRODUCTEUR && !dto.producteur) {
      throw new BadRequestException('Le profil producteur est requis pour le rôle PRODUCTEUR');
    }

    const id = dto.id ?? uuidv4();

    // Idempotence : la création rejouée (retry réseau, batch renvoyé) ne fait rien.
    const already = await this.typeorm.utilisateur.findOne({ where: { id } });
    if (already) {
      if (already.createdByAgentId !== agent.id) {
        throw new ConflictException('Cet identifiant est déjà utilisé');
      }
      return this.buildUserResponse(already);
    }

    const email = (dto.email ?? `${id}@noemail.agri.local`).toLowerCase();
    if (await this.typeorm.utilisateur.findOne({ where: { email } })) {
      throw new ConflictException('Un utilisateur avec cet email existe déjà');
    }
    if (dto.phone && (await this.typeorm.utilisateur.findOne({ where: { phone: dto.phone } }))) {
      throw new ConflictException('Un utilisateur avec ce numéro de téléphone existe déjà');
    }

    const generated = dto.temporaryPassword ? undefined : this.generateTemporaryPassword();
    const passwordHash = await bcrypt.hash(dto.temporaryPassword ?? generated!, 10);
    const hasSmartphone = dto.hasSmartphone ?? true;
    const languePrefereeCode = dto.languePreferee ?? 'fr';
    await this.languesService.assertValide(languePrefereeCode);

    const user = await this.typeorm.utilisateur.save(
      this.typeorm.utilisateur.create({
        id,
        email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        role: dto.role,
        hasSmartphone,
        languePrefereeCode,
        mustChangePassword: true,
        createdByAgentId: agent.id,
        accessChannelPreferences: this.channelsFor(hasSmartphone),
      }),
    );

    try {
      if (dto.role === Role.PRODUCTEUR) {
        const p = dto.producteur!;
        await this.typeorm.producteur.save({
          id,
          userId: id,
          identificationNumber: p.identificationNumber,
          identificationType: p.identificationType,
          identificationIssueDate: new Date(p.identificationIssueDate),
          address: p.address,
          postalCode: p.postalCode,
          city: p.city,
          region: p.region,
          pays: p.pays || 'Togo',
          geolocation: p.geolocation,
          yearsOfExperience: p.yearsOfExperience,
        } as any);
      } else {
        const a = dto.acheteur ?? { typeSociete: 'PARTICULIER' };
        await this.typeorm.acheteur.save({ id, utilisateurId: id, ...a } as any);
      }
    } catch (error) {
      // Pas de transaction partagée dans TypeOrmService : on annule à la main.
      await this.typeorm.utilisateur.delete({ id });
      this.logger.error(`Création du profil ${dto.role} échouée pour ${id}: ${error.message}`);
      throw new BadRequestException(`Erreur lors de la création du profil ${dto.role.toLowerCase()}`);
    }

    // Alimente les statistiques d'inscriptions de l'agent (non bloquant).
    this.typeorm.enregistrementCompte
      .save(
        this.typeorm.enregistrementCompte.create({
          agentId: agent.id,
          typeSousacription: dto.role,
          nombreAccounts: 1,
          details: `user:${id}`,
        }),
      )
      .catch((e) => this.logger.warn(`Statistique d'inscription non enregistrée: ${e.message}`));

    this.logger.log(`Compte ${dto.role} ${id} inscrit par l'agent ${agent.id}`);
    const response = await this.buildUserResponse(user);
    response.temporaryPassword = generated;
    return response;
  }

  async updateUser(
    agentUserId: string,
    id: string,
    dto: UpdateManagedUserDto,
    opts: ManagedWriteOptions = {},
  ): Promise<ManagedUserResponseDto> {
    const agent = await this.getAgent(agentUserId);
    const user = await this.getOwnedUser(agent, id);

    if (opts.clientTimestamp && user.updatedAt > opts.clientTimestamp) {
      return this.buildUserResponse(user); // le serveur est plus récent : on garde sa version
    }

    if (dto.phone && dto.phone !== user.phone) {
      if (await this.typeorm.utilisateur.findOne({ where: { phone: dto.phone } })) {
        throw new ConflictException('Un utilisateur avec ce numéro de téléphone existe déjà');
      }
      user.phone = dto.phone;
    }
    if (dto.firstName !== undefined) user.firstName = dto.firstName;
    if (dto.lastName !== undefined) user.lastName = dto.lastName;
    if (dto.hasSmartphone !== undefined) {
      user.hasSmartphone = dto.hasSmartphone;
      user.accessChannelPreferences = this.channelsFor(dto.hasSmartphone);
    }
    if (dto.languePreferee !== undefined) {
      await this.languesService.assertValide(dto.languePreferee);
      user.languePrefereeCode = dto.languePreferee;
    }
    const saved = await this.typeorm.utilisateur.save(user);

    if (dto.producteur) {
      const producteur = await this.typeorm.producteur.findOne({ where: { userId: id } });
      if (producteur) {
        Object.assign(producteur, this.definedOnly(dto.producteur));
        await this.typeorm.producteur.save(producteur);
      }
    }
    if (dto.acheteur) {
      const acheteur = await this.typeorm.acheteur.findOne({ where: { utilisateurId: id } });
      if (acheteur) {
        Object.assign(acheteur, this.definedOnly(dto.acheteur));
        await this.typeorm.acheteur.save(acheteur);
      }
    }

    return this.buildUserResponse(saved);
  }

  async getUser(agentUserId: string, id: string): Promise<ManagedUserResponseDto> {
    const agent = await this.getAgent(agentUserId);
    return this.buildUserResponse(await this.getOwnedUser(agent, id));
  }

  async listUsers(agentUserId: string): Promise<ManagedUserResponseDto[]> {
    const agent = await this.getAgent(agentUserId);
    const users = await this.typeorm.utilisateur.find({
      where: { createdByAgentId: agent.id },
      order: { createdAt: 'DESC' },
    });
    if (users.length === 0) return [];

    const ids = users.map((u) => u.id);
    const [producteurs, acheteurs] = await Promise.all([
      this.typeorm.producteur.find({ where: { userId: In(ids) } }),
      this.typeorm.acheteur.find({ where: { utilisateurId: In(ids) } }),
    ]);
    const prodByUser = new Map(producteurs.map((p) => [p.userId, p]));
    const achByUser = new Map(acheteurs.map((a) => [a.utilisateurId, a]));

    return users.map((u) => this.toUserResponse(u, prodByUser.get(u.id), achByUser.get(u.id)));
  }

  // ---------------------------------------------------------------- exploitations

  async createFarm(agentUserId: string, dto: CreateManagedFarmDto): Promise<FarmResponseDto> {
    const agent = await this.getAgent(agentUserId);
    await this.assertProducerOwned(agent, dto.producerId);

    const id = dto.id ?? uuidv4();
    const existing = await this.typeorm.exploitation.findOne({ where: { id } });
    if (existing) {
      if (existing.producerId !== dto.producerId) {
        throw new ConflictException('Cet identifiant d\'exploitation est déjà utilisé');
      }
      return this.toFarmResponse(existing); // rejeu idempotent
    }

    const farm = await this.typeorm.exploitation.save(
      this.typeorm.exploitation.create({
        id,
        producerId: dto.producerId,
        name: dto.name,
        totalArea: dto.totalArea,
        exploitationType: dto.exploitationType,
        address: dto.address,
        geolocation: dto.geolocation,
        generalDescription: dto.generalDescription,
      }),
    );
    this.logger.log(`Exploitation ${id} créée par l'agent ${agent.id} pour le producteur ${dto.producerId}`);
    return this.toFarmResponse(farm);
  }

  async updateFarm(
    agentUserId: string,
    id: string,
    dto: UpdateManagedFarmDto,
    opts: ManagedWriteOptions = {},
  ): Promise<FarmResponseDto> {
    const agent = await this.getAgent(agentUserId);
    const farm = await this.typeorm.exploitation.findOne({ where: { id } });
    if (!farm) throw new NotFoundException(`Exploitation ${id} non trouvée`);
    await this.assertProducerOwned(agent, farm.producerId);

    if (opts.clientTimestamp && farm.updatedAt > opts.clientTimestamp) {
      return this.toFarmResponse(farm);
    }

    Object.assign(farm, this.definedOnly(dto));
    return this.toFarmResponse(await this.typeorm.exploitation.save(farm));
  }

  async listFarms(agentUserId: string): Promise<FarmResponseDto[]> {
    const agent = await this.getAgent(agentUserId);
    const users = await this.typeorm.utilisateur.find({
      where: { createdByAgentId: agent.id, role: Role.PRODUCTEUR },
      select: ['id'],
    });
    if (users.length === 0) return [];

    const producteurs = await this.typeorm.producteur.find({
      where: { userId: In(users.map((u) => u.id)) },
      select: ['id'],
    });
    if (producteurs.length === 0) return [];

    const farms = await this.typeorm.exploitation.find({
      where: { producerId: In(producteurs.map((p) => p.id)) },
      order: { createdAt: 'DESC' },
    });
    return farms.map((f) => this.toFarmResponse(f));
  }

  // ---------------------------------------------------------------- statistiques

  async stats(agentUserId: string) {
    const agent = await this.getAgent(agentUserId);
    const [producteurs, acheteurs, exploitations] = await Promise.all([
      this.typeorm.utilisateur.count({ where: { createdByAgentId: agent.id, role: Role.PRODUCTEUR } }),
      this.typeorm.utilisateur.count({ where: { createdByAgentId: agent.id, role: Role.ACHETEUR } }),
      this.listFarms(agentUserId).then((f) => f.length),
    ]);
    return { producteurs, acheteurs, exploitations };
  }

  // ---------------------------------------------------------------- helpers

  /** Résout le profil agent (agents.id) depuis l'utilisateur connecté. */
  async getAgent(userId: string): Promise<Agent> {
    const agent = await this.typeorm.agent.findOne({ where: { utilisateurId: userId } });
    if (!agent) throw new ForbiddenException("Aucun profil agent associé à cet utilisateur");
    return agent;
  }

  private async getOwnedUser(agent: Agent, id: string): Promise<Utilisateur> {
    const user = await this.typeorm.utilisateur.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`Utilisateur ${id} non trouvé`);
    if (user.createdByAgentId !== agent.id) {
      throw new ForbiddenException("Cet utilisateur n'a pas été inscrit par vous");
    }
    return user;
  }

  private async assertProducerOwned(agent: Agent, producerId: string): Promise<void> {
    const producteur = await this.typeorm.producteur.findOne({ where: { id: producerId } });
    if (!producteur) throw new NotFoundException(`Producteur ${producerId} non trouvé`);
    await this.getOwnedUser(agent, producteur.userId);
  }

  private async buildUserResponse(user: Utilisateur): Promise<ManagedUserResponseDto> {
    const [producteur, acheteur] = await Promise.all([
      this.typeorm.producteur.findOne({ where: { userId: user.id } }),
      this.typeorm.acheteur.findOne({ where: { utilisateurId: user.id } }),
    ]);
    return this.toUserResponse(user, producteur ?? undefined, acheteur ?? undefined);
  }

  private toUserResponse(user: Utilisateur, producteur?: any, acheteur?: any): ManagedUserResponseDto {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone ?? undefined,
      role: user.role,
      active: user.active,
      hasSmartphone: user.hasSmartphone,
      mustChangePassword: user.mustChangePassword,
      languePreferee: user.languePrefereeCode,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      producteurId: producteur?.id,
      acheteurId: acheteur?.id,
      producteur,
      acheteur,
    };
  }

  private toFarmResponse(farm: Exploitation): FarmResponseDto {
    return {
      id: farm.id,
      producerId: farm.producerId,
      name: farm.name,
      totalArea: farm.totalArea,
      exploitationType: farm.exploitationType,
      status: farm.status,
      address: farm.address,
      geolocation: farm.geolocation,
      generalDescription: farm.generalDescription,
      createdAt: farm.createdAt,
      updatedAt: farm.updatedAt,
    } as FarmResponseDto;
  }

  private channelsFor(hasSmartphone: boolean): CanalAcces[] {
    return hasSmartphone
      ? [CanalAcces.MOBILE_APP, CanalAcces.WEB]
      : [CanalAcces.SMS, CanalAcces.AGENT_TERRAIN];
  }

  private definedOnly<T extends object>(obj: T): Partial<T> {
    return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>;
  }

  /** 12 caractères, respecte la politique (majuscule, minuscule, chiffre, symbole), sans caractères ambigus. */
  private generateTemporaryPassword(): string {
    const sets = ['ABCDEFGHJKLMNPQRSTUVWXYZ', 'abcdefghijkmnpqrstuvwxyz', '23456789', '!@#$%&*?'];
    const all = sets.join('');
    const pick = (chars: string) => chars[randomInt(chars.length)];
    const chars = sets.map(pick);
    while (chars.length < 12) chars.push(pick(all));
    for (let i = chars.length - 1; i > 0; i--) {
      const j = randomInt(i + 1);
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    return chars.join('');
  }
}
