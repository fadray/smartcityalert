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

  // Session storage (in production, use Redis or database)
  private sessions: Map<string, any> = new Map();

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

  // ==================== IMAGE HANDLING ====================

  /**
   * Download image from Twilio media URL
   */
  private async downloadImage(mediaUrl: string): Promise<string | null> {
    try {
      if (!mediaUrl) {
        this.logger.warn('No media URL provided');
        return null;
      }

      // Create uploads directory if it doesn't exist
      const uploadDir = './uploads';
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
        this.logger.log(`Created uploads directory: ${uploadDir}`);
      }

      // Generate unique filename
      const timestamp = Date.now();
      const random = Math.round(Math.random() * 1e9);
      const ext = '.jpg';
      const filename = `whatsapp-${timestamp}-${random}${ext}`;
      const filepath = path.join(uploadDir, filename);

      this.logger.log(`📸 Downloading image from: ${mediaUrl}`);
      this.logger.log(`💾 Saving to: ${filepath}`);

      // Get Twilio credentials
      const accountSid = this.configService.get('TWILIO_ACCOUNT_SID');
      const authToken = this.configService.get('TWILIO_AUTH_TOKEN');

      if (!accountSid || !authToken) {
        this.logger.error('Twilio credentials not configured');
        return null;
      }

      // Download image using axios with Twilio authentication
      const response = await axios.default({
        method: 'GET',
        url: mediaUrl,
        responseType: 'stream',
        auth: {
          username: accountSid,
          password: authToken,
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

  // ==================== SESSION MANAGEMENT ====================

  /**
   * Store incident session for a user
   */
  async storeIncidentSession(phoneNumber: string, data: any): Promise<void> {
    this.sessions.set(phoneNumber, {
      ...data,
      timestamp: Date.now(),
    });
    this.logger.log(`📝 Session stored for ${phoneNumber}: ${JSON.stringify(data)}`);
  }

  /**
   * Get incident session for a user
   */
  async getIncidentSession(phoneNumber: string): Promise<any> {
    const session = this.sessions.get(phoneNumber);
    // Clear old sessions (older than 15 minutes)
    if (session && Date.now() - session.timestamp > 15 * 60 * 1000) {
      this.sessions.delete(phoneNumber);
      this.logger.log(`⏰ Session expired for ${phoneNumber}`);
      return null;
    }
    return session || null;
  }

  /**
   * Clear incident session for a user
   */
  async clearIncidentSession(phoneNumber: string): Promise<void> {
    this.sessions.delete(phoneNumber);
    this.logger.log(`🗑️ Session cleared for ${phoneNumber}`);
  }

  // ==================== MESSAGING ====================

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
   * Send message (alias for sendWhatsAppMessage)
   */
  async sendMessage(to: string, message: string): Promise<any> {
    return await this.sendWhatsAppMessage(to, message);
  }

  // ==================== AUTO-REPLY ====================

  /**
   * Send auto-reply to user confirming incident receipt
   */
  private async sendAutoReply(to: string, incident: any, incidentType: string, hasImage: boolean = false): Promise<void> {
    try {
      const trackUrl = this.configService.get('WHATSAPP_TRACK_URL', 'https://smartcity-user.vercel.app/track');
      const emergencyPhone = this.configService.get('WHATSAPP_EMERGENCY_PHONE', '+234-800-SMART-CITY');
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

  // ==================== INCIDENT PROCESSING ====================

  /**
   * Process and create an incident from WhatsApp message
   */
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
      
  if (
  body.includes('fire') ||
  body.includes('burning') ||
  body.includes('burn') ||
  body.includes('smoke') ||
  body.includes('flames') ||
  body.includes('explosion') ||
  body.includes('blast') ||
  body.includes('gas leak') ||
  body.includes('gas explosion') ||
  body.includes('spark') ||
  body.includes('inferno')
) {
  incidentType = 'fire';
  severity = 5;

} else if (
  body.includes('medical') ||
  body.includes('injury') ||
  body.includes('injured') ||
  body.includes('ambulance') ||
  body.includes('collapsed') ||
  body.includes('collapse') ||
  body.includes('fainted') ||
  body.includes('faint') ||
  body.includes('unconscious') ||
  body.includes('bleeding') ||
  body.includes('blood') ||
  body.includes('heart attack') ||
  body.includes('stroke') ||
  body.includes('breathing') ||
  body.includes('breathe') ||
  body.includes('breathing') ||
  body.includes('die') ||
  body.includes('dead') ||
  body.includes('death') ||
  body.includes('sick') ||
  body.includes('critical') ||
  body.includes('emergency') ||
  body.includes('poison') ||
  body.includes('poisoning') ||
  body.includes('overdose') ||
  body.includes('pregnant') ||
  body.includes('labour') ||
  body.includes('labor') ||
  body.includes('delivery') ||
  body.includes('fell') ||
  body.includes('fall') ||
  body.includes('accident') ||
  body.includes('crash')
) {
  incidentType = 'medical';
  severity = 5;

} else if (
  body.includes('theft') ||
  body.includes('thief') ||
  body.includes('thieves') ||
  body.includes('robbery') ||
  body.includes('robber') ||
  body.includes('robbers') ||
  body.includes('armed') ||
  body.includes('armed robbery') ||
  body.includes('suspicious') ||
  body.includes('stealing') ||
  body.includes('stolen') ||
  body.includes('kidnap') ||
  body.includes('kidnapped') ||
  body.includes('abduction') ||
  body.includes('abducted') ||
  body.includes('gun') ||
  body.includes('gunshot') ||
  body.includes('shot') ||
  body.includes('shoot') ||
  body.includes('shooting') ||
  body.includes('knife') ||
  body.includes('machete') ||
  body.includes('cultist') ||
  body.includes('cult') ||
  body.includes('violence') ||
  body.includes('fight') ||
  body.includes('beating') ||
  body.includes('assault') ||
  body.includes('attack') ||
  body.includes('harassment') ||
  body.includes('rape') ||
  body.includes('molest') ||
  body.includes('terrorist') ||
  body.includes('bomb') ||
  body.includes('hostage') ||
  body.includes('break in') ||
  body.includes('burglary') ||
  body.includes('breaking')
) {
  incidentType = 'security';
  severity = 4;

} else if (
  body.includes('road') ||
  body.includes('pothole') ||
  body.includes('bridge') ||
  body.includes('street light') ||
  body.includes('traffic light') ||
  body.includes('light') ||
  body.includes('drainage') ||
  body.includes('gutter') ||
  body.includes('power') ||
  body.includes('electricity') ||
  body.includes('transformer') ||
  body.includes('pole') ||
  body.includes('cable') ||
  body.includes('wire') ||
  body.includes('fallen pole') ||
  body.includes('streetlight') ||
  body.includes('generator') ||
  body.includes('water pipe') ||
  body.includes('pipe burst') ||
  body.includes('manhole')
) {
  incidentType = 'infrastructure';
  severity = 2;

} else if (
  body.includes('traffic') ||
  body.includes('congestion') ||
  body.includes('jam') ||
  body.includes('gridlock') ||
  body.includes('blocked road') ||
  body.includes('road blocked') ||
  body.includes('vehicle breakdown') ||
  body.includes('truck') ||
  body.includes('trailer') ||
  body.includes('accident causing traffic')
) {
  incidentType = 'traffic';
  severity = 3;

} else if (
  body.includes('flood') ||
  body.includes('flooding') ||
  body.includes('water logging') ||
  body.includes('waterlogged') ||
  body.includes('drainage blocked') ||
  body.includes('overflow') ||
  body.includes('overflowing') ||
  body.includes('erosion') ||
  body.includes('pipe burst') ||
  body.includes('burst pipe') ||
  body.includes('tank overflow') ||
  body.includes('swamp') ||
  body.includes('heavy rain') ||
  body.includes('rainwater') ||
  body.includes('submerged')
) {
  incidentType = 'flooding';
  severity = 4;

} else if (
  body.includes('tree fell') ||
  body.includes('fallen tree') ||
  body.includes('tree blocking') ||
  body.includes('windstorm') ||
  body.includes('storm') ||
  body.includes('thunderstorm')
) {
  incidentType = 'environment';
  severity = 3;

} else if (
  body.includes('lost child') ||
  body.includes('missing child') ||
  body.includes('missing person') ||
  body.includes('person missing')
) {
  incidentType = 'missing_person';
  severity = 5;

} else if (
  body.includes('animal') ||
  body.includes('snake') ||
  body.includes('dog bite') ||
  body.includes('monkey') ||
  body.includes('cow') ||
  body.includes('goat') ||
  body.includes('wild animal')
) {
  incidentType = 'medical';
  severity = 3;

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

  /**
   * Process complete report with all steps (type, title, location, phone)
   */
  
  async processCompleteReport(data: {
    from: string;
    incidentType: string;
    title: string;
    location: string;
    phoneNumber?: string;
    mediaUrl?: string;
    mediaType?: string;
    profileName?: string;
  }): Promise<any> {
    const startTime = Date.now();
    this.logger.log(`📋 Processing complete report from ${data.from}`);
    
    // ✅ Find or create user (fast)
    let user = await this.usersService.findByPhone(data.from);
    if (!user) {
      user = await this.usersService.createFromWhatsApp({
        phone: data.from,
        name: data.profileName || `WhatsApp User ${data.from.slice(-4)}`,
        role: 'resident',
      });
    }
    
    // ✅ Download image if present (this is the slowest part)
    let imagePath: string | null = null;
    let hasImage = false;
    let imageUrls: string[] = [];
    
    if (data.mediaUrl) {
      this.logger.log(`📸 Downloading image from: ${data.mediaUrl}`);
      imagePath = await this.downloadImage(data.mediaUrl);
      if (imagePath) {
        hasImage = true;
        imageUrls = [imagePath];
        this.logger.log(`✅ Image saved: ${imagePath}`);
      }
    }
    
    // ✅ Get department (fast)
    let department: Department | null = null;
    const departmentMap: Record<string, string> = {
      fire: 'Fire Service',
      medical: 'Health Services', 
      security: 'Security',
      maintenance: 'Maintenance',
      traffic: 'Traffic Management',
      flooding: 'Drainage Services',
      general: 'Fire Service',
    };
    
    const departmentName = departmentMap[data.incidentType];
    if (departmentName) {
      department = await this.departmentsService.findByName(departmentName);
    }
    
    // ✅ Create incident (fast)
    const severityLevel = {
      fire: 5,
      medical: 5,
      security: 4,
      maintenance: 2,
      traffic: 3,
      flooding: 4,
      general: 1,
    }[data.incidentType] || 2;
    
    this.logger.log(`📸 Creating incident with ${imageUrls.length} image(s)`);
    
    const incident = await this.incidentsService.create(
      {
        title: `${data.incidentType.toUpperCase()}: ${data.title}`,
        description: `${data.title}\n\n📍 Location: ${data.location}\n📞 Phone: ${data.phoneNumber || 'Not provided'}`,
        incident_type: data.incidentType,
        department_id: department?.id || null,
        severity_level: severityLevel,
        latitude: 0,
        longitude: 0,
        location: data.location,
      },
      user.id,
      imageUrls
    );
    
    // ✅ Save WhatsApp message (fast)
    const whatsappMsg = this.whatsappRepo.create({
      from_number: data.from,
      message_body: `${data.title}\n\n📍 Location: ${data.location}`,
      media_url: data.mediaUrl,
      media_type: data.mediaType,
      status: 'processed',
      detected_incident_type: data.incidentType,
      extracted_data: {
        type: data.incidentType,
        title: data.title,
        location: data.location,
        phone: data.phoneNumber,
        hasImage: hasImage,
        imagePath: imagePath,
      },
      incident_id: incident.id,
      processed_by_id: user.id,
      twilio_metadata: {
        profileName: data.profileName,
        timestamp: new Date(),
      },
    });
    
    await this.whatsappRepo.save(whatsappMsg);
    
    // ✅ Send auto-reply (fast)
    await this.sendAutoReply(data.from, incident, data.incidentType, hasImage);
    
    const elapsedTime = Date.now() - startTime;
    this.logger.log(`✅ Complete report processed: ${incident.id} in ${elapsedTime}ms with ${imageUrls.length} image(s)`);
    
    return incident;
  }

  // ==================== PENDING IMAGES ====================

  /**
   * Store pending image (photo without text)
   */
  async storePendingImage(data: {
    from: string;
    mediaUrl: string;
    mediaType?: string;
    profileName?: string;
  }): Promise<any> {
    const imagePath = await this.downloadImage(data.mediaUrl);
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

  /**
   * Process pending image with text
   */
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

  // ==================== STATUS CHECK ====================

  /**
   * Handle status check for an incident
   */
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
