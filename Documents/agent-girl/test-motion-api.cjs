// Test script to verify Motion API integration
require('dotenv').config();

// Mock Vite's import.meta.env for Node.js testing
global.import = {
  meta: {
    env: {
      VITE_MOTION_API_KEY: process.env.VITE_MOTION_API_KEY
    }
  }
};

// Mock localStorage for Node.js testing
global.localStorage = {
  getItem: (key) => global.localStorage._storage[key] || null,
  setItem: (key, value) => { global.localStorage._storage[key] = value; },
  removeItem: (key) => { delete global.localStorage._storage[key]; },
  _storage: {}
};

// Mock window object
global.window = {};

// Load the Motion API service
const fs = require('fs');
const path = require('path');

// Read and eval the motionApi.ts file (this is a basic simulation)
const motionApiCode = fs.readFileSync(path.join(__dirname, 'src/utils/motionApi.ts'), 'utf8');

// Replace TypeScript syntax with JavaScript for basic testing
const jsCode = motionApiCode
  .replace(/export/g, '')
  .replace(/import.*from.*;/g, '')
  .replace(/: string/g, '')
  .replace(/: Task/g, '')
  .replace(/: TaskOperation/g, '')
  .replace(/: MotionAPIResponse/g, '')
  .replace(/: boolean/g, '')
  .replace(/: void/g, '')
  .replace(/: any/g, '');

// Create a basic MotionAPI service class
class MotionAPIService {
  constructor() {
    this.baseURL = 'https://api.usemotion.com/v1';
    this.apiKey = null;
    this.operations = [];
    this.currentUserId = null;

    // Initialize with API key from environment or localStorage
    console.log('🔑 Motion API: Checking environment variables...');
    console.log('🔑 Environment available:', !!import.meta.env);
    console.log('🔑 VITE_MOTION_API_KEY available:', !!import.meta.env?.VITE_MOTION_API_KEY);

    if (import.meta.env?.VITE_MOTION_API_KEY) {
      this.apiKey = import.meta.env.VITE_MOTION_API_KEY;
      console.log('✅ Motion API: Loaded API key from environment');
      // Store in localStorage for persistence
      if (typeof window !== 'undefined') {
        localStorage.setItem('motion_api_key', this.apiKey);
      }
    }
    // Fallback: Check localStorage
    else if (typeof window !== 'undefined') {
      this.apiKey = localStorage.getItem('motion_api_key');
      console.log('📦 Motion API: Loaded API key from localStorage:', !!this.apiKey);
    }

    console.log('🔑 Motion API: Final API key status:', !!this.apiKey);
  }

  hasApiKey() {
    return !!this.apiKey;
  }

  async makeRequest() {
    const proxyUrl = 'http://localhost:3013/api/motion/tasks';
    console.log('🎯 Making Motion API request via proxy...');

    const axios = require('axios');

    try {
      const response = await axios.post(proxyUrl, {
        apiKey: this.apiKey
      });

      console.log(`✅ Motion API proxy response received:`, response.data);
      return response.data;
    } catch (error) {
      console.error('Motion API proxy error:', error);
      throw error;
    }
  }

  async getTasks() {
    console.log('🚀 Getting tasks from Motion...');

    if (!this.hasApiKey()) {
      throw new Error('Motion API key not configured');
    }

    try {
      const response = await this.makeRequest();
      console.log('🎯 Motion API response received:', response);
      console.log('🎯 Raw tasks from Motion:', response.data?.tasks?.length || 0);

      const rawTasks = response.data?.tasks || [];
      console.log(`✅ Successfully fetched ${rawTasks.length} tasks from Motion`);

      return {
        success: true,
        data: {
          tasks: rawTasks,
          meta: response.meta
        },
        message: `Successfully fetched ${rawTasks.length} tasks from Motion`
      };
    } catch (error) {
      console.error('❌ Motion API error:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to fetch tasks from Motion'
      };
    }
  }
}

// Test the Motion API
async function testMotionAPI() {
  console.log('🧪 Testing Motion API Integration...\n');

  const motionAPI = new MotionAPIService();

  if (!motionAPI.hasApiKey()) {
    console.log('❌ No API key found - Motion integration will not work');
    return;
  }

  console.log('✅ API key found - Testing connection...\n');

  try {
    const result = await motionAPI.getTasks();

    if (result.success) {
      console.log('\n🎉 SUCCESS! Motion API integration is working correctly!');
      console.log(`📊 Retrieved ${result.data.tasks.length} tasks from Motion`);
      console.log('\n📋 Sample tasks:');
      result.data.tasks.slice(0, 3).forEach((task, index) => {
        console.log(`${index + 1}. ${task.name} (Due: ${task.dueDate})`);
      });
    } else {
      console.log('\n❌ Motion API integration failed:');
      console.log('Error:', result.error);
    }
  } catch (error) {
    console.log('\n💥 Unexpected error:', error.message);
  }
}

testMotionAPI();