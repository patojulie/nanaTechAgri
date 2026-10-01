import { Injectable } from '@nestjs/common';
import { TypeOrmService } from '../database/typeorm.service';
import { CommunicationService } from '../communication/communication.service';
import { Notification, TypeNotification } from '../database/entities/notification.entity';

/**
 * Notifie un utilisateur : PUSH (persistée, lue dans l'app) s'il a un smartphone,
 * sinon SMS via `CommunicationService`. Réutilisé par tout module ayant besoin de
 * prévenir un utilisateur (escalade admin, futures annonces de demande...).
 */
@Injectable()
export class NotificationsService {
  constructor(
    private typeorm: TypeOrmService,
    private communication: CommunicationService,
  ) {}

  async notifier(utilisateurId: string, titre: string, contenu: string): Promise<Notification> {
    const utilisateur = await this.typeorm.utilisateur.findOne({ where: { id: utilisateurId } });
    const type = utilisateur?.hasSmartphone === false ? TypeNotification.SMS : TypeNotification.PUSH;

    const notification = await this.typeorm.notification.save({
      utilisateurId,
      type,
      titre,
      contenu,
      statut: 'ENVOYEE',
      dateEnvoi: new Date(),
    });

    if (type === TypeNotification.SMS && utilisateur?.phone) {
      await this.communication.envoyerSms({
        telephone: utilisateur.phone,
        contenu: `${titre} : ${contenu}`,
        langue: utilisateur.languePrefereeCode,
      });
    }

    return notification;
  }

  async findMesNotifications(utilisateurId: string): Promise<Notification[]> {
    return this.typeorm.notification.find({
      where: { utilisateurId },
      order: { dateCreation: 'DESC' },
    });
  }

  async marquerLue(id: string): Promise<Notification> {
    const notification = await this.typeorm.notification.findOne({ where: { id } });
    if (notification) {
      notification.lu = true;
      notification.dateLecture = new Date();
      await this.typeorm.notification.save(notification);
    }
    return notification;
  }
}
