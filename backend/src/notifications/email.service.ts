import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailService.name);

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST', 'smtp.gmail.com'),
      port: parseInt(this.configService.get('SMTP_PORT', '587')),
      secure: false,
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      },
    });
  }

  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: `"SmartCityAlert" <${this.configService.get('SMTP_USER')}>`,
        to: to,
        subject: subject,
        html: html,
      });
      this.logger.log(`Email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}:`, error);
    }
  }

  async sendNewIncidentNotification(to: string, toName: string, incident: any): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1e3a8a, #3b82f6); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">🚨 New Incident Reported</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
          <h2>Hello ${toName},</h2>
          <p>A new incident has been reported in your department:</p>
          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Title:</strong> ${incident.title}</p>
            <p><strong>Type:</strong> ${incident.incident_type}</p>
            <p><strong>Severity:</strong> Level ${incident.severity_level}</p>
            <p><strong>Location:</strong> ${incident.location || 'Not specified'}</p>
            <p><strong>Description:</strong> ${incident.description}</p>
          </div>
          <div style="margin-top: 30px; text-align: center;">
            <a href="${this.configService.get('WEBAPP_URL', 'http://localhost:3002')}/incidents/${incident.id}" style="background: #1e3a8a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px;">View Incident</a>
          </div>
        </div>
      </div>
    `;
    await this.sendEmail(to, `🚨 New Incident: ${incident.title}`, html);
  }

  async sendAssignmentNotification(to: string, toName: string, incident: any, assignedBy: string): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1e3a8a, #3b82f6); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">📋 Incident Assigned to You</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
          <h2>Hello ${toName},</h2>
          <p>An incident has been assigned to you by ${assignedBy}:</p>
          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Title:</strong> ${incident.title}</p>
            <p><strong>Type:</strong> ${incident.incident_type}</p>
            <p><strong>Severity:</strong> Level ${incident.severity_level}</p>
            <p><strong>Location:</strong> ${incident.location || 'Not specified'}</p>
          </div>
          <div style="margin-top: 30px; text-align: center;">
            <a href="${this.configService.get('WEBAPP_URL', 'http://localhost:3002')}/incidents/${incident.id}" style="background: #1e3a8a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px;">View & Respond</a>
          </div>
        </div>
      </div>
    `;
    await this.sendEmail(to, `📋 Incident Assigned: ${incident.title}`, html);
  }

  async sendEscalationNotification(to: string, toName: string, incident: any, level: number): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #dc2626, #ef4444); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">⚠️ Incident Escalated</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
          <h2>Hello ${toName},</h2>
          <p>An incident has been escalated to Level ${level} and requires your attention:</p>
          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Title:</strong> ${incident.title}</p>
            <p><strong>Type:</strong> ${incident.incident_type}</p>
            <p><strong>Severity:</strong> Level ${incident.severity_level}</p>
            <p><strong>Current Status:</strong> ${incident.status}</p>
          </div>
          <div style="margin-top: 30px; text-align: center;">
            <a href="${this.configService.get('WEBAPP_URL', 'http://localhost:3002')}/incidents/${incident.id}" style="background: #dc2626; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px;">View & Take Action</a>
          </div>
        </div>
      </div>
    `;
    await this.sendEmail(to, `⚠️ Escalated: ${incident.title} (Level ${level})`, html);
  }

  async sendApprovalNotification(to: string, toName: string, incident: any, action: string): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">✅ Incident ${action}</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
          <h2>Hello ${toName},</h2>
          <p>An incident has been ${action.toLowerCase()}:</p>
          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Title:</strong> ${incident.title}</p>
            <p><strong>Type:</strong> ${incident.incident_type}</p>
            <p><strong>Resolution:</strong> ${incident.resolution_notes || 'N/A'}</p>
          </div>
          <div style="margin-top: 30px; text-align: center;">
            <a href="${this.configService.get('WEBAPP_URL', 'http://localhost:3002')}/incidents/${incident.id}" style="background: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px;">View Details</a>
          </div>
        </div>
      </div>
    `;
    await this.sendEmail(to, `✅ Incident ${action}: ${incident.title}`, html);
  }
}
