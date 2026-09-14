import { Entity, PrimaryColumn, Column, CreateDateColumn, OneToOne, OneToMany, JoinColumn, Index } from 'typeorm';
import { Utilisateur } from './utilisateur.entity';
import { EnregistrementCompte } from './enregistrement-compte.entity';
import { JournalSynchronisation } from './journal-synchronisation.entity';

@Entity('agents')
@Index(['utilisateurId'])
@Index(['zone'])
export class Agent {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;

  @Column({ unique: true })
  utilisateurId: string;

  @Column({ unique: true })
  numeroIdentifiant: string;

  @Column()
  zone: string;

  @CreateDateColumn()
  dateAffectation: Date;

  @Column({ default: 'ACTIF' })
  statut: string;

  @Column({ nullable: true, type: 'timestamp' })
  derniereConnexion: Date;

  @CreateDateColumn()
  dateCreation: Date;

  // Relations
  @OneToOne(() => Utilisateur, (utilisateur) => utilisateur.agent)
  @JoinColumn()
  utilisateur: Utilisateur;

  @OneToMany(() => EnregistrementCompte, (enregistrement) => enregistrement.agent)
  enregistrementsCompte: EnregistrementCompte[];

  @OneToMany(() => JournalSynchronisation, (journal) => journal.agent)
  synchronisations: JournalSynchronisation[];
}
