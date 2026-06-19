import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { WhatsAppService } from './whatsapp.service';

@Controller('whatsapp')
export class WhatsAppController {
  constructor(private whatsappService: WhatsAppService) {}

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Body() payload: any) {
    console.log('WhatsApp webhook received:', JSON.stringify(payload, null, 2));
    
    try {
      if (payload.Body && payload.From) {
        const fromNumber = payload.From.replace('whatsapp:', '');
        
        // Process the incident
        const incident = await this.whatsappService.processAndCreateIncident({
          from: fromNumber,
          body: payload.Body,
          mediaUrl: payload.MediaUrl0,
          mediaType: payload.MediaContentType0,
          profileName: payload.ProfileName,
        });
        
        return { 
          status: 'success', 
          incidentId: incident.id,
          message: 'Incident created successfully'
        };
      }
      
      return { status: 'ok', message: 'No incident data' };
    } catch (error) {
      console.error('Error processing webhook:', error);
      // Still return 200 to Twilio to prevent retries
      return { 
        status: 'error', 
        message: error.message 
      };
    }
  }
}