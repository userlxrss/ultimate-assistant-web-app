#!/bin/bash

# Vercel Webhook Deployment Trigger
# Use this after creating a deploy hook in Vercel dashboard

# ✅ UPDATED: Your actual webhook URL
WEBHOOK_URL="https://api.vercel.com/v1/integrations/deploy/prj_jNUWxDrjfw7nvJcYHwHpG6SCa1Cw/ihZNzFdAiD"

echo "🚀 Triggering Vercel Deployment via Webhook"
echo "=========================================="
echo ""

if [[ "$WEBHOOK_URL" == *"XXXXXXXX"* ]]; then
    echo "❌ ERROR: Please update the WEBHOOK_URL with your actual Vercel webhook URL"
    echo ""
    echo "📋 To get the webhook URL:"
    echo "1. Go to Vercel Dashboard → Your Project → Settings → Git"
    echo "2. Create a deploy hook for 'main' branch"
    echo "3. Copy the generated webhook URL"
    echo "4. Replace the WEBHOOK_URL in this script"
    echo ""
    echo "🔧 Current placeholder: $WEBHOOK_URL"
    exit 1
fi

echo "📡 Sending deployment request to Vercel..."
echo "🔗 Webhook URL: $WEBHOOK_URL"
echo ""

# Trigger the deployment
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$WEBHOOK_URL")

# Extract HTTP code and response body
HTTP_CODE=$(echo "$RESPONSE" | tail -n1 | cut -d: -f2)
RESPONSE_BODY=$(echo "$RESPONSE" | sed '$d')

echo "📊 Response Status: HTTP $HTTP_CODE"
echo "📄 Response Body:"
echo "$RESPONSE_BODY"
echo ""

if [[ "$HTTP_CODE" == "200" || "$HTTP_CODE" == "201" ]]; then
    echo "✅ Deployment trigger successful!"
    echo ""
    echo "🌐 Monitor deployment at:"
    echo "   Production: https://dailydeck.vercel.app"
    echo "   Vercel Dashboard: https://vercel.com/dashboard"
    echo ""
    echo "⏰ Expected timeline:"
    echo "   Build: 2-3 minutes"
    echo "   Deploy: 1-2 minutes"
    echo "   Total: 3-5 minutes"
else
    echo "❌ Deployment trigger failed!"
    echo "HTTP Code: $HTTP_CODE"
    echo "Response: $RESPONSE_BODY"
    echo ""
    echo "🔧 Troubleshooting:"
    echo "   1. Check if webhook URL is correct"
    echo "   2. Verify Vercel project permissions"
    echo "   3. Check network connectivity"
fi

echo ""
echo "📧 Email verification system will be live after deployment!"