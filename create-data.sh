#!/bin/bash

echo "Creating sample data for SmartCityAlert..."

# Login to get token
echo "Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"+2348012345678","password":"Admin123!"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "Failed to login. Make sure backend is running on port 3001"
  exit 1
fi

echo "✅ Logged in successfully"

# Get departments
DEPARTMENTS=$(curl -s -X GET http://localhost:3001/api/departments \
  -H "Authorization: Bearer $TOKEN")

# Extract department IDs
SEC_ID=$(echo $DEPARTMENTS | grep -o '"id":"[^"]*","name":"Security"' | cut -d'"' -f4)
MED_ID=$(echo $DEPARTMENTS | grep -o '"id":"[^"]*","name":"Medical"' | cut -d'"' -f4)
FIRE_ID=$(echo $DEPARTMENTS | grep -o '"id":"[^"]*","name":"Fire"' | cut -d'"' -f4)
MAINT_ID=$(echo $DEPARTMENTS | grep -o '"id":"[^"]*","name":"Maintenance"' | cut -d'"' -f4)

echo "Creating incidents..."

# Create Security incidents
for i in {1..5}; do
  curl -s -X POST http://localhost:3001/api/incidents \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{
      \"title\": \"Security Incident $i\",
      \"description\": \"Suspicious activity detected at gate $i\",
      \"incident_type\": \"security\",
      \"department_id\": \"$SEC_ID\",
      \"severity_level\": $((RANDOM % 5 + 1))
    }" > /dev/null
  echo "✅ Created Security incident $i"
done

# Create Medical incidents
for i in {1..5}; do
  curl -s -X POST http://localhost:3001/api/incidents \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{
      \"title\": \"Medical Emergency $i\",
      \"description\": \"Person requires medical attention at building $i\",
      \"incident_type\": \"medical\",
      \"department_id\": \"$MED_ID\",
      \"severity_level\": $((RANDOM % 5 + 1))
    }" > /dev/null
  echo "✅ Created Medical incident $i"
done

# Create Fire incidents
for i in {1..5}; do
  curl -s -X POST http://localhost:3001/api/incidents \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{
      \"title\": \"Fire Alert $i\",
      \"description\": \"Smoke detected in area $i\",
      \"incident_type\": \"fire\",
      \"department_id\": \"$FIRE_ID\",
      \"severity_level\": $((RANDOM % 5 + 1))
    }" > /dev/null
  echo "✅ Created Fire incident $i"
done

# Create Maintenance incidents
for i in {1..5}; do
  curl -s -X POST http://localhost:3001/api/incidents \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{
      \"title\": \"Maintenance Issue $i\",
      \"description\": \"Infrastructure problem at location $i\",
      \"incident_type\": \"maintenance\",
      \"department_id\": \"$MAINT_ID\",
      \"severity_level\": $((RANDOM % 5 + 1))
    }" > /dev/null
  echo "✅ Created Maintenance incident $i"
done

echo ""
echo "🎉 Sample data creation complete!"
echo "Total incidents created: 20"
echo ""
echo "Refresh your dashboard at http://localhost:3002/dashboard to see the data!"
