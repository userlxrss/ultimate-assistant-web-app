require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const MemoryStore = require('memorystore')(session);
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3007;

// Basic middleware
app.use(cors({
  origin: ['http://localhost:5176', 'http://localhost:5174', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware
app.use(session({
  store: new MemoryStore({ checkPeriod: 86400000 }),
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date().toISOString() });
});

// Mock auth endpoints for development
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  // Mock authentication
  res.json({
    success: true,
    user: { email, id: 'mock-user-id' },
    token: 'mock-jwt-token'
  });
});

app.get('/api/auth/verify', (req, res) => {
  res.json({ authenticated: true, user: { email: 'mock@example.com' } });
});

// Import route handlers if they exist
try {
  const authRoutes = require('./routes/auth');
  app.use('/auth', authRoutes);
} catch (e) {
  console.log('Auth routes not available');
}

try {
  const googleRoutes = require('./routes/google');
  app.use('/api/google', googleRoutes);
} catch (e) {
  console.log('Google routes not available');
}

try {
  const motionRoutes = require('./routes/motion');
  app.use('/api/motion', motionRoutes);
} catch (e) {
  console.log('Motion routes not available');
}

// WebSocket server for development
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('WebSocket client connected');

  ws.on('message', (message) => {
    console.log('Received:', message.toString());
  });

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });

  // Send initial welcome message
  ws.send(JSON.stringify({ type: 'connected', message: 'WebSocket connection established' }));
});

server.listen(PORT, () => {
  console.log(`🚀 Development server running on http://localhost:${PORT}`);
  console.log(`🔌 WebSocket server running on ws://localhost:${PORT}`);
  console.log('⚠️  This is a development server with placeholder authentication');
  console.log('🔧 Gmail integration is available on port 3012');
});