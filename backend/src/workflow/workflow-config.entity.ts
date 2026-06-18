import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('workflow_config')
export class WorkflowConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ default: true })
  is_active: boolean;

  @Column({ type: 'jsonb', nullable: true })
  acknowledgment_rules: {
    roles: string[];
    auto_acknowledge: boolean;
    timeout_minutes: number;
  };

  @Column({ type: 'jsonb', nullable: true })
  assignment_rules: {
    auto_assign: boolean;
    assignment_type: 'manual' | 'round_robin' | 'load_balanced';
    timeout_minutes: number;
  };

  @Column({ type: 'jsonb', nullable: true })
  escalation_levels: Array<{
    level: number;
    role: string;
    timeout_minutes: number;
    next_role: string;
    notification_enabled: boolean;
  }>;

  @Column({ type: 'jsonb', nullable: true })
  closure_rules: {
    required_roles: string[];
    require_approval: boolean;
    approval_roles: string[];
  };

  @Column({ type: 'varchar', nullable: true })
  department_id: string | null;  // Keep the union type

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}