import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    // Configure email transporter
    // For Gmail, you'll need to use an App Password
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST', 'smtp.gmail.com'),
      port: parseInt(this.configService.get('SMTP_PORT', '465')),
      secure: false,
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      },
    });
  }

  async sendPasswordResetEmail(to: string, name: string, tempPassword: string): Promise<void> {
    const mailOptions = {
      from: `"SmartCityAlert" <${this.configService.get('SMTP_USER')}>`,
      to: to,
      subject: 'Password Reset - SmartCityAlert',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #1e3a8a, #3b82f6); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">SmartCityAlert</h1>
          </div>
          <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
            <h2>Hello ${name},</h2>
            <p>Your password has been reset. Please use the following temporary password to log in:</p>
            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <code style="font-size: 24px; font-weight: bold; letter-spacing: 2px;">${tempPassword}</code>
            </div>
            <p>For security reasons, please change your password after logging in.</p>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 12px;">If you didn't request this password reset, please contact your system administrator immediately.</p>
              <p style="color: #6b7280; font-size: 12px;">This is an automated message, please do not reply.</p>
            </div>
          </div>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Password reset email sent to ${to}`);
    } catch (error) {
      console.error('Failed to send email:', error);
      throw new Error('Failed to send email');
    }
  }

  async sendWelcomeEmail(to: string, name: string, password: string): Promise<void> {
    const mailOptions = {
      from: `"SmartCityAlert" <${this.configService.get('SMTP_USER')}>`,
      to: to,
      subject: 'Welcome to SmartCityAlert',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #1e3a8a, #3b82f6); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">SmartCityAlert</h1>
          </div>
          <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
            <h2>Welcome ${name}!</h2>
            <p>Your account has been created successfully. Here are your login credentials:</p>
            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Login URL:</strong> ${this.configService.get('WEBAPP_URL', 'http://localhost:3002')}</p>
              <p><strong>Username/Phone:</strong> ${to}</p>
              <p><strong>Temporary Password:</strong> <code style="background: #fff; padding: 2px 6px; border-radius: 4px;">${password}</code></p>
            </div>
            <p>Please log in and change your password immediately.</p>
            <div style="margin-top: 30px;">
              <a href="${this.configService.get('WEBAPP_URL', 'http://localhost:3002')}" style="background: #1e3a8a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px;">Login to Dashboard</a>
            </div>
          </div>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Welcome email sent to ${to}`);
    } catch (error) {
      console.error('Failed to send email:', error);
    }
  }
}
