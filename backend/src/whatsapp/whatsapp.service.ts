import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WhatsAppMessage } from './whatsapp-message.entity';
import { IncidentsService } from '../incidents/incidents.service';
import { UsersService } from '../users/users.service';
import { DepartmentsService } from '../departments/departments.service';
import { Department } from '../departments/department.entity';

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);

  constructor(
    @InjectRepository(WhatsAppMessage)
    private whatsappRepo: Repository<WhatsAppMessage>,
    private incidentsService: IncidentsService,
    private usersService: UsersService,
    private departmentsService: DepartmentsService,
  ) {
    this.logger.log('WhatsApp Service initialized');
  }

  async processAndCreateIncident(messageData: {
    from: string;
    body: string;
    mediaUrl?: string;
    mediaType?: string;
    profileName?: string;
  }) {
    try {
      this.logger.log(`Processing WhatsApp message from ${messageData.from}`);
      
      // Find or create user
      let user = await this.usersService.findByPhone(messageData.from);
      if (!user) {
        user = await this.usersService.createFromWhatsApp({
          phone: messageData.from,
          name: messageData.profileName || `WhatsApp User ${messageData.from.slice(-4)}`,
          role: 'resident',
        });
        this.logger.log(`Created new user: ${user.id}`);
      }
      
      // Detect incident type
      let incidentType = 'general';
      let severity = 1;
      const body = messageData.body.toLowerCase();
      
      if (body.includes('fire') || body.includes('burning') || body.includes('smoke')) {
        incidentType = 'fire';
        severity = 5;
      } else if (body.includes('medical') || body.includes('injury') || body.includes('ambulance') || body.includes('collapsed')) {
        incidentType = 'medical';
        severity = 5;
      } else if (body.includes('theft') || body.includes('robbery') || body.includes('suspicious')) {
        incidentType = 'security';
        severity = 4;
      } else if (body.includes('road') || body.includes('light') || body.includes('drainage')) {
        incidentType = 'infrastructure';
        severity = 2;
      } else if (body.includes('traffic') || body.includes('congestion')) {
        incidentType = 'traffic';
        severity = 3;
      } else if (body.includes('flood') || body.includes('water logging')) {
        incidentType = 'flooding';
        severity = 4;
      }
      
      // Get department - explicitly type as Department | null
      let department: Department | null = null;
      const departmentMap: Record<string, string> = {
        fire: 'Fire Service',
        medical: 'Health Services', 
        security: 'Security',
        infrastructure: 'Maintenance',
        traffic: 'Traffic Management',
        flooding: 'Drainage Services'
      };
      
      const departmentName = departmentMap[incidentType];
      if (departmentName) {
        department = await this.departmentsService.findByName(departmentName);
        if (department) {
          this.logger.log(`Department found: ${department.name}`);
        } else {
          this.logger.log(`No department found for: ${departmentName}`);
        }
      }
      
      // Create incident
      const incident = await this.incidentsService.create(
        {
          title: `${incidentType.toUpperCase()} Report via WhatsApp`,
          description: messageData.body,
          incident_type: incidentType,
          department_id: department?.id || null,
          severity_level: severity,
          latitude: 0,
          longitude: 0,
        },
        user.id,
        messageData.mediaUrl ? [messageData.mediaUrl] : []
      );
      
      this.logger.log(`Created incident: ${incident.id}`);
      
      // Save WhatsApp message
      const whatsappMsg = this.whatsappRepo.create({
        from_number: messageData.from,
        message_body: messageData.body,
        media_url: messageData.mediaUrl,
        media_type: messageData.mediaType,
        status: 'processed',
        detected_incident_type: incidentType,
        extracted_data: { type: incidentType, severity, raw: messageData.body },
        incident_id: incident.id,
        processed_by_id: user.id,
        twilio_metadata: {
          profileName: messageData.profileName,
          timestamp: new Date(),
        },
      });
      
      await this.whatsappRepo.save(whatsappMsg);
      this.logger.log(`Saved WhatsApp message for incident: ${incident.id}`);
      
      return incident;
    } catch (error) {
      this.logger.error(`Error processing WhatsApp message: ${error.message}`);
      throw error;
    }
  }
}
