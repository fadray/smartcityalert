const { Client } = require('pg');

async function checkHistory() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'smartcity',
    password: 'SecurePass123!',
    database: 'smartcityalert',
  });
  
  await client.connect();
  
  const result = await client.query(`
    SELECT id, title, escalation_history 
    FROM incidents 
    ORDER BY created_at DESC 
    LIMIT 3
  `);
  
  for (const row of result.rows) {
    console.log(`\n=== Incident: ${row.title} (${row.id.slice(0, 8)}) ===`);
    console.log('History:', row.escalation_history);
    console.log('History length:', row.escalation_history ? JSON.parse(row.escalation_history).length : 0);
  }
  
  await client.end();
}

checkHistory().catch(console.error);
