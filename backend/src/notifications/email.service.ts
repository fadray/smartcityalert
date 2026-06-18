import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailService.name);
  private isConfigured: boolean = false;

  constructor(private configService: ConfigService) {
    this.setupTransporter();
  }

  private async setupTransporter() {
    const smtpHost = this.configService.get('SMTP_HOST');
    const smtpUser = this.configService.get('SMTP_USER');
    const smtpPass = this.configService.get('SMTP_PASS');
    
    if (!smtpHost || !smtpUser || !smtpPass) {
      this.logger.warn('Email service not configured');
      return;
    }

    const port = parseInt(this.configService.get('SMTP_PORT', '465'));
    const isSecure = this.configService.get('SMTP_SECURE') === 'true';
    
    const config: any = {
      host: smtpHost,
      port: port,
      secure: isSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    };

    // For port 465, we need secure: true
    if (port === 465) {
      config.secure = true;
    }

    this.transporter = nodemailer.createTransport(config);
    
    try {
      await this.transporter.verify();
      this.isConfigured = true;
      this.logger.log(`✅ Email service configured with ${smtpHost}:${port} (SSL: ${isSecure})`);
    } catch (error) {
      this.logger.error(`❌ Email verification failed: ${error.message}`);
      this.isConfigured = false;
    }
  }

  async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    if (!this.isConfigured) {
      this.logger.warn(`Email not sent: ${subject}`);
      return false;
    }

    try {
      const info = await this.transporter.sendMail({
        from: `"SmartCityAlert" <${this.configService.get('SMTP_USER')}>`,
        to: to,
        subject: subject,
        html: html,
      });
      this.logger.log(`✅ Email sent to ${to}: ${subject}`);
      return true;
    } catch (error) {
      this.logger.error(`❌ Failed to send email: ${error.message}`);
      return false;
    }
  }

  async sendNewIncidentNotification(to: string, toName: string, incident: any): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1e3a8a, #3b82f6); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">🚨 New Incident Reported</h1>
        </div>
        <div style="padding: 20px;">
          <h2>Hello ${toName},</h2>
          <p>A new incident has been reported:</p>
          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px;">
            <p><strong>Title:</strong> ${incident.title}</p>
            <p><strong>Type:</strong> ${incident.incident_type}</p>
            <p><strong>Severity:</strong> Level ${incident.severity_level}</p>
            <p><strong>Location:</strong> ${incident.location || 'Not specified'}</p>
          </div>
          <div style="margin-top: 20px;">
            <a href="${this.configService.get('WEBAPP_URL', 'http://localhost:3002')}/dashboard?tab=incidents" style="background: #1e3a8a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Incident</a>
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
        <div style="padding: 20px;">
          <h2>Hello ${toName},</h2>
          <p>An incident has been assigned to you by ${assignedBy}:</p>
          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px;">
            <p><strong>Title:</strong> ${incident.title}</p>
            <p><strong>Type:</strong> ${incident.incident_type}</p>
            <p><strong>Severity:</strong> Level ${incident.severity_level}</p>
          </div>
          <div style="margin-top: 20px;">
            <a href="${this.configService.get('WEBAPP_URL', 'http://localhost:3002')}/dashboard?tab=incidents" style="background: #1e3a8a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View & Respond</a>
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
          <h1 style="color: white; margin: 0;">⚠️ Incident Escalated to Level ${level}</h1>
        </div>
        <div style="padding: 20px;">
          <h2>Hello ${toName},</h2>
          <p>An incident has been escalated to Level ${level}:</p>
          <div style="background: #fef2f2; padding: 15px; border-radius: 8px;">
            <p><strong>Title:</strong> ${incident.title}</p>
            <p><strong>Type:</strong> ${incident.incident_type}</p>
            <p><strong>Severity:</strong> Level ${incident.severity_level}</p>
          </div>
          <div style="margin-top: 20px;">
            <a href="${this.configService.get('WEBAPP_URL', 'http://localhost:3002')}/dashboard?tab=incidents" style="background: #dc2626; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Take Action</a>
          </div>
        </div>
      </div>
    `;
    await this.sendEmail(to, `⚠️ ESCALATED: ${incident.title} (Level ${level})`, html);
  }

  async sendApprovalNotification(to: string, toName: string, incident: any, action: string): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">✅ Incident ${action}</h1>
        </div>
        <div style="padding: 20px;">
          <h2>Hello ${toName},</h2>
          <p>An incident has been ${action.toLowerCase()}:</p>
          <div style="background: #f0fdf4; padding: 15px; border-radius: 8px;">
            <p><strong>Title:</strong> ${incident.title}</p>
            <p><strong>Type:</strong> ${incident.incident_type}</p>
          </div>
          <div style="margin-top: 20px;">
            <a href="${this.configService.get('WEBAPP_URL', 'http://localhost:3002')}/dashboard?tab=incidents" style="background: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Details</a>
          </div>
        </div>
      </div>
    `;
    await this.sendEmail(to, `✅ Incident ${action}: ${incident.title}`, html);
  }
}
