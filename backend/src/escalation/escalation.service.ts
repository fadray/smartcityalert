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
    
    const incidents = await this.incidentRepository.find({
      where: { status: In(['pending', 'acknowledged', 'assigned', 'in_progress']) },
    });
    
    for (const incident of incidents) {
      const timeSinceCreation = Date.now() - new Date(incident.created_at).getTime();
      const escalationTimeout = incident.current_workflow_level * 30 * 60 * 1000;
      
      if (timeSinceCreation > escalationTimeout && incident.current_workflow_level < 8) {
        incident.current_workflow_level += 1;
        incident.status = 'escalated';
        
        // Parse existing history or create new array
        let history: any[] = [];
        if (incident.escalation_history && typeof incident.escalation_history === 'string') {
          try {
            history = JSON.parse(incident.escalation_history);
          } catch (e) {
            history = [];
          }
        }
        
        history.push({
          level: incident.current_workflow_level,
          timestamp: new Date(),
          reason: 'Auto-escalated due to timeout',
        });
        
        incident.escalation_history = JSON.stringify(history);
        await this.incidentRepository.save(incident);
        this.logger.warn(`Escalated incident ${incident.id} to level ${incident.current_workflow_level}`);
      }
    }
  }
}
