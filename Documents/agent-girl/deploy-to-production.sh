#!/bin/bash

# Direct Vercel API Deployment Script
# Uses your exact project details for targeted deployment

echo "🚀 DIRECT VERCEL API DEPLOYMENT"
echo "================================="
echo ""

# Your exact project details from screenshot
PROJECT_ID="prj_jNUWxDrjfw7nvJcYHwHpG6SCa1Cw"
TEAM_ID="team_BpI39AUmOk7sSyJBDGbtUTCP"
TARGET_URL="https://api.vercel.com/v13/deployments"

echo "📋 Project Details:"
echo "   Project ID: $PROJECT_ID"
echo "   Team ID: $TEAM_ID"
echo "   Production URL: dailydeck.vercel.app"
echo ""

# Create deployment request body
DEPLOY_BODY='{
  "name": "ultimate-assistant-web-app",
  "project": "'$PROJECT_ID'",
  "team": "'$TEAM_ID'",
  "target": "production",
  "gitSource": {
    "repo": "userlxrss/ultimate-assistant-web-app",
    "ref": "main"
  },
  "build": {
    "env": {
      "VERCEL_ENV": "production"
    }
  },
  "metadata": {
    "reason": "Email verification system deployment - SECURITY UPDATE",
    "source": "cli"
  }
}'

echo "📡 Sending deployment request to Vercel API..."
echo ""

# Trigger deployment using Vercel API directly
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer \$VERCEL_TOKEN" \
  -d "$DEPLOY_BODY" \
  "$TARGET_URL" 2>/dev/null || echo "AUTH_ERROR: Need Vercel token")

# Check if we need Vercel token
if [[ "$RESPONSE" == *"AUTH_ERROR"* || "$RESPONSE" == *"Unauthorized"* ]]; then
  echo "❌ AUTHENTICATION ERROR"
  echo "📋 To fix this, you need to:"
  echo "   1. Go to: https://vercel.com/account/tokens"
  echo "   2. Create a new Vercel API token"
  echo "   3. Set environment variable: export VERCEL_TOKEN='your_token_here'"
  echo "   4. Run this script again"
  echo ""
  echo "🔧 Alternative: Use Vercel web interface to deploy manually"
  exit 1
fi

# Extract response
HTTP_CODE=$(echo "$RESPONSE" | tail -n1 | cut -d: -f2)
RESPONSE_BODY=$(echo "$RESPONSE" | sed '$d')

echo "📊 Response Status: HTTP $HTTP_CODE"
echo "📄 Response Body:"
echo "$RESPONSE_BODY"
echo ""

if [[ "$HTTP_CODE" == "200" || "$HTTP_CODE" == "201" ]]; then
  echo "✅ Deployment request successful!"

  # Try to extract deployment URL
  DEPLOY_URL=$(echo "$RESPONSE_BODY" | grep -o '"url":"[^"]*"' | cut -d'"' -f4)
  if [[ -n "$DEPLOY_URL" ]]; then
    echo "🔗 Deployment URL: $DEPLOY_URL"
  fi

  echo ""
  echo "🌐 Monitor deployment at:"
  echo "   Production: https://dailydeck.vercel.app"
  echo "   Vercel Dashboard: https://vercel.com/dashboard"
  echo ""
  echo "⏰ Expected timeline:"
  echo "   Build: 2-4 minutes"
  echo "   Deploy: 1-2 minutes"
  echo "   Total: 3-6 minutes"
  echo ""
  echo "📧 Email verification system will be live after deployment!"
else
  echo "❌ Deployment request failed!"
  echo "HTTP Code: $HTTP_CODE"
  echo "Response: $RESPONSE_BODY"
  echo ""
  echo "🔧 Troubleshooting:"
  echo "   1. Check Vercel API token permissions"
  echo "   2. Verify project and team IDs"
  echo "   3. Check network connectivity"
  echo "   4. Use Vercel web interface as alternative"
fi

echo ""
echo "🎯 Current Production Status:"
echo "   URL: https://dailydeck.vercel.app"
echo "   Issue: Users can sign up without email verification (SECURITY RISK)"
echo "   Solution: This deployment will fix the issue"