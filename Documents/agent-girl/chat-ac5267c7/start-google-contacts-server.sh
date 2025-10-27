#!/bin/bash

# Google Contacts OAuth2 Server Startup Script

echo "🚀 Starting Google Contacts OAuth2 Server..."

# Check if .env.google exists
if [ ! -f ".env.google" ]; then
    echo "❌ .env.google file not found!"
    echo "📋 Please create .env.google file with your Google OAuth2 credentials:"
    echo "   cp .env.google.example .env.google"
    echo "   Then edit .env.google with your actual credentials"
    echo ""
    echo "📖 Setup instructions: GOOGLE_CONTACTS_SETUP.md"
    exit 1
fi

# Load environment variables
export $(cat .env.google | xargs)

# Check if required environment variables are set
if [ -z "$GOOGLE_CLIENT_ID" ] || [ "$GOOGLE_CLIENT_ID" = "your_google_client_id_here" ]; then
    echo "❌ GOOGLE_CLIENT_ID not configured in .env.google"
    echo "📖 Setup instructions: GOOGLE_CONTACTS_SETUP.md"
    exit 1
fi

if [ -z "$GOOGLE_CLIENT_SECRET" ] || [ "$GOOGLE_CLIENT_SECRET" = "your_google_client_secret_here" ]; then
    echo "❌ GOOGLE_CLIENT_SECRET not configured in .env.google"
    echo "📖 Setup instructions: GOOGLE_CONTACTS_SETUP.md"
    exit 1
fi

echo "✅ Environment configuration found"
echo "📍 OAuth2 Server will start on http://localhost:3013"
echo "🔐 OAuth URL: http://localhost:3013/api/auth/google"
echo ""
echo "📋 Next steps:"
echo "1. Keep this server running"
echo "2. Start your frontend app: npm run dev"
echo "3. Go to Contacts tab and authenticate with Google"
echo ""

# Start the OAuth2 server
node google-contacts-oauth-server.cjs