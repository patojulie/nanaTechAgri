import { Entity, PrimaryColumn, Column, UpdateDateColumn, OneToOne, JoinColumn, Index } from 'typeorm';
import { Cooperative } from './cooperative.entity';

@Entity('tableaux_bord_cooperatives')
@Index(['cooperativeId'])
export class TableauDeBordCooperative {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;

  @Column({ unique: true })
  cooperativeId: string;

  @Column({ default: 0 })
  totalProducteurs: number;

  @Column({ default: 0 })
  totalExploitations: number;

  @Column({ default: 0 })
  totalAnnonces: number;

  @Column({ default: 0 })
  totalValidations: number;

  @Column({ default: 0 })
  validationsEnCours: number;

  @UpdateDateColumn()
  dateModification: Date;

  // Relations
  @OneToOne(() => Cooperative, (cooperative) => cooperative.tableauDeBord, { onDelete: 'CASCADE' })
  @JoinColumn()
  cooperative: Cooperative;
}
