export interface EnvoiSmsOptions {
  telephone: string;
  contenu: string;
  /** Code Langue (référentiel `langues`) — pour un futur gabarit de message multilingue. */
  langue?: string;
}

/**
 * Point d'entrée unique pour l'envoi de SMS aux utilisateurs sans smartphone (notifications
 * de statut, résultats d'escalade...). Interface abstraite : voir `CommunicationSimulationService`
 * pour l'implémentation par défaut (mode simulation, aucun SMS réel envoyé).
 */
export abstract class CommunicationService {
  abstract envoyerSms(options: EnvoiSmsOptions): Promise<void>;
}
