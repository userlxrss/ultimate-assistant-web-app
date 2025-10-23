#!/bin/bash

# Security Audit Script
# Usage: ./scripts/security/security-audit.sh

echo "🔒 Running Security Audit..."
echo "=================================="

# Check for vulnerabilities
echo "📋 Checking for vulnerabilities..."
npm audit --audit-level=moderate

# Check for outdated packages
echo "📦 Checking for outdated packages..."
npm outdated || true

# Check package integrity
echo "🔐 Verifying package integrity..."
npm ci --dry-run || true

# Check for secrets in code
echo "🕵️  Scanning for potential secrets..."
if command -v git &> /dev/null; then
    git grep -i "password\|secret\|key\|token" -- ':!package-lock.json' -- ':!node_modules' || true
fi

echo "=================================="
echo "✅ Security audit completed"
