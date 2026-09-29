import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, OneToMany, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Utilisateur } from './utilisateur.entity';
import { Exploitation } from './exploitation.entity';
import { Annonce } from './annonce.entity';
import { MiseEnRelation } from './mise-en-relation.entity';
import { ValidationFiche } from './validation-fiche.entity';

@Entity('producteurs')
@Index(['userId'])
export class Producteur {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;

  @Column({ unique: true })
  userId: string;

  @Column({ nullable: true })
  identificationNumber: string;

  @Column({ nullable: true })
  identificationType: string;

  @Column({ nullable: true, type: 'timestamp' })
  identificationIssueDate: Date;

  @Column()
  address: string;

  @Column({ nullable: true })
  postalCode: string;

  @Column()
  city: string;

  @Column()
  region: string;

  @Column({ default: 'Togo' })
  pays: string;

  @Column({ nullable: true })
  geolocation: string;

  @Column()
  yearsOfExperience: number;

  @CreateDateColumn()
  registrationDate: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToOne(() => Utilisateur, (utilisateur) => utilisateur.producteur)
  @JoinColumn()
  utilisateur: Utilisateur;

  @OneToMany(() => Exploitation, (exploitation) => exploitation.producteur)
  exploitations: Exploitation[];

  @OneToMany(() => Annonce, (annonce) => annonce.producteur)
  annonces: Annonce[];

  @OneToMany(() => MiseEnRelation, (mise) => mise.producteur)
  miseEnRelations: MiseEnRelation[];

  @OneToMany(() => ValidationFiche, (validation) => validation.producteur)
  validations: ValidationFiche[];
}
