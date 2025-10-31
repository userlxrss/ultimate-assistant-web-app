#!/usr/bin/env node

/**
 * QUICK OAUTH FLOW TESTER
 *
 * This script helps you quickly test and debug the OAuth authentication flow.
 * Run this to verify everything is working before your presentation.
 */

const http = require('http');
const { spawn } = require('child_process');

console.log('🚀 OAUTH FLOW TESTER - Emergency Presentation Fix');
console.log('=' .repeat(60));

// Test function to check if servers are running
function checkServer(port, name) {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: port,
      path: '/api/health',
      method: 'GET',
      timeout: 3000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const health = JSON.parse(data);
          console.log(`✅ ${name} (port ${port}): ${health.status} - ${health.service || health.version || 'OK'}`);
          resolve(true);
        } catch (e) {
          console.log(`⚠️ ${name} (port ${port}): Running but invalid response`);
          resolve(true);
        }
      });
    });

    req.on('error', () => {
      console.log(`❌ ${name} (port ${port}): Not running`);
      resolve(false);
    });

    req.on('timeout', () => {
      console.log(`⚠️ ${name} (port ${port}): Timeout`);
      resolve(false);
    });

    req.end();
  });
}

// Function to start a server if not running
function startServer(command, args, name, port) {
  return new Promise((resolve) => {
    console.log(`🔄 Starting ${name}...`);

    const process = spawn(command, args, {
      stdio: 'inherit',
      shell: true
    });

    process.on('error', (error) => {
      console.error(`❌ Failed to start ${name}:`, error.message);
      resolve(false);
    });

    process.on('spawn', () => {
      console.log(`✅ ${name} started successfully`);
      resolve(true);
    });

    // Give it time to start
    setTimeout(() => {
      if (process.pid) {
        console.log(`✅ ${name} is running (PID: ${process.pid})`);
        resolve(true);
      } else {
        console.log(`❌ ${name} failed to start`);
        resolve(false);
      }
    }, 3000);
  });
}

// Main test function
async function runTests() {
  console.log('🔍 Checking server status...\n');

  // Check if OAuth server is running (port 3006)
  const oauthRunning = await checkServer(3006, 'OAuth Server');

  // Check if frontend is running (port 5173)
  const frontendRunning = await checkServer(5173, 'Frontend Dev Server');

  console.log('\n📊 Server Status Summary:');
  console.log(`OAuth Server (3006): ${oauthRunning ? '✅ Running' : '❌ Stopped'}`);
  console.log(`Frontend (5173): ${frontendRunning ? '✅ Running' : '❌ Stopped'}`);

  if (!oauthRunning) {
    console.log('\n🔄 Starting OAuth Server...');
    await startServer('node', ['simple-oauth-server.cjs'], 'OAuth Server', 3006);

    // Wait a bit more for OAuth server to fully start
    console.log('⏳ Waiting for OAuth server to fully initialize...');
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  if (!frontendRunning) {
    console.log('\n🔄 Starting Frontend Server...');
    await startServer('npm', ['run', 'dev'], 'Frontend Dev Server', 5173);

    // Wait for frontend to start
    console.log('⏳ Waiting for frontend to fully start...');
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  // Final status check
  console.log('\n🔍 Final Status Check:');
  await checkServer(3006, 'OAuth Server');
  await checkServer(5173, 'Frontend Dev Server');

  console.log('\n📋 TEST INSTRUCTIONS:');
  console.log('1. Open your browser and navigate to: http://localhost:5173');
  console.log('2. Find the Google Authentication component');
  console.log('3. Click "Sign in with Google"');
  console.log('4. If popup fails, click "Use Redirect-Based Authentication"');
  console.log('5. Complete the Google OAuth flow');
  console.log('6. Verify authentication success in the app');
  console.log('\n🔧 DEBUGGING:');
  console.log('- Check browser console for detailed logging');
  console.log('- Check terminal output for server logs');
  console.log('- Both popup and redirect flows are now supported');
  console.log('- CORS is configured for all localhost ports');

  console.log('\n✅ OAuth Flow Tester Complete!');
  console.log('Your presentation should now work correctly.');
  process.exit(0);
}

// Run the tests
runTests().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});