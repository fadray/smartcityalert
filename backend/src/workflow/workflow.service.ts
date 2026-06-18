import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Incident } from '../incidents/incident.entity';
import { EscalationRule } from './workflow.interface';

@Injectable()
export class WorkflowService {
  private readonly logger = new Logger(WorkflowService.name);
  private escalationRules: EscalationRule[] = [
    { id: '1', level: 1, role: 'responder', timeout_minutes: 30, next_role: 'supervisor', is_active: true },
    { id: '2', level: 2, role: 'supervisor', timeout_minutes: 60, next_role: 'hod', is_active: true },
    { id: '3', level: 3, role: 'hod', timeout_minutes: 120, next_role: 'dept_director', is_active: true },
    { id: '4', level: 4, role: 'dept_director', timeout_minutes: 180, next_role: 'overall_manager', is_active: true },
    { id: '5', level: 5, role: 'overall_manager', timeout_minutes: 240, next_role: 'overall_director', is_active: true },
    { id: '6', level: 6, role: 'overall_director', timeout_minutes: 300, next_role: 'admin', is_active: true },
  ];

  constructor(
    @InjectRepository(Incident)
    private incidentRepository: Repository<Incident>,
  ) {}

  async getWorkflowStatus(incidentId: string): Promise<any> {
    const incident = await this.incidentRepository.findOne({ where: { id: incidentId } });
    if (!incident) return null;
    
    const currentRule = this.escalationRules.find(r => r.level === incident.current_workflow_level);
    
    return {
      current_level: incident.current_workflow_level,
      current_role: currentRule?.role,
      max_level: this.escalationRules.length,
      status: incident.status,
      escalation_history: incident.escalation_history || [],
      time_elapsed_minutes: Math.floor((Date.now() - new Date(incident.created_at).getTime()) / 60000),
      next_role: currentRule?.next_role,
      next_timeout: currentRule?.timeout_minutes,
    };
  }

  async getEscalationRules(): Promise<EscalationRule[]> {
    return this.escalationRules;
  }

  async createEscalationRule(rule: any): Promise<EscalationRule> {
    const newRule: EscalationRule = {
      id: Date.now().toString(),
      level: this.escalationRules.length + 1,
      role: rule.role,
      timeout_minutes: rule.timeout_minutes,
      next_role: rule.next_role,
      is_active: true,
    };
    this.escalationRules.push(newRule);
    return newRule;
  }

  async updateEscalationRule(id: string, rule: any): Promise<EscalationRule> {
    const index = this.escalationRules.findIndex(r => r.id === id);
    if (index === -1) throw new Error('Rule not found');
    
    this.escalationRules[index] = { ...this.escalationRules[index], ...rule };
    return this.escalationRules[index];
  }

  async getWorkflowConfig(): Promise<any> {
    return {
      rules: this.escalationRules,
      auto_escalation_enabled: true,
      check_interval_minutes: 5,
      notification_enabled: true,
    };
  }

  async updateWorkflowConfig(config: any): Promise<any> {
    if (config.rules) {
      this.escalationRules = config.rules;
    }
    return { success: true, config: await this.getWorkflowConfig() };
  }
}
