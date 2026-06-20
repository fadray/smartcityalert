import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { WhatsAppService } from './whatsapp.service';

@Controller('whatsapp')
export class WhatsAppController {
  constructor(private whatsappService: WhatsAppService) {}

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleIncomingWebhook(@Body() payload: any) {
    console.log('WhatsApp webhook received:', JSON.stringify(payload, null, 2));
    
    try {
      if (payload.From) {
        const fromNumber = payload.From.replace('whatsapp:', '');
        const messageBody = payload.Body || '';
        const mediaUrl = payload.MediaUrl0 || null;
        const mediaType = payload.MediaContentType0 || null;
        const profileName = payload.ProfileName || null;
        const numMedia = parseInt(payload.NumMedia || '0');
        
        // ✅ Check if this is a media-only message (no text)
        const isMediaOnly = numMedia > 0 && !messageBody.trim();
        
        // ✅ Check for HELP command
        if (messageBody.toLowerCase() === 'help') {
          const helpMessage = 
            `📱 *SmartCityAlert WhatsApp Commands*\n\n` +
            `Simply describe the issue. Examples:\n` +
            `• "Fire at Campground Zone B" (with or without photo)\n` +
            `• "Medical emergency near Gate A" (with or without photo)\n` +
            `• "Theft reported at East Gate" (with or without photo)\n\n` +
            `📸 You can send photos with or without text!\n\n` +
            `Other commands:\n` +
            `• \`STATUS <incident_id>\` - Check incident status\n` +
            `• \`HELP\` - Show this message\n\n` +
            `📌 Tip: Send a photo with a caption for fastest response!`;
          
          await this.whatsappService.sendMessage(fromNumber, helpMessage);
          return { status: 'success', action: 'help' };
        }
        
        // ✅ Check for STATUS command
        if (messageBody.toLowerCase().startsWith('status') || 
            messageBody.toLowerCase().startsWith('track')) {
          const parts = messageBody.split(' ');
          const incidentId = parts[1];
          if (incidentId) {
            await this.whatsappService.handleStatusCheck(fromNumber, incidentId);
            return { status: 'success', action: 'status_check' };
          }
        }
        
        // ✅ Handle media-only messages (photo without text)
        if (isMediaOnly && mediaUrl) {
          console.log('📸 Media-only message received (photo without text)');
          
          // Store the image temporarily and wait for text
          const storedImage = await this.whatsappService.storePendingImage({
            from: fromNumber,
            mediaUrl: mediaUrl,
            mediaType: mediaType,
            profileName: profileName,
          });
          
          return { 
            status: 'pending', 
            message: 'Image received. Please send a description of the incident.',
            imageId: storedImage.id,
          };
        }
        
        // ✅ Handle normal messages (with text, with or without photo)
        if (messageBody) {
          const incident = await this.whatsappService.processAndCreateIncident({
            from: fromNumber,
            body: messageBody,
            mediaUrl: mediaUrl,
            mediaType: mediaType,
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
