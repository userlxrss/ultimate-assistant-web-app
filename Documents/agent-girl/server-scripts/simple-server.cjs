require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = 3002;

// CORS configuration
app.use(cors({
  origin: ['http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    server: 'Simple Calendar Server',
    version: '1.0.0'
  });
});

// iCal proxy endpoint - avoids CORS issues
app.all('/api/calendar/proxy*', async (req, res) => {
  try {
    const path = req.originalUrl.replace('/api/calendar/proxy', '');
    const icalUrl = `https://calendar.google.com/calendar${path}`;

    console.log(`📅 Proxying iCal request to: ${icalUrl}`);

    const response = await fetch(icalUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch iCal: ${response.status} ${response.statusText}`);
    }

    const icalContent = await response.text();

    // Set appropriate headers for iCal content
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    res.send(icalContent);
  } catch (error) {
    console.error('iCal proxy error:', error);
    res.status(500).json({
      error: 'Failed to proxy iCal request',
      message: error.message
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
🚀 Simple Calendar Server is running!
📍 Server: http://localhost:${PORT}
📅 iCal Proxy: http://localhost:${PORT}/api/calendar/proxy/*
🔧 Environment: development
📅 Started: ${new Date().toISOString()}
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

module.exports = app;