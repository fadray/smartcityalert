import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Department } from '../departments/department.entity';
import { User } from '../users/user.entity';

export enum MaintenanceStatus {
  PENDING = 'pending',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  VERIFIED = 'verified',
  CANCELLED = 'cancelled'
}

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

@Entity('maintenance_requests')
export class MaintenanceRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column()
  location: string;

  @Column({ type: 'enum', enum: MaintenanceStatus, default: MaintenanceStatus.PENDING })
  status: MaintenanceStatus;

  @Column({ type: 'enum', enum: Priority, default: Priority.MEDIUM })
  priority: Priority;

  @ManyToOne(() => Department)
  @JoinColumn({ name: 'department_id' })
  department: Department;

  @Column({ nullable: true })
  department_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reported_by' })
  reported_by: User;

  @Column({ nullable: true })
  reported_by_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'assigned_to' })
  assigned_to: User;

  @Column({ nullable: true })
  assigned_to_id: string;

  @Column({ type: 'simple-array', nullable: true })
  images: string[];

  @Column({ type: 'date', nullable: true })
  scheduled_date: Date;

  @Column({ type: 'date', nullable: true })
  completion_date: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  estimated_cost: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  actual_cost: number;

  @Column({ type: 'text', nullable: true })
  technician_notes: string;

  @Column({ type: 'text', nullable: true })
  verification_notes: string;

  @Column({ type: 'simple-array', nullable: true })
  parts_used: string[];

  @Column({ default: false })
  requires_verification: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

@Entity('assets')
export class Asset {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  asset_tag: string;

  @Column()
  location: string;

  @Column({ nullable: true })
  manufacturer: string;

  @Column({ nullable: true })
  model: string;

  @Column({ type: 'date', nullable: true })
  purchase_date: Date;

  @Column({ type: 'date', nullable: true })
  warranty_expiry: Date;

  @Column({ nullable: true })
  last_maintenance_date: Date;

  @Column({ nullable: true })
  next_maintenance_date: Date;

  @Column({ default: true })
  is_active: boolean;

  @Column({ type: 'jsonb', default: [] })
  maintenance_history: any[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
