import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { WhatsAppMessage } from './whatsapp-message.entity';
import { IncidentsService } from '../incidents/incidents.service';
import { UsersService } from '../users/users.service';
import { DepartmentsService } from '../departments/departments.service';
import { Department } from '../departments/department.entity';

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private twilioClient: any;

  constructor(
    @InjectRepository(WhatsAppMessage)
    private whatsappRepo: Repository<WhatsAppMessage>,
    private incidentsService: IncidentsService,
    private usersService: UsersService,
    private departmentsService: DepartmentsService,
    private configService: ConfigService,
  ) {
    this.logger.log('WhatsApp Service initialized');
    
    // Initialize Twilio client if credentials are available
    const accountSid = this.configService.get('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get('TWILIO_AUTH_TOKEN');
    if (accountSid && authToken) {
      this.twilioClient = require('twilio')(accountSid, authToken);
      this.logger.log('Twilio client initialized');
    } else {
      this.logger.warn('Twilio credentials not found. Auto-reply will be in mock mode.');
    }
  }

  /**
   * Send a WhatsApp message via Twilio
   */
  async sendWhatsAppMessage(to: string, message: string): Promise<any> {
    try {
      if (!this.twilioClient) {
        this.logger.log(`[MOCK] Would send to ${to}: ${message}`);
        return { mock: true, message: 'Message sent in mock mode' };
      }

      const response = await this.twilioClient.messages.create({
        body: message,
        from: this.configService.get('TWILIO_WHATSAPP_NUMBER', 'whatsapp:+14155238886'),
        to: `whatsapp:${to}`,
      });
      
      this.logger.log(`WhatsApp message sent to ${to}, SID: ${response.sid}`);
      return response;
    } catch (error) {
      this.logger.error(`Failed to send WhatsApp message: ${error.message}`);
      throw error;
    }
  }

  /**
   * Send auto-reply to user confirming incident receipt
   */
  private async sendAutoReply(to: string, incident: any, incidentType: string): Promise<void> {
    try {
      // Get values from environment variables with fallbacks
      const trackUrl = this.configService.get('WHATSAPP_TRACK_URL', 'https://your-domain.com/track');
      const emergencyPhone = this.configService.get('WHATSAPP_EMERGENCY_PHONE', '+234-XXX-XXX-XXXX');
      const appName = this.configService.get('WHATSAPP_APP_NAME', 'SmartCityAlert');

      const typeEmojis: Record<string, string> = {
        fire: '🔥',
        medical: '🚑',
        security: '👮',
        infrastructure: '🔧',
        traffic: '🚦',
        flooding: '🌊',
        general: '📋'
      };

      const typeNames: Record<string, string> = {
        fire: 'Fire Emergency',
        medical: 'Medical Emergency',
        security: 'Security Incident',
        infrastructure: 'Infrastructure Issue',
        traffic: 'Traffic Incident',
        flooding: 'Flooding',
        general: 'General Report'
      };

      const emoji = typeEmojis[incidentType] || '📋';
      const typeName = typeNames[incidentType] || incidentType.charAt(0).toUpperCase() + incidentType.slice(1);
      const severityLevel = incident.severity_level || 1;
      const severityEmoji = severityLevel >= 4 ? '🔴' : severityLevel >= 3 ? '🟡' : '🟢';

      const message = 
        `✅ *${appName} - Incident Report Received!*\n\n` +
        `${emoji} *Type:* ${typeName}\n` +
        `🆔 *Incident ID:* \`${incident.id.slice(0, 8)}\`\n` +
        `📊 *Severity:* ${severityEmoji} Level ${severityLevel}\n` +
        `📅 *Time:* ${new Date().toLocaleString()}\n\n` +
        `Your report has been received and will undergo swift processing.\n` +
        `A responder will be assigned shortly.\n\n` +
        `📱 Track status: ${trackUrl}/${incident.id}\n` +
        `📞 For emergencies, call: ${emergencyPhone}\n\n` +
        `_Reply HELP for available commands_`;

      await this.sendWhatsAppMessage(to, message);
      
      this.logger.log(`Auto-reply sent to ${to} for incident ${incident.id}`);
    } catch (error) {
      this.logger.error(`Failed to send auto-reply to ${to}: ${error.message}`);
      // Don't throw - we don't want to fail the incident creation if reply fails
    }
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
      } else if (body.includes('road') || body.includes('light') || body.includes('drainage') || body.includes('power') || body.includes('electricity')) {
        incidentType = 'infrastructure';
        severity = 2;
      } else if (body.includes('traffic') || body.includes('congestion') || body.includes('jam')) {
        incidentType = 'traffic';
        severity = 3;
      } else if (body.includes('flood') || body.includes('water logging') || body.includes('drainage blocked')) {
        incidentType = 'flooding';
        severity = 4;
      }
      
      // Get department
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
        extracted_data: { 
          type: incidentType, 
          severity, 
          raw: messageData.body,
          profileName: messageData.profileName 
        },
        incident_id: incident.id,
        processed_by_id: user.id,
        twilio_metadata: {
          profileName: messageData.profileName,
          timestamp: new Date(),
        },
      });
      
      await this.whatsappRepo.save(whatsappMsg);
      this.logger.log(`Saved WhatsApp message for incident: ${incident.id}`);
      
      // ✅ SEND AUTO-REPLY TO USER
      await this.sendAutoReply(messageData.from, incident, incidentType);
      
      return incident;
    } catch (error) {
      this.logger.error(`Error processing WhatsApp message: ${error.message}`);
      this.logger.error(`Stack: ${error.stack}`);
      throw error;
    }
  }
}