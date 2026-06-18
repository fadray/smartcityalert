const nodemailer = require('nodemailer');
require('dotenv').config();

async function testEmailSSL() {
  console.log('\n📧 Testing Gmail with SSL (Port 465)...\n');
  
  const config = {
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USER || 'klenjolie45@gmail.com',
      pass: process.env.SMTP_PASS,
    },
  };
  
  console.log(`Host: ${config.host}`);
  console.log(`Port: ${config.port}`);
  console.log(`Secure: ${config.secure}`);
  console.log(`User: ${config.auth.user}`);
  
  if (!config.auth.pass) {
    console.error('\n❌ Missing SMTP_PASS in .env');
    process.exit(1);
  }
  
  const transporter = nodemailer.createTransport(config);
  
  try {
    await transporter.verify();
    console.log('\n✅ Connection successful!');
    
    const info = await transporter.sendMail({
      from: `"SmartCityAlert" <${config.auth.user}>`,
      to: config.auth.user,
      subject: 'SmartCityAlert - SSL Test',
      text: 'If you receive this, email is working on port 465!',
    });
    console.log('✅ Test email sent!');
    console.log(`Message ID: ${info.messageId}`);
    
    // Update .env with working configuration
    console.log('\n📝 Update your .env with:');
    console.log('SMTP_HOST=smtp.gmail.com');
    console.log('SMTP_PORT=465');
    console.log('SMTP_SECURE=true');
    
  } catch (error) {
    console.error('\n❌ Connection failed:', error.message);
    console.log('\n🔧 Alternative: Use Ethereal for testing');
  }
}

testEmailSSL();
