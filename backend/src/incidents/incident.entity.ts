import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Department } from '../departments/department.entity';
import { User } from '../users/user.entity';
import { Responder } from '../responders/responder.entity';

@Entity('incidents')
export class Incident {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  incident_type: string;

  @ManyToOne(() => Department)
  @JoinColumn({ name: 'department_id' })
  department: Department;

  @Column({ nullable: true })
  department_id: string;

  @Column({ default: 1 })
  severity_level: number;

  @Column({ default: 'pending' })
  status: string;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  longitude: number;

  @Column({ type: 'text', nullable: true })
  images: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reported_by_id' })
  reported_by: User;

  @Column({ nullable: true })
  reported_by_id: string;

  @ManyToOne(() => Responder)
  @JoinColumn({ name: 'assigned_to_id' })
  assigned_to: Responder;

  @Column({ nullable: true })
  assigned_to_id: string;

  @Column({ nullable: true })
  assignee_type: string;

  @Column({ default: 1 })
  current_workflow_level: number;

  @Column({ type: 'text', nullable: true })
  escalation_history: string;

  @Column({ type: 'text', nullable: true })
  resolution_proofs: string;

  @Column({ type: 'text', nullable: true })
  approvals: string;

  @Column({ nullable: true })
  resolved_at: Date;

  @Column({ nullable: true })
  resolution_notes: string;

  @Column({ default: false })
  is_fully_approved: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
