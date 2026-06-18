const nodemailer = require('nodemailer');
const fs = require('fs');
require('dotenv').config();

async function testEmail() {
  console.log('\n📧 Testing Gmail Configuration...\n');
  
  const config = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  };
  
  console.log('Configuration:');
  console.log(`  Host: ${config.host}`);
  console.log(`  Port: ${config.port}`);
  console.log(`  User: ${config.auth.user}`);
  console.log(`  Password: ${config.auth.pass ? '***' + config.auth.pass.slice(-4) : 'NOT SET'}`);
  console.log('');
  
  if (!config.auth.user || !config.auth.pass) {
    console.error('❌ Missing SMTP_USER or SMTP_PASS in .env file');
    process.exit(1);
  }
  
  const transporter = nodemailer.createTransport(config);
  
  try {
    // Verify connection
    console.log('🔌 Testing connection...');
    await transporter.verify();
    console.log('✅ Connection successful!\n');
    
    // Send test email
    console.log('📤 Sending test email...');
    const info = await transporter.sendMail({
      from: `"SmartCityAlert" <${config.auth.user}>`,
      to: config.auth.user,
      subject: 'SmartCityAlert - Email Configuration Test',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h1 style="color: #1e3a8a;">✅ Email Configuration Working!</h1>
          <p>Your SmartCityAlert system is now configured to send emails successfully.</p>
          <hr>
          <p style="color: #6b7280; font-size: 12px;">Test sent at: ${new Date().toLocaleString()}</p>
        </div>
      `,
    });
    
    console.log('✅ Test email sent successfully!');
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`   To: ${config.auth.user}`);
    console.log('\n🎉 Email configuration is working!');
    
  } catch (error) {
    console.error('❌ Email configuration failed:');
    console.error(`   Error: ${error.message}`);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure 2-Step Verification is ENABLED');
    console.log('2. Generate a NEW App Password at: https://myaccount.google.com/apppasswords');
    console.log('3. Copy the 16-character password WITHOUT spaces');
    console.log('4. Update SMTP_PASS in .env file');
    console.log('5. Restart the backend');
  }
}

testEmail();
