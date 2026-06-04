#!/bin/bash

TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"+2348012345678","password":"Admin123!"}' | jq -r '.access_token')

echo "=== Creating new incident ==="
INCIDENT_ID=$(curl -s -X POST http://localhost:3001/api/incidents \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "History Test",
    "description": "Testing history",
    "incident_type": "medical",
    "department_id": "1c0d789e-ba06-42a7-a010-664beffb0190",
    "severity_level": 3,
    "location": "Test Location",
    "images": []
  }' | jq -r '.id')

echo "Incident ID: $INCIDENT_ID"
echo ""

echo "=== Initial history (should be empty) ==="
curl -s -X GET "http://localhost:3001/api/incidents/$INCIDENT_ID" \
  -H "Authorization: Bearer $TOKEN" | jq '.escalation_history'
echo ""

echo "=== Update 1: Change status to acknowledged ==="
curl -s -X PUT "http://localhost:3001/api/incidents/$INCIDENT_ID/status" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"acknowledged"}' > /dev/null

echo "History after update 1:"
curl -s -X GET "http://localhost:3001/api/incidents/$INCIDENT_ID" \
  -H "Authorization: Bearer $TOKEN" | jq '.escalation_history'
echo ""

echo "=== Update 2: Change status to in_progress ==="
curl -s -X PUT "http://localhost:3001/api/incidents/$INCIDENT_ID/status" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"in_progress"}' > /dev/null

echo "History after update 2:"
curl -s -X GET "http://localhost:3001/api/incidents/$INCIDENT_ID" \
  -H "Authorization: Bearer $TOKEN" | jq '.escalation_history'
echo ""

echo "=== Update 3: Change status to resolved ==="
curl -s -X PUT "http://localhost:3001/api/incidents/$INCIDENT_ID/status" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"resolved"}' > /dev/null

echo "History after update 3:"
curl -s -X GET "http://localhost:3001/api/incidents/$INCIDENT_ID" \
  -H "Authorization: Bearer $TOKEN" | jq '.escalation_history'
echo ""

echo "=== Final history length ==="
LENGTH=$(curl -s -X GET "http://localhost:3001/api/incidents/$INCIDENT_ID" \
  -H "Authorization: Bearer $TOKEN" | jq '.escalation_history | length')
echo "Total events: $LENGTH"
