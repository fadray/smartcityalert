import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkflowConfig } from './workflow-config.entity';

@Injectable()
export class WorkflowConfigService {
  constructor(
    @InjectRepository(WorkflowConfig)
    private configRepository: Repository<WorkflowConfig>,
  ) {}

  async getConfig(departmentId?: string): Promise<WorkflowConfig> {
    let config = await this.configRepository.findOne({
      where: departmentId ? { department_id: departmentId } : { name: 'default' },
    });
    
    if (!config) {
      // Create default config
      config = await this.createDefaultConfig(departmentId);
    }
    
    return config;
  }

  async createDefaultConfig(departmentId?: string): Promise<WorkflowConfig> {
    const config = new WorkflowConfig();
    config.name = departmentId ? `Department_${departmentId}` : 'default';
    config.is_active = true;
    config.acknowledgment_rules = {
      roles: ['responder', 'supervisor'],
      auto_acknowledge: false,
      timeout_minutes: 30,
    };
    config.assignment_rules = {
      auto_assign: false,
      assignment_type: 'manual',
      timeout_minutes: 60,
    };
    config.escalation_levels = [
      { level: 1, role: 'responder', timeout_minutes: 30, next_role: 'supervisor', notification_enabled: true },
      { level: 2, role: 'supervisor', timeout_minutes: 60, next_role: 'hod', notification_enabled: true },
      { level: 3, role: 'hod', timeout_minutes: 120, next_role: 'dept_director', notification_enabled: true },
      { level: 4, role: 'dept_director', timeout_minutes: 180, next_role: 'overall_manager', notification_enabled: true },
      { level: 5, role: 'overall_manager', timeout_minutes: 240, next_role: 'overall_director', notification_enabled: true },
      { level: 6, role: 'overall_director', timeout_minutes: 300, next_role: 'admin', notification_enabled: true },
    ];
    config.closure_rules = {
      required_roles: ['responder', 'supervisor'],
      require_approval: true,
      approval_roles: ['supervisor', 'hod', 'dept_director'],
    };
    config.department_id = departmentId || null;
    
    return this.configRepository.save(config);
  }

  async updateConfig(id: string, updateData: any): Promise<WorkflowConfig> {
    await this.configRepository.update(id, updateData);
    return this.getConfigById(id);
  }

  async getConfigById(id: string): Promise<WorkflowConfig> {
    const config = await this.configRepository.findOne({ where: { id } });
    if (!config) throw new NotFoundException('Workflow config not found');
    return config;
  }

  async getAllConfigs(): Promise<WorkflowConfig[]> {
    return this.configRepository.find();
  }
}
