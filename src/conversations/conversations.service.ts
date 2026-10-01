import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeOrmService } from '../database/typeorm.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  Conversation,
  Message,
  AuteurTypeMessage,
  CanalConversation,
  StatutConversation,
  Role,
} from '../database/entities';
import {
  CreateEscaladeDto,
  AddMessageDto,
  ConversationResponseDto,
  MessageResponseDto,
} from './dto/conversation.dto';

interface ActeurContext {
  userId: string;
  role: Role;
}

@Injectable()
export class ConversationsService {
  constructor(
    @InjectRepository(Conversation) private conversationRepo: Repository<Conversation>,
    @InjectRepository(Message) private messageRepo: Repository<Message>,
    private typeorm: TypeOrmService,
    private notifications: NotificationsService,
  ) {}

  private auteurTypePour(role: Role): AuteurTypeMessage {
    switch (role) {
      case Role.PRODUCTEUR:
        return AuteurTypeMessage.PRODUCTEUR;
      case Role.ACHETEUR:
        return AuteurTypeMessage.ACHETEUR;
      case Role.AGENT:
        return AuteurTypeMessage.AGENT;
      default:
        return AuteurTypeMessage.ADMIN;
    }
  }

  private estParticipant(conversation: Conversation, acteur: ActeurContext): boolean {
    if (acteur.role === Role.ADMIN) return true;
    return (
      conversation.producteurUtilisateurId === acteur.userId ||
      conversation.acheteurUtilisateurId === acteur.userId ||
      conversation.agentUtilisateurId === acteur.userId
    );
  }

  private async resoudrePartiesDepuisMiseEnRelation(miseEnRelationId: string) {
    const miseEnRelation = await this.typeorm.miseEnRelation.findOne({ where: { id: miseEnRelationId } });
    if (!miseEnRelation) {
      throw new NotFoundException('Mise en relation introuvable');
    }
    const [producteur, acheteur] = await Promise.all([
      this.typeorm.producteur.findOne({ where: { id: miseEnRelation.producteurId } }),
      this.typeorm.acheteur.findOne({ where: { id: miseEnRelation.acheteurId } }),
    ]);
    return {
      producteurUtilisateurId: producteur?.userId,
      acheteurUtilisateurId: acheteur?.utilisateurId,
    };
  }

  /** Crée (ou réutilise) une conversation puis l'escalade immédiatement vers l'administration. */
  async escalader(acteur: ActeurContext, dto: CreateEscaladeDto): Promise<ConversationResponseDto> {
    let producteurUtilisateurId = dto.producteurUtilisateurId;
    let acheteurUtilisateurId = dto.acheteurUtilisateurId;

    if (dto.miseEnRelationId) {
      const resolues = await this.resoudrePartiesDepuisMiseEnRelation(dto.miseEnRelationId);
      producteurUtilisateurId = resolues.producteurUtilisateurId;
      acheteurUtilisateurId = resolues.acheteurUtilisateurId;
    } else if (acteur.role === Role.PRODUCTEUR) {
      // Escalade libre initiée par le producteur lui-même : son propre id n'a pas à être
      // redemandé au client, seule la contrepartie (acheteur) est fournie.
      producteurUtilisateurId = acteur.userId;
    } else if (acteur.role === Role.ACHETEUR) {
      acheteurUtilisateurId = acteur.userId;
    }

    if (!producteurUtilisateurId && !acheteurUtilisateurId) {
      throw new BadRequestException(
        'Indiquez une mise en relation, ou le producteur/acheteur concerné (escalade libre)',
      );
    }

    const estParticipantAttendu =
      acteur.role === Role.AGENT ||
      producteurUtilisateurId === acteur.userId ||
      acheteurUtilisateurId === acteur.userId;
    if (!estParticipantAttendu) {
      throw new ForbiddenException("Vous ne faites pas partie de cette conversation");
    }

    let conversation = dto.miseEnRelationId
      ? await this.conversationRepo.findOne({ where: { miseEnRelationId: dto.miseEnRelationId } })
      : null;

    if (!conversation) {
      conversation = this.conversationRepo.create({
        miseEnRelationId: dto.miseEnRelationId,
        producteurUtilisateurId,
        acheteurUtilisateurId,
      });
    }

    if (acteur.role === Role.AGENT) conversation.agentUtilisateurId = acteur.userId;
    conversation.canal = CanalConversation.ADMIN;
    conversation.statut = StatutConversation.ESCALADEE_ADMIN;
    conversation.motifEscalade = dto.motif;
    conversation.motifEscaladeDetail = dto.motifDetail ?? null;
    conversation.dateEscalade = new Date();
    conversation.priseEnChargeParAdminId = null;

    conversation = await this.conversationRepo.save(conversation);

    await this.messageRepo.save({
      conversationId: conversation.id,
      auteurId: acteur.userId,
      auteurType: this.auteurTypePour(acteur.role),
      contenu: `Escalade vers l'administration — motif : ${dto.motif}${dto.motifDetail ? ` (${dto.motifDetail})` : ''}`,
    });

    await this.notifierParties(conversation, acteur.userId, 'Dossier transmis à l\'administration', 'Un administrateur va prendre en charge votre dossier.');

    return this.formatResponse(conversation);
  }

  async prendreEnCharge(adminUserId: string, conversationId: string): Promise<ConversationResponseDto> {
    const conversation = await this.getOrThrow(conversationId);
    if (conversation.statut !== StatutConversation.ESCALADEE_ADMIN) {
      throw new BadRequestException("Cette conversation n'est pas en attente d'un administrateur");
    }
    conversation.priseEnChargeParAdminId = adminUserId;
    const saved = await this.conversationRepo.save(conversation);

    await this.messageRepo.save({
      conversationId: saved.id,
      auteurId: adminUserId,
      auteurType: AuteurTypeMessage.ADMIN,
      contenu: 'Un administrateur a pris en charge la conversation.',
    });

    await this.notifierParties(saved, null, 'Votre dossier est pris en charge', 'Un administrateur a pris en charge votre dossier et va vous répondre.');

    return this.formatResponse(saved);
  }

  async resoudre(adminUserId: string, conversationId: string, resume: string): Promise<ConversationResponseDto> {
    const conversation = await this.getOrThrow(conversationId);
    conversation.statut = StatutConversation.CLOTUREE;
    conversation.dateResolution = new Date();
    conversation.resumeResolution = resume;
    const saved = await this.conversationRepo.save(conversation);

    await this.messageRepo.save({
      conversationId: saved.id,
      auteurId: adminUserId,
      auteurType: AuteurTypeMessage.ADMIN,
      contenu: `Conversation résolue : ${resume}`,
    });

    await this.notifierParties(saved, null, 'Votre dossier est résolu', resume);

    return this.formatResponse(saved);
  }

  async ajouterMessage(acteur: ActeurContext, conversationId: string, dto: AddMessageDto): Promise<MessageResponseDto> {
    const conversation = await this.getOrThrow(conversationId);
    if (!this.estParticipant(conversation, acteur)) {
      throw new ForbiddenException("Vous ne faites pas partie de cette conversation");
    }
    const message = await this.messageRepo.save({
      conversationId,
      auteurId: acteur.userId,
      auteurType: this.auteurTypePour(acteur.role),
      contenu: dto.contenu,
    });
    return this.formatMessage(message);
  }

  async findById(acteur: ActeurContext, conversationId: string): Promise<ConversationResponseDto> {
    const conversation = await this.getOrThrow(conversationId);
    if (!this.estParticipant(conversation, acteur)) {
      throw new ForbiddenException("Vous ne faites pas partie de cette conversation");
    }
    const messages = await this.messageRepo.find({ where: { conversationId }, order: { dateEnvoi: 'ASC' } });
    const reponse = await this.formatResponse(conversation);
    reponse.messages = messages.map((m) => this.formatMessage(m));
    return reponse;
  }

  /** File d'attente admin : conversations en attente de prise en charge, triées par ancienneté. */
  async findEscaladees(): Promise<ConversationResponseDto[]> {
    const conversations = await this.conversationRepo.find({
      where: { statut: StatutConversation.ESCALADEE_ADMIN },
      order: { dateEscalade: 'ASC' },
    });
    return Promise.all(conversations.map((c) => this.formatResponse(c)));
  }

  async findAll(statut?: StatutConversation): Promise<ConversationResponseDto[]> {
    const conversations = await this.conversationRepo.find({
      where: statut ? { statut } : {},
      order: { dateMiseAJour: 'DESC' },
    });
    return Promise.all(conversations.map((c) => this.formatResponse(c)));
  }

  async findMine(acteur: ActeurContext): Promise<ConversationResponseDto[]> {
    const where =
      acteur.role === Role.PRODUCTEUR
        ? { producteurUtilisateurId: acteur.userId }
        : acteur.role === Role.ACHETEUR
          ? { acheteurUtilisateurId: acteur.userId }
          : { agentUtilisateurId: acteur.userId };
    const conversations = await this.conversationRepo.find({ where, order: { dateMiseAJour: 'DESC' } });
    return Promise.all(conversations.map((c) => this.formatResponse(c)));
  }

  private async getOrThrow(id: string): Promise<Conversation> {
    const conversation = await this.conversationRepo.findOne({ where: { id } });
    if (!conversation) throw new NotFoundException('Conversation introuvable');
    return conversation;
  }

  /** Notifie toutes les parties (sauf éventuellement l'auteur de l'action) via NotificationsService. */
  private async notifierParties(conversation: Conversation, sauf: string | null, titre: string, contenu: string) {
    const destinataires = [
      conversation.producteurUtilisateurId,
      conversation.acheteurUtilisateurId,
      conversation.agentUtilisateurId,
    ].filter((id): id is string => !!id && id !== sauf);

    await Promise.all(destinataires.map((id) => this.notifications.notifier(id, titre, contenu)));
  }

  private formatMessage(message: Message): MessageResponseDto {
    return {
      id: message.id,
      conversationId: message.conversationId,
      auteurId: message.auteurId,
      auteurType: message.auteurType,
      contenu: message.contenu,
      dateEnvoi: message.dateEnvoi,
    };
  }

  private async formatResponse(conversation: Conversation): Promise<ConversationResponseDto> {
    const [producteurUser, acheteurUser, agentUser] = await Promise.all([
      conversation.producteurUtilisateurId
        ? this.typeorm.utilisateur.findOne({ where: { id: conversation.producteurUtilisateurId } })
        : null,
      conversation.acheteurUtilisateurId
        ? this.typeorm.utilisateur.findOne({ where: { id: conversation.acheteurUtilisateurId } })
        : null,
      conversation.agentUtilisateurId
        ? this.typeorm.utilisateur.findOne({ where: { id: conversation.agentUtilisateurId } })
        : null,
    ]);

    const nomDe = (u: any) => (u ? `${u.firstName} ${u.lastName}` : undefined);

    return {
      id: conversation.id,
      miseEnRelationId: conversation.miseEnRelationId,
      producteurUtilisateurId: conversation.producteurUtilisateurId,
      acheteurUtilisateurId: conversation.acheteurUtilisateurId,
      agentUtilisateurId: conversation.agentUtilisateurId,
      canal: conversation.canal,
      statut: conversation.statut,
      motifEscalade: conversation.motifEscalade,
      motifEscaladeDetail: conversation.motifEscaladeDetail,
      priseEnChargeParAdminId: conversation.priseEnChargeParAdminId,
      dateEscalade: conversation.dateEscalade,
      dateResolution: conversation.dateResolution,
      resumeResolution: conversation.resumeResolution,
      producteurNom: nomDe(producteurUser),
      acheteurNom: nomDe(acheteurUser),
      agentNom: nomDe(agentUser),
      dateCreation: conversation.dateCreation,
    };
  }
}
