import { Entity, PrimaryColumn, Column, CreateDateColumn, OneToOne, OneToMany, JoinColumn, Index } from 'typeorm';
import { Utilisateur } from './utilisateur.entity';
import { MiseEnRelation } from './mise-en-relation.entity';

@Entity('acheteurs')
@Index(['utilisateurId'])
export class Acheteur {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;

  @Column({ unique: true })
  utilisateurId: string;

  @Column()
  typeSociete: string;

  @Column({ nullable: true })
  nomSociete: string;

  @Column({ nullable: true })
  adresseSociete: string;

  @Column({ nullable: true })
  telephone: string;

  @Column({ nullable: true })
  email: string;

  @CreateDateColumn()
  dateCreation: Date;

  // Relations
  @OneToOne(() => Utilisateur, (utilisateur) => utilisateur.acheteur)
  @JoinColumn()
  utilisateur: Utilisateur;

  @OneToMany(() => MiseEnRelation, (mise) => mise.acheteur)
  miseEnRelations: MiseEnRelation[];
}
