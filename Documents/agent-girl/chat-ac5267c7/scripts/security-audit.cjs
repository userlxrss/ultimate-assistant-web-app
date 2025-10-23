#!/usr/bin/env node

/**
 * Security Audit Script
 * 
 * Automated security scanning for:
 * - XSS vulnerabilities
 * - Insecure dependencies
 * - Weak security configurations
 * - Sensitive data exposure
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SECURITY_ISSUES = [];
const WARNINGS = [];

// Colors for console output
const colors = {
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logError(message) {
  SECURITY_ISSUES.push(message);
  log(`🚨 CRITICAL: ${message}`, colors.red);
}

function logWarning(message) {
  WARNINGS.push(message);
  log(`⚠️  WARNING: ${message}`, colors.yellow);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

/**
 * Check for XSS vulnerabilities in source code
 */
function checkXSSVulnerabilities() {
  log('\n🔍 Scanning for XSS vulnerabilities...');
  
  const sourceDir = path.join(__dirname, '../src');
  const xssPatterns = [
    /\.innerHTML\s*=/,
    /\.outerHTML\s*=/,
    /document\.write\s*\(/,
    /eval\s*\(/,
    /Function\s*\(/,
    /setTimeout\s*\(\s*['"`].*['"`]/,
    /setInterval\s*\(\s*['"`].*['"`]/,
    /dangerouslySetInnerHTML/
  ];

  function scanDirectory(dir) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        scanDirectory(filePath);
      } else if (file.match(/\.(ts|tsx|js|jsx)$/)) {
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          const lines = content.split('\n');
          
          xssPatterns.forEach((pattern, index) => {
            for (let i = 0; i < lines.length; i++) {
              if (pattern.test(lines[i])) {
                logError(`XSS vulnerability detected in ${path.relative(process.cwd(), filePath)}:${i + 1} - ${pattern.toString()}`);
              }
            }
          });
        } catch (error) {
          logWarning(`Could not read file: ${filePath}`);
        }
      }
    }
  }
  
  if (fs.existsSync(sourceDir)) {
    scanDirectory(sourceDir);
  }
}

/**
 * Check for sensitive data exposure
 */
function checkSensitiveData() {
  log('\n🔍 Scanning for sensitive data exposure...');
  
  const sensitivePatterns = [
    /password\s*=\s*['"`][^'"`]+['"`]/,
    /secret\s*=\s*['"`][^'"`]+['"`]/,
    /api[_-]?key\s*=\s*['"`][^'"`]+['"`]/,
    /token\s*=\s*['"`][^'"`]+['"`]/,
    /private[_-]?key\s*=\s*['"`][^'"`]+['"`]/,
    /aws[_-]?access[_-]?key\s*=\s*['"`][^'"`]+['"`]/,
    /database[_-]?url\s*=\s*['"`][^'"`]+['"`]/
  ];

  const excludeDirs = ['node_modules', '.git', 'dist', 'build'];
  
  function scanDirectory(dir) {
    try {
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        if (excludeDirs.includes(file)) continue;
        
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          scanDirectory(filePath);
        } else {
          try {
            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.split('\n');
            
            sensitivePatterns.forEach((pattern, index) => {
              for (let i = 0; i < lines.length; i++) {
                if (pattern.test(lines[i])) {
                  logError(`Sensitive data detected in ${path.relative(process.cwd(), filePath)}:${i + 1}`);
                }
              }
            });
          } catch (error) {
            // Skip binary files
          }
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }
  }
  
  scanDirectory(process.cwd());
}

/**
 * Check for insecure dependencies
 */
function checkDependencies() {
  log('\n🔍 Checking for insecure dependencies...');
  
  try {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      // Known vulnerable packages (simplified version)
      const vulnerablePackages = {
        'lodash': '<4.17.21',
        'express': '<4.17.0',
        'axios': '<0.21.0',
        'node-forge': '<1.3.0',
        'request': '<2.88.0'
      };
      
      for (const [pkg, vulnVersion] of Object.entries(vulnerablePackages)) {
        if (dependencies[pkg]) {
          logError(`Vulnerable dependency detected: ${pkg} (current: ${dependencies[pkg]}, vulnerable: ${vulnVersion})`);
        }
      }
      
      logSuccess('Dependency scan completed');
    }
  } catch (error) {
    logWarning('Could not check dependencies');
  }
}

/**
 * Check file permissions
 */
function checkFilePermissions() {
  log('\n🔍 Checking file permissions...');
  
  const sensitiveFiles = [
    '.env',
    '.env.production',
    'config.json',
    'private-key.pem',
    'database.json'
  ];
  
  for (const file of sensitiveFiles) {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      try {
        const stats = fs.statSync(filePath);
        const mode = (stats.mode & parseInt('777', 8)).toString(8);
        
        if (mode !== '600' && mode !== '400') {
          logWarning(`Sensitive file ${file} has loose permissions: ${mode}`);
        }
      } catch (error) {
        logWarning(`Could not check permissions for ${file}`);
      }
    }
  }
}

/**
 * Check for missing security headers
 */
function checkSecurityHeaders() {
  log('\n🔍 Checking security configuration...');
  
  const serverFiles = [
    'server/index.js',
    'server/app.js',
    'index.js',
    'app.js'
  ];
  
  let hasHelmet = false;
  let hasCSP = false;
  let hasRateLimit = false;
  
  for (const file of serverFiles) {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        if (content.includes('helmet')) hasHelmet = true;
        if (content.includes('contentSecurityPolicy') || content.includes('CSP')) hasCSP = true;
        if (content.includes('rateLimit') || content.includes('express-rate-limit')) hasRateLimit = true;
      } catch (error) {
        logWarning(`Could not read ${file}`);
      }
    }
  }
  
  if (!hasHelmet) logWarning('Missing helmet security middleware');
  if (!hasCSP) logWarning('Missing Content Security Policy');
  if (!hasRateLimit) logWarning('Missing rate limiting');
}

/**
 * Generate security report
 */
function generateReport() {
  log('\n' + colors.bold + '📊 SECURITY AUDIT REPORT' + colors.reset);
  log('=' .repeat(50));
  
  if (SECURITY_ISSUES.length === 0 && WARNINGS.length === 0) {
    logSuccess('No security issues found! 🎉');
  } else {
    if (SECURITY_ISSUES.length > 0) {
      log(`\n${colors.red}${colors.bold}CRITICAL ISSUES (${SECURITY_ISSUES.length}):${colors.reset}`);
      SECURITY_ISSUES.forEach(issue => log(`  • ${issue}`, colors.red));
    }
    
    if (WARNINGS.length > 0) {
      log(`\n${colors.yellow}${colors.bold}WARNINGS (${WARNINGS.length}):${colors.reset}`);
      WARNINGS.forEach(warning => log(`  • ${warning}`, colors.yellow));
    }
  }
  
  log('\n' + colors.bold + 'RECOMMENDATIONS:' + colors.reset);
  log('1. Fix all CRITICAL issues immediately');
  log('2. Address warnings to improve security posture');
  log('3. Implement regular security audits');
  log('4. Use automated security testing in CI/CD');
  log('5. Keep dependencies updated');
  log('6. Monitor security advisories');
  
  // Save report to file
  const report = {
    timestamp: new Date().toISOString(),
    criticalIssues: SECURITY_ISSUES,
    warnings: WARNINGS,
    summary: {
      total: SECURITY_ISSUES.length + WARNINGS.length,
      critical: SECURITY_ISSUES.length,
      warnings: WARNINGS.length
    }
  };
  
  fs.writeFileSync(
    path.join(process.cwd(), 'security-audit-report.json'),
    JSON.stringify(report, null, 2)
  );
  
  logSuccess(`\nDetailed report saved to: security-audit-report.json`);
  
  // Exit with error code if critical issues found
  if (SECURITY_ISSUES.length > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

// Run security audit
function main() {
  log(colors.bold + '🔒 SECURITY AUDIT TOOL' + colors.reset);
  log('=' .repeat(50));
  
  checkXSSVulnerabilities();
  checkSensitiveData();
  checkDependencies();
  checkFilePermissions();
  checkSecurityHeaders();
  generateReport();
}

if (require.main === module) {
  main();
}

module.exports = {
  checkXSSVulnerabilities,
  checkSensitiveData,
  checkDependencies,
  checkFilePermissions,
  checkSecurityHeaders
};
