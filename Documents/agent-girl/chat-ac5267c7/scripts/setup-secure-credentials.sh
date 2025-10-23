#!/bin/bash

# Secure Credential Setup Script
# This script helps configure secure credentials for the application

set -e

echo "🔒 SECURE CREDENTIAL SETUP SCRIPT"
echo "=================================="
echo

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to generate secure secrets
generate_secret() {
    openssl rand -hex 32
}

generate_jwt_secret() {
    openssl rand -base64 32
}

generate_session_secret() {
    openssl rand -hex 16
}

# Check if .env file exists
ENV_FILE="server/.env"
ENV_EXAMPLE=".env.example"

if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}❌ Error: server/.env file not found${NC}"
    echo -e "${YELLOW}📝 Creating new .env file from template...${NC}"
    
    if [ -f "$ENV_EXAMPLE" ]; then
        cp "$ENV_EXAMPLE" "$ENV_FILE"
        echo -e "${GREEN}✅ Created server/.env from .env.example${NC}"
    else
        echo -e "${RED}❌ Error: .env.example file not found${NC}"
        exit 1
    fi
fi

echo -e "${BLUE}🔧 Checking current credential configuration...${NC}"
echo

# Check for placeholder credentials
PLACEHOLDER_FOUND=false

if grep -q "placeholder-google-client-id" "$ENV_FILE"; then
    echo -e "${YELLOW}⚠️  Found placeholder Google Client ID${NC}"
    PLACEHOLDER_FOUND=true
fi

if grep -q "placeholder-google-client-secret" "$ENV_FILE"; then
    echo -e "${YELLOW}⚠️  Found placeholder Google Client Secret${NC}"
    PLACEHOLDER_FOUND=true
fi

if grep -q "your-super-secret" "$ENV_FILE"; then
    echo -e "${YELLOW}⚠️  Found placeholder session/JWT secrets${NC}"
    PLACEHOLDER_FOUND=true
fi

if [ "$PLACEHOLDER_FOUND" = true ]; then
    echo
    echo -e "${RED}🚨 SECURITY WARNING: Placeholder credentials detected!${NC}"
    echo
    echo -e "${YELLOW}📋 Required Actions:${NC}"
    echo "1. Get Google OAuth credentials from: https://console.developers.google.com/"
    echo "2. Create a new project or select existing one"
    echo "3. Enable Gmail API, Google Calendar API, and People API"
    echo "4. Create OAuth 2.0 Client ID credentials"
    echo "5. Add authorized redirect URI: http://localhost:3006/auth/google/callback"
    echo
    echo -e "${BLUE}🔐 Auto-generating secure secrets...${NC}"
    
    # Generate new secure secrets
    SESSION_SECRET=$(generate_session_secret)
    JWT_SECRET=$(generate_jwt_secret)
    ENCRYPTION_KEY=$(generate_secret)
    
    # Update .env file with new secrets
    sed -i.tmp "s/SESSION_SECRET=.*/SESSION_SECRET=$SESSION_SECRET/" "$ENV_FILE"
    sed -i.tmp "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" "$ENV_FILE"
    sed -i.tmp "s/ENCRYPTION_KEY=.*/ENCRYPTION_KEY=$ENCRYPTION_KEY/" "$ENV_FILE"
    
    # Remove temp file
    rm -f "$ENV_FILE.tmp"
    
    echo -e "${GREEN}✅ Generated new secure secrets${NC}"
    echo
else
    echo -e "${GREEN}✅ No placeholder credentials found${NC}"
fi

echo -e "${BLUE}🔍 Validating credential configuration...${NC}"

# Test if the server can validate credentials
if node -e "
const { validateCredentials } = require('./server/utils/credentialValidator');
const results = validateCredentials();
if (results.isValid) {
    console.log('✅ Credentials are properly configured');
    process.exit(0);
} else {
    console.log('❌ Credentials validation failed');
    results.criticalIssues.forEach(issue => console.log('  - ' + issue));
    process.exit(1);
}
" 2>/dev/null; then
    echo -e "${GREEN}✅ Credential validation passed${NC}"
else
    echo -e "${RED}❌ Credential validation failed${NC}"
    echo -e "${YELLOW}📖 Please check server/.env file and ensure all required credentials are set${NC}"
fi

echo
echo -e "${BLUE}🔒 Security Recommendations:${NC}"
echo "• Never commit real credentials to version control"
echo "• Use different secrets for development and production"
echo "• Store production secrets in secure environment (AWS Secrets Manager, etc.)"
echo "• Rotate secrets regularly"
echo "• Enable HTTPS in production"
echo "• Review and update CORS settings for production"
echo

if [ "$PLACEHOLDER_FOUND" = true ]; then
    echo -e "${YELLOW}⚠️  ACTION REQUIRED: Configure Google OAuth credentials before running the application${NC}"
    echo -e "${YELLOW}📖 Edit server/.env and replace placeholder values with real credentials${NC}"
else
    echo -e "${GREEN}✅ Security setup complete!${NC}"
    echo -e "${GREEN}🚀 You can now start the application securely${NC}"
fi

echo
echo "============================================"
