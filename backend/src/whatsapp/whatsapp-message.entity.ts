import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Incident } from '../incidents/incident.entity';
import { User } from '../users/user.entity';

@Entity('whatsapp_messages')
export class WhatsAppMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'from_number' })
  from_number: string;

  @Column({ name: 'message_body' })
  message_body: string;

  @Column({ name: 'media_url', nullable: true })
  media_url: string;

  @Column({ name: 'media_type', nullable: true })
  media_type: string;

  @Column({ default: 'received' })
  status: string;

  @Column({ name: 'detected_incident_type', nullable: true })
  detected_incident_type: string;

  @Column({ name: 'extracted_data', type: 'jsonb', default: {} })
  extracted_data: any;

  @Column({ name: 'incident_id', nullable: true })
  incident_id: string;

  @ManyToOne(() => Incident)
  @JoinColumn({ name: 'incident_id' })
  incident: Incident;

  @Column({ name: 'processed_by_id', nullable: true })
  processed_by_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'processed_by_id' })
  processed_by: User;

  @Column({ name: 'twilio_metadata', type: 'jsonb', default: {} })
  twilio_metadata: any;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;
}
