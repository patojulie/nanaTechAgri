// Core entities
export * from './utilisateur.entity';
export * from './producteur.entity';
export * from './exploitation.entity';
export * from './activite-exploitation.entity';
export * from './annonce.entity';
export * from './agent.entity';
export * from './enregistrement-compte.entity';
export * from './cooperative.entity';
export * from './validation-fiche.entity';
export * from './tableau-de-bord-cooperative.entity';
export * from './acheteur.entity';
export * from './mise-en-relation.entity';
export * from './journal-synchronisation.entity';
export * from './notification.entity';
export * from './export-donnees.entity';
export * from './audit-log.entity';

// Subscription & Payment entities
export * from './subscription.entity';
export * from './subscription-feature.entity';
export * from './subscription-usage.entity';
export * from './subscription-plan.entity';
export * from './payment.entity';

// Enums
export * from '../enums/subscription.enum';

// Export explicit entity classes for TypeORM configuration
import { Utilisateur } from './utilisateur.entity';
import { Producteur } from './producteur.entity';
import { Exploitation } from './exploitation.entity';
import { ActiviteExploitation } from './activite-exploitation.entity';
import { Annonce } from './annonce.entity';
import { Agent } from './agent.entity';
import { EnregistrementCompte } from './enregistrement-compte.entity';
import { Cooperative } from './cooperative.entity';
import { ValidationFiche } from './validation-fiche.entity';
import { TableauDeBordCooperative } from './tableau-de-bord-cooperative.entity';
import { Acheteur } from './acheteur.entity';
import { MiseEnRelation } from './mise-en-relation.entity';
import { JournalSynchronisation } from './journal-synchronisation.entity';
import { Notification } from './notification.entity';
import { ExportDonnees } from './export-donnees.entity';
import { AuditLog } from './audit-log.entity';
import { Subscription } from './subscription.entity';
import { SubscriptionFeature } from './subscription-feature.entity';
import { SubscriptionUsage } from './subscription-usage.entity';
import { SubscriptionPlan } from './subscription-plan.entity';
import { Payment } from './payment.entity';

export const EntityList = [
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
  Subscription,
  SubscriptionFeature,
  SubscriptionUsage,
  SubscriptionPlan,
  Payment,
];
