import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Incident } from '../incidents/incident.entity';

@Injectable()
export class EscalationService {
  private readonly logger = new Logger(EscalationService.name);

  constructor(
    @InjectRepository(Incident)
    private incidentRepository: Repository<Incident>,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async checkAndEscalate() {
    this.logger.log('Checking for incidents needing escalation...');
    
    try {
      const incidents = await this.incidentRepository.find({
        where: { status: In(['pending', 'acknowledged', 'assigned', 'in_progress']) },
      });
      
      for (const incident of incidents) {
        const timeSinceCreation = Date.now() - new Date(incident.created_at).getTime();
        const escalationTimeout = incident.current_workflow_level * 30 * 60 * 1000;
        
        if (timeSinceCreation > escalationTimeout && incident.current_workflow_level < 8) {
          await this.escalateIncident(incident);
        }
      }
    } catch (error) {
      this.logger.error(`Error in escalation check: ${error.message}`);
    }
  }

  async escalateIncident(incident: Incident) {
    try {
      const newLevel = incident.current_workflow_level + 1;
      
      let history: any[] = Array.isArray(incident.escalation_history) ? incident.escalation_history : [];
      
      history.push({
        level: newLevel,
        timestamp: new Date().toISOString(),
        reason: `Auto-escalated due to timeout (level ${incident.current_workflow_level} → ${newLevel})`,
      });
      
      // ✅ Pass array directly for JSONB column
      await this.incidentRepository.update(incident.id, {
        current_workflow_level: newLevel,
        status: 'escalated',
        escalation_history: history,  // ✅ Array directly
        updated_at: new Date(),
      });
      
      this.logger.warn(`Escalated incident ${incident.id} from level ${incident.current_workflow_level} to ${newLevel}`);
    } catch (error) {
      this.logger.error(`Failed to escalate incident ${incident.id}: ${error.message}`);
      throw error;
    }
  }

  async manualEscalate(incidentId: string): Promise<Incident> {
    const incident = await this.incidentRepository.findOne({
      where: { id: incidentId },
    });
    
    if (!incident) {
      throw new Error('Incident not found');
    }
    
    await this.escalateIncident(incident);
    const updatedIncident = await this.incidentRepository.findOne({
      where: { id: incidentId },
    });
    
    return updatedIncident as Incident;
  }

  async getEscalationHistory(incidentId: string): Promise<any[]> {
    const incident = await this.incidentRepository.findOne({
      where: { id: incidentId },
      select: ['escalation_history'] as any,
    });
    
    if (!incident) {
      return [];
    }
    
    return Array.isArray(incident.escalation_history) 
      ? incident.escalation_history 
      : [];
  }
}
