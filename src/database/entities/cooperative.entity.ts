import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, OneToMany, JoinColumn, Index } from 'typeorm';
import { Utilisateur } from './utilisateur.entity';
import { ValidationFiche } from './validation-fiche.entity';
import { TableauDeBordCooperative } from './tableau-de-bord-cooperative.entity';

@Entity('cooperatives')
@Index(['utilisateurId'])
@Index(['region'])
export class Cooperative {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;

  @Column({ unique: true })
  utilisateurId: string;

  @Column()
  nomOfficial: string;

  @Column({ unique: true })
  numeroRegistration: string;

  @Column()
  adresse: string;

  @Column()
  region: string;

  @Column()
  telephone: string;

  @Column()
  email: string;

  @Column({ default: 0 })
  nombreMembres: number;

  @CreateDateColumn()
  dateCreation: Date;

  @UpdateDateColumn()
  dateModification: Date;

  // Relations
  @OneToOne(() => Utilisateur, (utilisateur) => utilisateur.cooperative)
  @JoinColumn()
  utilisateur: Utilisateur;

  @OneToMany(() => ValidationFiche, (validation) => validation.cooperative)
  validations: ValidationFiche[];

  @OneToOne(() => TableauDeBordCooperative, (tableau) => tableau.cooperative, { nullable: true })
  tableauDeBord: TableauDeBordCooperative;
}
