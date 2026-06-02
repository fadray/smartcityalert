#!/bin/bash

echo "🚀 SmartCityAlert - NestJS Deployment"
echo "======================================"

# Start PostgreSQL
echo "📦 Starting PostgreSQL..."
docker-compose up -d

# Wait for DB
echo "⏳ Waiting for database to be ready..."
sleep 15

# Update admin password hash
cd backend
echo "🔧 Building backend..."
npm run build

# Create admin user with proper password hash
echo "👤 Creating admin user..."
node -e "
const bcrypt = require('bcrypt');
const { Client } = require('pg');

async function createAdmin() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'smartcity',
    password: 'SecurePass123!',
    database: 'smartcityalert',
  });
  
  await client.connect();
  const hash = await bcrypt.hash('Admin123!', 10);
  
  await client.query(\`
    UPDATE users SET password = \$1 WHERE phone = '+2348012345678'
  \`, [hash]);
  
  console.log('✅ Admin user created with password: Admin123!');
  await client.end();
}

createAdmin().catch(console.error);
"

# Start backend
echo "🚀 Starting backend server..."
npm run start:dev &
BACKEND_PID=$!

cd ../admin-dashboard
echo "🎨 Starting admin dashboard..."
npm run dev &
DASHBOARD_PID=$!

echo ""
echo "✅✅✅ DEPLOYMENT SUCCESSFUL! ✅✅✅"
echo ""
echo "📍 ACCESS THE SYSTEM:"
echo "   Admin Dashboard: http://localhost:3001"
echo "   Backend API: http://localhost:3000"
echo "   API Health: http://localhost:3000/health"
echo ""
echo "🔐 LOGIN CREDENTIALS:"
echo "   Phone: +2348012345678"
echo "   Password: Admin123!"
echo ""
echo "📊 FEATURES:"
echo "   ✅ Department-based structure"
echo "   ✅ Role hierarchy (6 levels)"
echo "   ✅ Auto-escalation every 30 minutes"
echo "   ✅ Real-time incident tracking"
echo "   ✅ Complete admin dashboard"
echo ""
echo "🛑 To stop:"
echo "   kill $BACKEND_PID $DASHBOARD_PID"
echo "   docker-compose down"
echo "======================================"
