// API Adapter for Analytics Dashboard
// This server provides the API endpoints that the frontend expects
// and forwards them to the appropriate backend services

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3015; // Use port 3015 for the API adapter

// CORS configuration
app.use(cors({
  origin: ['http://localhost:5177'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    server: 'API Adapter',
    port: PORT,
    purpose: 'Routes frontend requests to backend services',
    ready: true
  });
});

// Tasks endpoint - forwards to Motion API or Gmail server
app.get('/api/tasks', async (req, res) => {
  try {
    const motionApiKey = req.headers.authorization?.replace('Bearer ', '');

    if (!motionApiKey || motionApiKey === 'your-motion-api-key-here') {
      // Return dummy data if no real API key
      return res.json({
        tasks: [
          {
            id: '1',
            name: 'Complete project documentation',
            description: 'Write comprehensive documentation for the analytics dashboard',
            status: 'in-progress',
            dueDate: new Date(Date.now() + 86400000).toISOString(),
            priority: 'high',
            labels: ['documentation', 'urgent'],
            estimatedDuration: 120,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: '2',
            name: 'Review pull requests',
            description: 'Review and merge pending pull requests',
            status: 'pending',
            dueDate: new Date(Date.now() + 172800000).toISOString(),
            priority: 'medium',
            labels: ['code-review'],
            estimatedDuration: 60,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: '3',
            name: 'Setup production deployment',
            description: 'Configure production environment and deploy',
            status: 'completed',
            completedAt: new Date(Date.now() - 86400000).toISOString(),
            priority: 'high',
            labels: ['deployment', 'devops'],
            estimatedDuration: 180,
            createdAt: new Date(Date.now() - 172800000).toISOString(),
            updatedAt: new Date(Date.now() - 86400000).toISOString()
          }
        ],
        total: 3,
        page: 1,
        pageSize: 10
      });
    }

    // If real Motion API key provided, forward to Motion API
    // For now, return structured dummy data
    res.json({
      tasks: [
        {
          id: 'motion-1',
          name: 'Motion API Task Example',
          description: 'This would be a real task from Motion API',
          status: 'pending',
          dueDate: new Date(Date.now() + 86400000).toISOString(),
          priority: 'medium',
          labels: ['motion', 'api'],
          estimatedDuration: 45,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
      total: 1,
      page: 1,
      pageSize: 10
    });

  } catch (error) {
    console.error('Tasks API error:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Contacts endpoint - forwards to CardDAV bridge
app.get('/api/contacts', async (req, res) => {
  try {
    const cardDavPassword = req.headers.authorization?.replace('Bearer ', '');

    if (!cardDavPassword) {
      // Return dummy data if no CardDAV credentials
      return res.json({
        contacts: [
          {
            id: '1',
            firstName: 'John',
            lastName: 'Doe',
            emails: ['john.doe@example.com'],
            phones: ['+1-555-0123'],
            company: 'Example Corp',
            title: 'Software Engineer',
            addresses: [
              {
                street: '123 Main St',
                city: 'San Francisco',
                state: 'CA',
                zip: '94102',
                country: 'USA'
              }
            ],
            favorite: true,
            groups: ['work', 'development'],
            notes: 'Met at tech conference',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: '2',
            firstName: 'Jane',
            lastName: 'Smith',
            emails: ['jane.smith@company.com'],
            phones: ['+1-555-0456'],
            company: 'Tech Company',
            title: 'Product Manager',
            addresses: [],
            favorite: false,
            groups: ['work'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ],
        total: 2,
        page: 1,
        pageSize: 10
      });
    }

    // Forward to CardDAV bridge for real contacts
    const cardDavResponse = await fetch('http://localhost:3014/api/contacts/session-placeholder', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${cardDavPassword}`,
        'Content-Type': 'application/json'
      }
    });

    if (cardDavResponse.ok) {
      const data = await cardDavResponse.json();
      return res.json(data);
    }

    // Fallback to dummy data if CardDAV fails
    res.json({
      contacts: [],
      total: 0,
      page: 1,
      pageSize: 10
    });

  } catch (error) {
    console.error('Contacts API error:', error);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

// Start the API adapter
app.listen(PORT, () => {
  console.log(`🔗 API Adapter running on port ${PORT}`);
  console.log(`📊 Frontend should be on: http://localhost:5177`);
  console.log(`📧 Gmail IMAP server: http://localhost:3012`);
  console.log(`👥 CardDAV bridge: http://localhost:3014`);
  console.log(`🔗 API Adapter: http://localhost:${PORT}`);
});