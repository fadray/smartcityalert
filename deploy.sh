#!/bin/bash

echo "🚀 SmartCityAlert - Department-Based System Deployment"
echo "======================================================"
echo ""

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose not found. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker and Docker Compose found"
echo ""

# Create migration file
echo "📝 Creating database migration..."
cat > backend/src/database/migrations/001_init.sql << 'MIGRATION'
-- Migration file content from above
MIGRATION

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Build and start
echo "📦 Building and starting services..."
docker-compose build --no-cache
docker-compose up -d

# Wait for services
echo "⏳ Waiting for services to be ready (30 seconds)..."
sleep 30

# Check status
if docker-compose ps | grep -q "Up"; then
    echo ""
    echo "✅✅✅ DEPLOYMENT SUCCESSFUL! ✅✅✅"
    echo ""
    echo "=========================================="
    echo "🎉 SmartCityAlert is now LIVE!"
    echo "=========================================="
    echo ""
    echo "📍 ACCESS YOUR SYSTEM:"
    echo "   Admin Dashboard: http://localhost:8080"
    echo "   Backend API: http://localhost:3000"
    echo ""
    echo "🔐 DEFAULT LOGIN CREDENTIALS:"
    echo "   Phone: +2348012345678"
    echo "   Password: Admin123!"
    echo ""
    echo "📊 SYSTEM FEATURES:"
    echo "   ✅ Department-based structure (Security, Medical, Fire, Maintenance)"
    echo "   ✅ Role hierarchy (Staff → Supervisor → HOD → Dept Director → Overall Manager → Overall Director)"
    echo "   ✅ Configurable workflow with visual editor"
    echo "   ✅ Automated multi-level escalation"
    echo "   ✅ Real-time incident tracking on map"
    echo "   ✅ Comprehensive reporting with success rates"
    echo "   ✅ WhatsApp integration for reporting"
    echo "   ✅ Complete admin dashboard"
    echo ""
    echo "=========================================="
    echo "📝 USEFUL COMMANDS:"
    echo "   View logs: docker-compose logs -f"
    echo "   Stop: docker-compose down"
    echo "   Restart: docker-compose restart"
    echo "   Rebuild: docker-compose up -d --build"
    echo "=========================================="
else
    echo "❌ Deployment failed. Check logs with: docker-compose logs"
    exit 1
fi
