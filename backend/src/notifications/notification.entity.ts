import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';

export enum NotificationType {
  NEW_INCIDENT = 'new_incident',
  STATUS_CHANGE = 'status_change',
  ASSIGNMENT = 'assignment',
  ESCALATION = 'escalation',
  RESOLUTION_PROOF = 'resolution_proof',
  APPROVAL = 'approval',
  REJECTION = 'rejection',
}

export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  user_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'varchar', length: 50 })
  type: string;

  @Column({ type: 'varchar', length: 20, default: NotificationPriority.MEDIUM })
  priority: string;

  @Column({ name: 'incident_id', nullable: true })
  incident_id: string;

  @Column({ name: 'is_read', default: false })
  is_read: boolean;

  @Column({ name: 'email_sent', default: false })
  email_sent: boolean;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;
}
