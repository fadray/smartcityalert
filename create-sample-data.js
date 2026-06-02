const axios = require('axios');

const API_URL = 'http://localhost:3001';

async function createSampleData() {
  console.log('Creating sample data for SmartCityAlert...');
  
  try {
    // First, login to get token
    console.log('Logging in...');
    const loginRes = await axios.post(`${API_URL}/api/auth/login`, {
      phone: '+2348012345678',
      password: 'Admin123!'
    });
    
    const token = loginRes.data.access_token;
    console.log('✅ Logged in successfully');
    
    // Get departments
    const deptsRes = await axios.get(`${API_URL}/api/departments`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const departments = deptsRes.data;
    console.log(`Found ${departments.length} departments`);
    
    if (departments.length === 0) {
      console.log('No departments found. Please run database migrations first.');
      return;
    }
    
    // Create sample incidents for the last 6 months
    const incidentTypes = ['medical', 'fire', 'security', 'maintenance'];
    const statuses = ['pending', 'acknowledged', 'in_progress', 'resolved', 'closed', 'escalated'];
    const titles = [
      'Security Breach at Gate', 'Medical Emergency in Building A', 'Fire Alarm Triggered',
      'Power Outage in Sector B', 'Water Leakage in Campground', 'Suspicious Package Found',
      'Vehicle Accident at Main Road', 'Structural Damage Report', 'Theft Incident Reported',
      'Medical Emergency - Cardiac Arrest', 'Fire Outbreak in Kitchen', 'Vandalism Reported'
    ];
    
    const incidents = [];
    
    // Create incidents for the last 6 months
    for (let month = 5; month >= 0; month--) {
      const date = new Date();
      date.setMonth(date.getMonth() - month);
      
      // Number of incidents for this month (more recent months have more incidents)
      const incidentCount = month === 0 ? 12 : month === 1 ? 8 : month === 2 ? 6 : 4;
      
      for (let i = 0; i < incidentCount; i++) {
        const randomDay = Math.floor(Math.random() * 28) + 1;
        date.setDate(randomDay);
        
        const randomHour = Math.floor(Math.random() * 24);
        const randomMinute = Math.floor(Math.random() * 60);
        date.setHours(randomHour, randomMinute);
        
        const incident = {
          title: titles[Math.floor(Math.random() * titles.length)],
          description: `This is a sample incident created for testing purposes. ${Math.random().toString(36).substring(7)}`,
          incident_type: incidentTypes[Math.floor(Math.random() * incidentTypes.length)],
          department_id: departments[Math.floor(Math.random() * departments.length)].id,
          severity_level: Math.floor(Math.random() * 5) + 1,
          status: month === 0 ? statuses[Math.floor(Math.random() * 3)] : 'resolved',
          created_at: date.toISOString(),
        };
        
        incidents.push(incident);
      }
    }
    
    console.log(`Creating ${incidents.length} sample incidents...`);
    
    // Create incidents one by one
    for (const incident of incidents) {
      try {
        await axios.post(`${API_URL}/api/incidents`, incident, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`✅ Created: ${incident.title} - ${incident.incident_type} - Level ${incident.severity_level}`);
      } catch (err) {
        console.log(`❌ Failed: ${incident.title}`);
      }
      
      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('\n🎉 Sample data creation complete!');
    console.log(`Total incidents created: ${incidents.length}`);
    console.log('\nRefresh your dashboard to see the data!');
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

createSampleData();
