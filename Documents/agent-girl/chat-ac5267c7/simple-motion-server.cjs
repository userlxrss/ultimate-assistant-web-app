const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = 3013;

// Middleware
app.use(cors());
app.use(express.json());

// Motion API base URL
const MOTION_API_BASE = 'https://api.usemotion.com/v1';

// Proxy endpoint for Motion API
app.post('/api/motion/tasks', async (req, res) => {
  try {
    const { apiKey } = req.body;

    if (!apiKey) {
      return res.status(400).json({
        success: false,
        error: 'API key required'
      });
    }

    console.log('🎯 Forwarding Motion API request...');

    // Get tasks from Motion API
    console.log('🎯 Attempting to fetch tasks with API key...');

    // Check if API key is placeholder
    if (apiKey === 'your-motion-api-key-here') {
      return res.status(400).json({
        success: false,
        error: 'Please configure your real Motion API key',
        message: 'The placeholder API key "your-motion-api-key-here" is not valid. Please set your real Motion API key.'
      });
    }

    const response = await axios.get(`${MOTION_API_BASE}/tasks`, {
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json'
      }
    });

    console.log(`✅ Motion API response: ${response.data.tasks?.length || 0} tasks found`);

    res.json({
      success: true,
      data: {
        tasks: response.data.tasks || [],
        meta: {
          total: response.data.total || 0,
          hasMore: response.data.hasMore || false
        }
      },
      message: `Successfully fetched ${response.data.tasks?.length || 0} tasks from Motion`
    });

  } catch (error) {
    console.error('Motion API error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: error.response?.data?.message || error.message,
      message: 'Failed to fetch tasks from Motion'
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Motion API Proxy',
    port: PORT
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Motion API Proxy running on http://localhost:${PORT}`);
  console.log(`📡 Proxying requests to: ${MOTION_API_BASE}`);
});

module.exports = app;