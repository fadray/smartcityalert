import { Controller, Post, Body, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { WhatsAppService } from './whatsapp.service';
import { ConfigService } from '@nestjs/config';

@Controller('whatsapp')
export class WhatsAppController {
  private readonly logger = new Logger(WhatsAppController.name);

  constructor(private whatsappService: WhatsAppService) {}

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleIncomingWebhook(@Body() payload: any) {
    this.logger.log('WhatsApp webhook received');
    
    try {
      if (payload.From) {
        const fromNumber = payload.From.replace('whatsapp:', '');
        const messageBody = payload.Body || '';
        const mediaUrl = payload.MediaUrl0 || null;
        const mediaType = payload.MediaContentType0 || null;
        const profileName = payload.ProfileName || null;
        const numMedia = parseInt(payload.NumMedia || '0');
        
        const isMediaOnly = numMedia > 0 && !messageBody.trim();
        
        // ✅ Check for COMMANDS
        if (messageBody.toLowerCase() === 'commands' || messageBody.toLowerCase() === 'command') {
          const commandsMessage = 
            `📱 *SmartCityAlert Commands*\n\n` +
            `• *HELP* - Show incident types\n` +
            `• *COMMANDS* - Show this menu\n` +
            `• *STATUS <ID>* - Check incident status\n\n` +
            `📸 You can send photos with your report!`;
          
          await this.whatsappService.sendMessage(fromNumber, commandsMessage);
          return { status: 'success', action: 'commands' };
        }
        
        // ✅ Check for HELP - Show clickable incident types
        if (messageBody.toLowerCase() === 'help') {
          const helpMessage = 
            `📋 *SmartCityAlert - Select Incident Type*\n\n` +
            `Tap on one of the options below:\n\n` +
            `🔥 *FIRE* - Fire outbreaks, burning, smoke\n` +
            `🚑 *MEDICAL* - Injuries, accidents, ambulance\n` +
            `👮 *SECURITY* - Theft, robbery, suspicious\n` +
            `🔧 *MAINTENANCE* - Roads, lights, drainage\n` +
            `🚦 *TRAFFIC* - Congestion, accidents\n` +
            `🌊 *FLOODING* - Water logging, blocked drains\n` +
            `📋 *GENERAL* - Other incidents\n\n` +
            `_Reply with the type (e.g., "FIRE") to start reporting_`;
          
          await this.whatsappService.sendMessage(fromNumber, helpMessage);
          return { status: 'success', action: 'help' };
        }
        
        // ✅ Check for incident type selection
        const incidentTypes = ['fire', 'medical', 'security', 'maintenance', 'traffic', 'flooding', 'general'];
        const detectedType = incidentTypes.find(type => 
          messageBody.toLowerCase() === type || 
          messageBody.toLowerCase() === type + ' report'
        );
        
        if (detectedType) {
          const titlePrompt = 
            `📍 *${detectedType.toUpperCase()} Report - Step 1/3*\n\n` +
            `Please describe the incident briefly:\n` +
            `• What happened?\n` +
            `• How serious is it?\n\n` +
            `📸 You can also send a photo with your description.\n\n` +
            `Example: "Fire at Campground Zone B, smoke visible everywhere"`;
          
          await this.whatsappService.storeIncidentSession(fromNumber, {
            step: 'awaiting_title',
            incidentType: detectedType,
            timestamp: Date.now(),
          });
          
          await this.whatsappService.sendMessage(fromNumber, titlePrompt);
          return { status: 'success', action: 'type_selected', type: detectedType };
        }
        
        // ✅ Get the current session
        const session = await this.whatsappService.getIncidentSession(fromNumber);
        
        // ✅ IMPORTANT: If there's a media URL and the user is in any step, store it in session
        if (mediaUrl && session) {
          this.logger.log(`📸 Storing media URL in session for ${fromNumber}: ${mediaUrl}`);
          session.mediaUrl = mediaUrl;
          session.mediaType = mediaType;
          await this.whatsappService.storeIncidentSession(fromNumber, session);
          
          // If this is a media-only message, acknowledge it
          if (isMediaOnly) {
            await this.whatsappService.sendMessage(
              fromNumber, 
              `📸 *Image received!*\n\nPlease continue with your report.`
            );
            return { status: 'pending', message: 'Image stored, waiting for text' };
          }
        }
        
        if (session && session.step === 'awaiting_title') {
          // ✅ Step 2: Incident Title received
          if (messageBody) {
            session.step = 'awaiting_location';
            session.title = messageBody;
            await this.whatsappService.storeIncidentSession(fromNumber, session);
            
            const locationPrompt = 
              `📍 *${session.incidentType.toUpperCase()} Report - Step 2/3*\n\n` +
              `Please provide the location and your phone number:\n` +
              `• House/Flat Number\n` +
              `• Street Name\n` +
              `• Estate/Area\n` +
              `• Landmark (optional)\n` +
              `• Phone Number (for updates)\n\n` +
              `Example: "House 12, Covenant Avenue, Campground, near the main gate, Phone: +2348123456789"`;
            
            await this.whatsappService.sendMessage(fromNumber, locationPrompt);
            return { status: 'success', step: 'awaiting_location' };
          }
        }
        
        // ✅ Check if awaiting location
        if (session && session.step === 'awaiting_location') {
          // ✅ Step 3: Location and phone received - Create incident
          if (messageBody) {
            // Extract phone number
            const phoneMatch = messageBody.match(/(?:phone|tel|call|contact)?:?\s*([+0-9]{10,})/i);
            const phoneNumber = phoneMatch ? phoneMatch[1] : null;
            
            let locationText = messageBody;
            if (phoneMatch) {
              locationText = messageBody.replace(phoneMatch[0], '').trim();
            }
            
            // ✅ Get the media URL from the session (it was stored when the image was received)
            const finalMediaUrl = session.mediaUrl || mediaUrl || null;
            const finalMediaType = session.mediaType || mediaType || null;
            
            this.logger.log(`📸 Final media URL: ${finalMediaUrl || 'NONE'}`);
            this.logger.log(`📸 Session media URL: ${session.mediaUrl || 'NONE'}`);
            
            const incident = await this.whatsappService.processCompleteReport({
              from: fromNumber,
              incidentType: session.incidentType,
              title: session.title,
              location: locationText || messageBody,
              phoneNumber: phoneNumber || null,
              mediaUrl: finalMediaUrl,
              mediaType: finalMediaType,
              profileName: profileName,
            });
            
            await this.whatsappService.clearIncidentSession(fromNumber);
            
            const confirmMessage = 
              `✅ *Incident Report Complete!*\n\n` +
              `🆔 *ID:* ${incident.id.slice(0, 8)}\n` +
              `📌 *Type:* ${session.incidentType.toUpperCase()}\n` +
              `📍 *Location:* ${locationText}\n` +
              `📸 *Photo:* ${finalMediaUrl ? '✅ Received' : '❌ No photo'}\n\n` +
              `A responder will be assigned shortly.\n` +
              `Track status: https://smartalert-user.vercel.app/track/${incident.id}`;
            
            await this.whatsappService.sendMessage(fromNumber, confirmMessage);
            
            return { 
              status: 'success', 
              incidentId: incident.id,
              message: 'Incident created successfully'
            };
          }
        }
        
        // ✅ Handle media-only messages (photo without text) - no session yet
        if (isMediaOnly && mediaUrl) {
          // Check if there's a session, if not, create one
          let existingSession = await this.whatsappService.getIncidentSession(fromNumber);
          if (!existingSession) {
            // Create a new session with just the image
            await this.whatsappService.storeIncidentSession(fromNumber, {
              step: 'awaiting_title',
              mediaUrl: mediaUrl,
              mediaType: mediaType,
              timestamp: Date.now(),
            });
            await this.whatsappService.sendMessage(
              fromNumber, 
              `📸 *Image received!*\n\nPlease type HELP to select an incident type, or send a description.`
            );
          } else {
            // Update existing session with image
            existingSession.mediaUrl = mediaUrl;
            existingSession.mediaType = mediaType;
            await this.whatsappService.storeIncidentSession(fromNumber, existingSession);
            await this.whatsappService.sendMessage(
              fromNumber, 
              `📸 *Image received and saved!*\n\nPlease continue with your report.`
            );
          }
          return { status: 'pending', message: 'Image stored' };
        }
        
        // ✅ Handle STATUS command
        if (messageBody.toLowerCase().startsWith('status') || 
            messageBody.toLowerCase().startsWith('track')) {
          const parts = messageBody.split(' ');
          const incidentId = parts[1];
          if (incidentId) {
            await this.whatsappService.handleStatusCheck(fromNumber, incidentId);
            return { status: 'success', action: 'status_check' };
          }
        }
        
        // ✅ Handle normal messages (with text and optional photo)
        if (messageBody) {
          const incident = await this.whatsappService.processAndCreateIncident({
            from: fromNumber,
            body: messageBody,
            mediaUrl: mediaUrl || null,
            mediaType: mediaType || null,
            profileName: profileName,
          });
          
          return { 
            status: 'success', 
            incidentId: incident.id,
            message: 'Incident created successfully'
          };
        }
        
        return { status: 'ok', message: 'No incident data' };
      }
      
      return { status: 'ok', message: 'Webhook received' };
    } catch (error) {
      console.error('Error processing webhook:', error);
      return { 
        status: 'error', 
        message: error.message 
      };
    }
  }
}
