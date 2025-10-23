#!/bin/bash

# Security Update Script
# Usage: ./scripts/security/security-update.sh

echo "🛡️  Running Security Updates..."
echo "=================================="

# Backup package files
echo "💾 Backing up package files..."
cp package.json package.json.backup.$(date +%Y%m%d_%H%M%S)
cp package-lock.json package-lock.json.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || true

# Run security audit
echo "🔍 Running security audit..."
npm audit --audit-level=moderate

# Fix vulnerabilities
echo "🔧 Fixing vulnerabilities..."
npm audit fix --force

# Update packages
echo "📦 Updating packages..."
npm update

# Clean up
echo "🧹 Cleaning up..."
npm cache clean --force

echo "=================================="
echo "✅ Security updates completed"

# Verify after updates
echo "🔍 Verifying security status..."
npm audit --audit-level=moderate
