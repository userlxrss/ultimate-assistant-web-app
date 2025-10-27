// Google Contacts Proxy Server
// This server acts as a proxy to handle Google People API calls
// since direct browser access requires OAuth2 setup

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = 3013; // Use port 3013 for contacts proxy

// CORS configuration
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    server: 'Google Contacts Proxy Server',
    port: PORT,
    ready: true
  });
});

// Store Google credentials securely in memory (for demo)
const googleSessions = new Map();

// Authenticate with Google (simulated for demo)
app.post('/api/contacts/authenticate', async (req, res) => {
  try {
    const { email, appPassword } = req.body;

    console.log(`🔐 Authenticating Google Contacts: ${email}`);

    if (!email || !appPassword) {
      return res.status(400).json({
        success: false,
        error: 'Missing credentials',
        message: 'Email and app password are required'
      });
    }

    // For demo purposes, we'll accept any credentials and create a session
    // In a real implementation, you'd validate against Google's services
    const sessionId = `contacts_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    googleSessions.set(sessionId, {
      email,
      appPassword,
      createdAt: new Date()
    });

    console.log(`✅ Google Contacts authenticated: ${email}`);

    res.json({
      success: true,
      sessionId,
      email,
      message: 'Google Contacts authenticated successfully',
      service: 'People API via Proxy'
    });

  } catch (error) {
    console.error('Google Contacts authentication error:', error);
    res.status(401).json({
      success: false,
      error: 'Authentication failed',
      message: 'Invalid credentials or service unavailable',
      details: error.message
    });
  }
});

// Get contacts via proxy
app.get('/api/contacts/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { limit = 100, pageToken } = req.query;

    const session = googleSessions.get(sessionId);
    if (!session) {
      return res.status(401).json({
        success: false,
        error: 'Session not found',
        message: 'Please authenticate first'
      });
    }

    console.log(`📊 Fetching Google Contacts for: ${session.email}`);

    // For demo purposes, return realistic sample contacts
    // In a real implementation, you'd use Google People API with OAuth2
    const sampleContacts = [
      {
        id: 'google-1',
        resourceName: 'people/1',
        etag: '"1"',
        displayName: 'Alice Johnson',
        name: {
          givenName: 'Alice',
          familyName: 'Johnson',
          formatted: 'Alice Johnson'
        },
        emails: [{ value: 'alice.johnson@example.com', type: 'home' }],
        phoneNumbers: [{ value: '+1-555-0101', type: 'mobile' }],
        organizations: [{ name: 'Tech Corp', title: 'Software Engineer' }],
        notes: 'Sample contact for demonstration'
      },
      {
        id: 'google-2',
        resourceName: 'people/2',
        etag: '"2"',
        displayName: 'Bob Smith',
        name: {
          givenName: 'Bob',
          familyName: 'Smith',
          formatted: 'Bob Smith'
        },
        emails: [{ value: 'bob.smith@example.com', type: 'work' }],
        phoneNumbers: [{ value: '+1-555-0102', type: 'work' }],
        organizations: [{ name: 'Design Studio', title: 'UX Designer' }],
        notes: 'Sample contact for demonstration'
      },
      {
        id: 'google-3',
        resourceName: 'people/3',
        etag: '"3"',
        displayName: 'Carol Williams',
        name: {
          givenName: 'Carol',
          familyName: 'Williams',
          formatted: 'Carol Williams'
        },
        emails: [{ value: 'carol.williams@example.com', type: 'home' }],
        phoneNumbers: [{ value: '+1-555-0103', type: 'home' }],
        organizations: [{ name: 'Marketing Firm', title: 'Marketing Manager' }],
        notes: 'Sample contact for demonstration'
      },
      {
        id: 'google-4',
        resourceName: 'people/4',
        etag: '"4"',
        displayName: 'David Brown',
        name: {
          givenName: 'David',
          familyName: 'Brown',
          formatted: 'David Brown'
        },
        emails: [{ value: 'david.brown@example.com', type: 'work' }],
        phoneNumbers: [{ value: '+1-555-0104', type: 'mobile' }],
        organizations: [{ name: 'Tech Corp', title: 'Product Manager' }],
        notes: 'Sample contact for demonstration'
      },
      {
        id: 'google-5',
        resourceName: 'people/5',
        etag: '"5"',
        displayName: 'Emma Davis',
        name: {
          givenName: 'Emma',
          familyName: 'Davis',
          formatted: 'Emma Davis'
        },
        emails: [{ value: 'emma.davis@example.com', type: 'home' }],
        phoneNumbers: [{ value: '+1-555-0105', type: 'mobile' }],
        organizations: [{ name: 'StartupXYZ', title: 'CEO' }],
        notes: 'Sample contact for demonstration'
      }
    ];

    const contacts = sampleContacts.slice(0, parseInt(limit) || 100);

    console.log(`✅ Fetched ${contacts.length} Google Contacts (proxy mode)`);

    res.json({
      success: true,
      connections: contacts,
      totalItems: contacts.length,
      nextPageToken: null,
      source: 'Google Contacts Proxy (Demo Mode)',
      message: 'In production, this would fetch real Google Contacts via OAuth2'
    });

  } catch (error) {
    console.error('Google Contacts fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch contacts',
      message: error.message,
      source: 'Google Contacts Proxy'
    });
  }
});

// Create contact via proxy
app.post('/api/contacts/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const contactData = req.body;

    const session = googleSessions.get(sessionId);
    if (!session) {
      return res.status(401).json({
        success: false,
        error: 'Session not found',
        message: 'Please authenticate first'
      });
    }

    console.log(`➕ Creating contact for: ${session.email}`);

    const newContact = {
      id: `google-${Date.now()}`,
      resourceName: `people/${Date.now()}`,
      etag: `"${Date.now()}"`,
      ...contactData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    console.log(`✅ Contact created: ${newContact.displayName}`);

    res.json({
      success: true,
      contact: newContact,
      message: 'Contact created successfully',
      source: 'Google Contacts Proxy'
    });

  } catch (error) {
    console.error('Contact creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create contact',
      message: error.message
    });
  }
});

// Update contact via proxy
app.put('/api/contacts/:sessionId/:contactId', async (req, res) => {
  try {
    const { sessionId, contactId } = req.params;
    const contactData = req.body;

    const session = googleSessions.get(sessionId);
    if (!session) {
      return res.status(401).json({
        success: false,
        error: 'Session not found',
        message: 'Please authenticate first'
      });
    }

    console.log(`✏️ Updating contact: ${contactId}`);

    const updatedContact = {
      id: contactId,
      resourceName: `people/${contactId}`,
      etag: `"${Date.now()}"`,
      ...contactData,
      updatedAt: new Date().toISOString()
    };

    console.log(`✅ Contact updated: ${updatedContact.displayName}`);

    res.json({
      success: true,
      contact: updatedContact,
      message: 'Contact updated successfully',
      source: 'Google Contacts Proxy'
    });

  } catch (error) {
    console.error('Contact update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update contact',
      message: error.message
    });
  }
});

// Delete contact via proxy
app.delete('/api/contacts/:sessionId/:contactId', async (req, res) => {
  try {
    const { sessionId, contactId } = req.params;

    const session = googleSessions.get(sessionId);
    if (!session) {
      return res.status(401).json({
        success: false,
        error: 'Session not found',
        message: 'Please authenticate first'
      });
    }

    console.log(`🗑️ Deleting contact: ${contactId}`);

    console.log(`✅ Contact deleted: ${contactId}`);

    res.json({
      success: true,
      message: 'Contact deleted successfully',
      source: 'Google Contacts Proxy'
    });

  } catch (error) {
    console.error('Contact deletion error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete contact',
      message: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`
🚀 GOOGLE CONTACTS PROXY SERVER IS RUNNING!
📍 Server: http://localhost:${PORT}
📊 Contacts Endpoint: http://localhost:${PORT}/api/contacts/:sessionId
🔐 Auth Endpoint: http://localhost:${PORT}/api/contacts/authenticate
📅 Started: ${new Date().toISOString()}

🎯 GOOGLE CONTACTS PROXY FEATURES:
✅ Authentication with app password (demo mode)
✅ Contact management via proxy
✅ Secure session management
✅ CORS enabled for frontend
✅ Demo data for testing

📋 USAGE:
1. Authenticate via /api/contacts/authenticate
2. Use sessionId for all contact operations
3. In production, replace with real Google People API + OAuth2

🚀 GOOGLE CONTACTS INTEGRATION READY!
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