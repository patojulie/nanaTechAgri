import { Injectable, Logger } from '@nestjs/common';
import { CommunicationService, EnvoiSmsOptions } from './communication.service';

/**
 * Implémentation par défaut : journalise le SMS au lieu de l'envoyer réellement.
 *
 * À remplacer par un vrai fournisseur (Twilio ou Africa's Talking, identifiants déjà
 * réservés — fictifs — dans `.env` : TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN/TWILIO_PHONE_NUMBER
 * ou AFRICAS_TALKING_USERNAME/AFRICAS_TALKING_API_KEY) : implémenter `envoyerSms` avec le SDK
 * choisi et échanger le provider dans `CommunicationModule`, sans toucher aux appelants.
 */
@Injectable()
export class CommunicationSimulationService implements CommunicationService {
  private readonly logger = new Logger('CommunicationService');

  async envoyerSms(options: EnvoiSmsOptions): Promise<void> {
    this.logger.log(
      `[SIMULATION SMS] à ${options.telephone} (langue=${options.langue ?? 'fr'}) : ${options.contenu}`,
    );
  }
}
