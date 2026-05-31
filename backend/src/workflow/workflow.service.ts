import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Incident } from '../incidents/incident.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { WebsocketGateway } from '../websocket/websocket.gateway';

@Injectable()
export class WorkflowService {
  private readonly logger = new Logger(WorkflowService.name);

  constructor(
    @InjectRepository(Incident)
    private incidentRepo: Repository<Incident>,
    private notificationService: NotificationsService,
    private websocketGateway: WebsocketGateway,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async processEscalations() {
    this.logger.log('Checking for incidents needing escalation...');
    
    const incidents = await this.incidentRepo
      .createQueryBuilder('incident')
      .where('incident.status IN (:...statuses)', { 
        statuses: ['pending', 'acknowledged', 'assigned', 'in_progress'] 
      })
      .andWhere('incident.current_workflow_level < 8')
      .andWhere(
        `incident.last_escalated_at IS NULL OR 
         incident.last_escalated_at < NOW() - (incident.current_workflow_level * INTERVAL '30 minutes')`
      )
      .getMany();

    for (const incident of incidents) {
      await this.escalateIncident(incident);
    }
  }

  async escalateIncident(incident: Incident) {
    const newLevel = incident.current_workflow_level + 1;
    
    this.logger.warn(`Escalating incident ${incident.id} to level ${newLevel}`);
    
    // Determine target role based on escalation level
    const targetRole = this.getTargetRoleForLevel(newLevel, incident.department_id);
    
    incident.current_workflow_level = newLevel;
    incident.last_escalated_at = new Date();
    incident.status = 'escalated';
    incident.escalation_history.push({
      level: newLevel,
      timestamp: new Date(),
      target_role: targetRole,
      reason: `No response within timeout period (Level ${newLevel-1} to ${newLevel})`,
    });
    
    await this.incidentRepo.save(incident);
    
    // Notify target users
    await this.notifyTargetRole(targetRole, incident);
    
    // Send real-time update
    this.websocketGateway.emitToAll('incident_escalated', {
      incidentId: incident.id,
      level: newLevel,
      targetRole: targetRole,
    });
    
    // For level 5+, send SMS to directors
    if (newLevel >= 5) {
      await this.sendHighLevelAlert(incident);
    }
  }

  getTargetRoleForLevel(level: number, departmentId: string): string {
    const roleMap: { [key: number]: string } = {
      1: 'responder',
      2: 'supervisor',
      3: 'hod',
      4: 'dept_director',
      5: 'overall_manager',
      6: 'overall_director',
      7: 'overall_director',
      8: 'admin',
    };
    return roleMap[level] || 'admin';
  }

  async notifyTargetRole(role: string, incident: Incident) {
    // Find users with this role in the same department
    const users = await this.incidentRepo.manager.query(`
      SELECT u.* FROM users u
      WHERE u.role = $1 AND u.department_id = $2 AND u.is_active = true
    `, [role, incident.department_id]);
    
    for (const user of users) {
      await this.notificationService.sendToUser(user.id, {
        title: `⚠️ Escalated: Incident #${incident.id.slice(0,8)}`,
        body: `Level ${incident.current_workflow_level} - ${incident.title}`,
        data: { incidentId: incident.id, action: 'view_incident' },
        priority: 'high',
      });
    }
  }

  async sendHighLevelAlert(incident: Incident) {
    const directors = await this.incidentRepo.manager.query(`
      SELECT phone, email FROM users 
      WHERE role IN ('overall_manager', 'overall_director', 'admin')
    `);
    
    for (const director of directors) {
      await this.notificationService.sendSMS(
        director.phone,
        `URGENT: Incident ${incident.id.slice(0,8)} escalated to level ${incident.current_workflow_level}. Type: ${incident.incident_type}. Immediate action required.`
      );
    }
  }

  async getWorkflowStatus(incidentId: string): Promise<any> {
    const incident = await this.incidentRepo.findOne({ where: { id: incidentId } });
    
    return {
      current_level: incident.current_workflow_level,
      max_level: 8,
      status: incident.status,
      escalation_history: incident.escalation_history,
      time_elapsed: Math.floor((Date.now() - new Date(incident.created_at).getTime()) / 60000),
      estimated_completion: this.estimateCompletion(incident),
    };
  }

  estimateCompletion(incident: Incident): Date {
    const baseTime = new Date(incident.created_at);
    const levelMultiplier = incident.current_workflow_level;
    const minutes = levelMultiplier * 30;
    return new Date(baseTime.getTime() + minutes * 60000);
  }
}
