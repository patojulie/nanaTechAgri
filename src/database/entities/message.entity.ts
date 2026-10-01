import { Entity, PrimaryColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Conversation } from './conversation.entity';

export enum AuteurTypeMessage {
  BOT = 'BOT',
  PRODUCTEUR = 'PRODUCTEUR',
  ACHETEUR = 'ACHETEUR',
  AGENT = 'AGENT',
  ADMIN = 'ADMIN',
}

@Entity('messages')
@Index(['conversationId'])
export class Message {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;

  @Column()
  conversationId: string;

  /** Utilisateur.id, nullable si auteurType = BOT. */
  @Column({ nullable: true })
  auteurId: string;

  @Column({ type: 'enum', enum: AuteurTypeMessage })
  auteurType: AuteurTypeMessage;

  @Column('text')
  contenu: string;

  @CreateDateColumn()
  dateEnvoi: Date;

  @ManyToOne(() => Conversation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversationId' })
  conversation: Conversation;
}
