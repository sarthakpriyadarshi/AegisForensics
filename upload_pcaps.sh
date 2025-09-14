#!/bin/bash

# Configuration
USERNAME="your_username"  # Replace with your actual username
PASSWORD="your_password"  # Replace with your actual password
CASE_ID="1"              # Replace with your actual case ID
BASE_URL="http://localhost:8000"
FILES_DIR="/home/sarthak/Downloads/Sample Files"

echo "🔐 Logging in to Aegis Forensics..."

# Login and get token
TOKEN=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"$USERNAME\", \"password\": \"$PASSWORD\"}" | \
  jq -r '.token')

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
    echo "❌ Login failed. Please check your credentials."
    exit 1
fi

echo "✅ Login successful. Token obtained."
echo "🔍 Token: ${TOKEN:0:20}..."

echo ""
echo "📋 Listing available cases..."
curl -s -X GET "$BASE_URL/api/cases" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq '.'

echo ""
echo "📁 Uploading PCAP files..."

# Upload 1.pcap
echo "⬆️  Uploading 1.pcap..."
RESPONSE1=$(curl -s -X POST "$BASE_URL/analyze/uploadfile/" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@$FILES_DIR/1.pcap" \
  -F "case_id=$CASE_ID")

echo "Response for 1.pcap:"
echo "$RESPONSE1" | jq '.'

echo ""

# Upload 2.pcap
echo "⬆️  Uploading 2.pcap..."
RESPONSE2=$(curl -s -X POST "$BASE_URL/analyze/uploadfile/" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@$FILES_DIR/2.pcap" \
  -F "case_id=$CASE_ID")

echo "Response for 2.pcap:"
echo "$RESPONSE2" | jq '.'

echo ""
echo "✅ Upload process completed!"
echo "🔍 Check the Analysis page in the web interface to see the results."
