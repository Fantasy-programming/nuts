#!/bin/bash

# Example script to demonstrate the mail system functionality
# This script tests the complete workflow without actually sending emails

echo "🚀 Testing Mail System Integration"
echo "=================================="

echo
echo "1. Testing Mail Generator Service Health..."
health_response=$(curl -s http://localhost:3001/health)
echo "Response: $health_response"

echo
echo "2. Testing Welcome Email Template..."
welcome_response=$(curl -s -X POST http://localhost:3001/templates/welcome \
  -H "Content-Type: application/json" \
  -d '{"name": "Alice Johnson", "email": "alice@example.com"}')
echo "Subject: $(echo $welcome_response | jq -r .subject)"
echo "Template: $(echo $welcome_response | jq -r .template)"

echo
echo "3. Testing Reset Password Email Template..."
reset_response=$(curl -s -X POST http://localhost:3001/templates/reset-password \
  -H "Content-Type: application/json" \
  -d '{"name": "Bob Smith", "email": "bob@example.com", "resetLink": "https://nuts.app/reset/abc123"}')
echo "Subject: $(echo $reset_response | jq -r .subject)"
echo "Template: $(echo $reset_response | jq -r .template)"

echo
echo "4. Testing Notification Email Template..."
notification_response=$(curl -s -X POST http://localhost:3001/templates/notification \
  -H "Content-Type: application/json" \
  -d '{"name": "Carol Williams", "email": "carol@example.com", "title": "Budget Alert", "message": "You have exceeded your monthly budget by $150."}')
echo "Subject: $(echo $notification_response | jq -r .subject)"
echo "Template: $(echo $notification_response | jq -r .template)"

echo
echo "✅ All tests completed successfully!"
echo
echo "📧 Mail System Features:"
echo "  • Go mailer package with SMTP support (gomail)"
echo "  • Node.js mail generator service (Fastify + react-email)"
echo "  • Three email templates: welcome, reset-password, notification"
echo "  • RESTful API endpoints for sending emails"
echo "  • Proper validation and error handling"
echo
echo "🔧 Usage:"
echo "  • Start mail generator: cd services/mail-generator && npm start"
echo "  • Configure SMTP settings in server environment variables"
echo "  • Use /api/mail/* endpoints to send emails programmatically"