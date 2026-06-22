import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { WhatsAppMessage } from './whatsapp-message.entity';
import { IncidentsService } from '../incidents/incidents.service';
import { UsersService } from '../users/users.service';
import { DepartmentsService } from '../departments/departments.service';
import { Department } from '../departments/department.entity';
import { PendingImage } from './pending-image.entity';
import * as axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private twilioClient: any;
  private readonly baseUrl: string;

  constructor(
    @InjectRepository(WhatsAppMessage)
    private whatsappRepo: Repository<WhatsAppMessage>,
    @InjectRepository(PendingImage)
    private pendingImageRepo: Repository<PendingImage>,
    private incidentsService: IncidentsService,
    private usersService: UsersService,
    private departmentsService: DepartmentsService,
    private configService: ConfigService,
  ) {
    this.logger.log('WhatsApp Service initialized');
    
    this.baseUrl = this.configService.get('APP_URL') || 'http://localhost:3001';
    
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
   * Download image from Twilio media URL
   */
  private async downloadImage(mediaUrl: string): Promise<string | null> {
    try {
      if (!mediaUrl) return null;

      // Create uploads directory if it doesn't exist
      const uploadDir = './uploads';
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // Generate unique filename
      const timestamp = Date.now();
      const random = Math.round(Math.random() * 1e9);
      const ext = '.jpg';
      const filename = `whatsapp-${timestamp}-${random}${ext}`;
      const filepath = path.join(uploadDir, filename);

      this.logger.log(`Downloading image from: ${mediaUrl}`);
      this.logger.log(`Saving to: ${filepath}`);

      // Get Twilio credentials
      const accountSid = this.configService.get('TWILIO_ACCOUNT_SID');
      const authToken = this.configService.get('TWILIO_AUTH_TOKEN');

      // Download image using axios with Twilio authentication
      const response = await axios.default({
        method: 'GET',
        url: mediaUrl,
        responseType: 'stream',
        auth: {
          username: accountSid || '',
          password: authToken || '',
        },
        timeout: 30000,
      });

      // Save the image
      const writer = fs.createWriteStream(filepath);
      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', () => {
          this.logger.log(`✅ Image downloaded successfully: ${filename}`);
          resolve(`/uploads/${filename}`);
        });
        writer.on('error', (err) => {
          this.logger.error(`❌ Failed to save image: ${err.message}`);
          reject(null);
        });
        response.data.on('error', (err) => {
          this.logger.error(`❌ Download stream error: ${err.message}`);
          reject(null);
        });
      });
    } catch (error) {
      this.logger.error(`❌ Failed to download image: ${error.message}`);
      if (error.response) {
        this.logger.error(`Status: ${error.response.status}`);
        this.logger.error(`Data: ${JSON.stringify(error.response.data)}`);
      }
      return null;
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

      const toNumber = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
      const fromNumber = this.configService.get('TWILIO_WHATSAPP_NUMBER', 'whatsapp:+14155238886');
      const fromNumberFormatted = fromNumber.startsWith('whatsapp:') ? fromNumber : `whatsapp:${fromNumber}`;

      this.logger.log(`Sending WhatsApp message from ${fromNumberFormatted} to ${toNumber}`);

      const response = await this.twilioClient.messages.create({
        body: message,
        from: fromNumberFormatted,
        to: toNumber,
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
  private async sendAutoReply(to: string, incident: any, incidentType: string, hasImage: boolean = false): Promise<void> {
    try {
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

      let message = 
        `✅ *${appName} - Incident Report Received!*\n\n` +
        `${emoji} *Type:* ${typeName}\n` +
        `🆔 *Incident ID:* \`${incident.id.slice(0, 8)}\`\n` +
        `📊 *Severity:* ${severityEmoji} Level ${severityLevel}\n` +
        `📅 *Time:* ${new Date().toLocaleString()}\n`;

      if (hasImage) {
        message += `📸 *Image:* Received ✅\n`;
      }

      message +=
        `\nYour report has been received and will undergo swift processing.\n` +
        `A responder will be assigned shortly.\n\n` +
        `📱 Track status: ${trackUrl}/${incident.id}\n` +
        `📞 For emergencies, call: ${emergencyPhone}\n\n` +
        `_Reply HELP for available commands_`;

      await this.sendWhatsAppMessage(to, message);
      
      this.logger.log(`Auto-reply sent to ${to} for incident ${incident.id}`);
    } catch (error) {
      this.logger.error(`Failed to send auto-reply to ${to}: ${error.message}`);
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
      
      // Download image if present
      let imagePath: string | null = null;
      let hasImage = false;
      
      if (messageData.mediaUrl) {
        this.logger.log(`📸 Downloading image from: ${messageData.mediaUrl}`);
        imagePath = await this.downloadImage(messageData.mediaUrl);
        if (imagePath) {
          hasImage = true;
          this.logger.log(`✅ Image saved: ${imagePath}`);
        } else {
          this.logger.warn('❌ Failed to download image');
        }
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
      
      // Create incident with downloaded image
      const imageUrls = imagePath ? [imagePath] : [];
      
      const incident = await this.incidentsService.create(
        {
          title: `${incidentType.toUpperCase()} Report via WhatsApp`,
          description: messageData.body,
          incident_type: incidentType,
          department_id: department?.id || null,
          severity_level: severity,
          latitude: 0,
          longitude: 0,
          location: messageData.body.substring(0, 100),
        },
        user.id,
        imageUrls
      );
      
      this.logger.log(`Created incident: ${incident.id} with ${imageUrls.length} images`);
      
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
          profileName: messageData.profileName,
          hasImage: hasImage,
          imagePath: imagePath,
        },
        incident_id: incident.id,
        processed_by_id: user.id,
        twilio_metadata: {
          profileName: messageData.profileName,
          timestamp: new Date(),
          mediaUrl: messageData.mediaUrl,
          mediaType: messageData.mediaType,
        },
      });
      
      await this.whatsappRepo.save(whatsappMsg);
      this.logger.log(`Saved WhatsApp message for incident: ${incident.id}`);
      
      // Send auto-reply with image confirmation
      await this.sendAutoReply(messageData.from, incident, incidentType, hasImage);
      
      return incident;
    } catch (error) {
      this.logger.error(`Error processing WhatsApp message: ${error.message}`);
      this.logger.error(`Stack: ${error.stack}`);
      throw error;
    }
  }

  // Store pending image (photo without text)
  async storePendingImage(data: {
    from: string;
    mediaUrl: string;
    mediaType?: string;
    profileName?: string;
  }): Promise<any> {
    const imagePath = await this.downloadImage(data.mediaUrl);
    // Create with proper property names matching the entity
    const pendingImage = new PendingImage();
    pendingImage.from_number = data.from;
    pendingImage.media_url = data.mediaUrl;
    pendingImage.media_type = data.mediaType || '';
    pendingImage.profile_name = data.profileName || '';
    pendingImage.image_path = imagePath || '';
    pendingImage.processed = false;
    pendingImage.expired = false;
    
    return await this.pendingImageRepo.save(pendingImage);
  }

  // Process pending image with text
  async processPendingImage(imageId: string, text: string): Promise<any> {
    const pendingImage = await this.pendingImageRepo.findOne({
      where: {
        id: imageId,
        processed: false,
        expired: false,
      },
    });

    if (!pendingImage) {
      throw new Error('Image not found or already processed');
    }

    const incident = await this.processAndCreateIncident({
      from: pendingImage.from_number,
      body: text,
      mediaUrl: pendingImage.media_url,
      mediaType: pendingImage.media_type || undefined,
      profileName: pendingImage.profile_name || undefined,
    });

    pendingImage.processed = true;
    await this.pendingImageRepo.save(pendingImage);

    return incident;
  }

  async sendMessage(to: string, message: string): Promise<any> {
    return await this.sendWhatsAppMessage(to, message);
  }

  async handleStatusCheck(phoneNumber: string, incidentId: string): Promise<any> {
    const incident = await this.incidentsService.findOne(incidentId);
    if (!incident) {
      await this.sendWhatsAppMessage(phoneNumber, `❌ Incident ${incidentId} not found`);
      return null;
    }
    const message = `📋 *Incident Status*\n\n🆔 ID: ${incident.id}\n📌 Status: ${incident.status}\n⚠️ Severity: ${incident.severity_level}\n\nThank you for using SmartCityAlert.`;
    await this.sendWhatsAppMessage(phoneNumber, message);
    return incident;
  }
}
