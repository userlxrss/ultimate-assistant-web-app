import express from 'express';
import cors from 'cors';
import { google } from 'googleapis';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Import email routes
import emailRoutes from './server/emailRoutes.js';
app.use('/api/auth', emailRoutes);

// Google OAuth configuration
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID || 'your-google-client-id',
  process.env.GOOGLE_CLIENT_SECRET || 'your-google-client-secret',
  'http://localhost:5174' // Your frontend redirect URI
);

// Store for refresh tokens (in production, use a proper database)
const tokenStore = {};

// Google Auth endpoint
app.post('/api/auth/google', async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);

    // Store the refresh token
    const userId = 'user_' + Date.now(); // In production, use proper user identification
    tokenStore[userId] = tokens.refresh_token;

    res.json({
      success: true,
      userId,
      message: 'Authentication successful'
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({
      error: 'Authentication failed',
      details: error.message
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
});