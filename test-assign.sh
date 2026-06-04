#!/bin/bash

# Get token
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"+2348012345678","password":"Admin123!"}' | jq -r '.access_token')

echo "Token obtained: $TOKEN"

# Get incident ID - use the one you created
INCIDENT_ID="7d44a717-403a-478f-a767-882bc05217cc"
echo "Incident ID: $INCIDENT_ID"

# Get a user ID
USER_ID=$(curl -s -X GET http://localhost:3001/api/users \
  -H "Authorization: Bearer $TOKEN" | jq -r '.[1].id')
echo "User ID: $USER_ID"

# Test assign
curl -X POST "http://localhost:3001/api/incidents/$INCIDENT_ID/assign" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"$USER_ID\",\"comments\":\"Test assignment\"}"
