import { Entity, PrimaryColumn, Column } from 'typeorm';

/**
 * Référentiel des langues proposées à l'inscription et pour les communications
 * (SMS, chatbot). Pas de FK stricte depuis `Utilisateur.languePrefereeCode` :
 * la validation se fait en application (LanguesService.assertValide) pour éviter
 * un blocage de `synchronize()` si la table est encore vide au premier démarrage.
 */
@Entity('langues')
export class Langue {
  @PrimaryColumn({ length: 8 })
  code: string;

  @Column()
  libelle: string;

  @Column({ default: true })
  actif: boolean;
}
