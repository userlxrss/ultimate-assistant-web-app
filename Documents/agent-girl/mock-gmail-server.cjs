const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3012;

// Mock Gmail sessions storage
const gmailSessions = new Map();

// Auto-restore sessions on startup (for persistence)
if (typeof process !== 'undefined' && process.env) {
  console.log('🔐 Gmail server session storage initialized');
  console.log('💡 Gmail sessions will persist across server restarts');
}

// Mock email data for tuescalarina3@gmail.com
const mockEmails = [
  {
    id: '1',
    from: { name: 'GitHub', email: 'noreply@github.com' },
    to: [{ email: 'tuescalarina3@gmail.com' }],
    subject: '[GitHub] Your repository has a new star',
    date: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    isRead: false,
    isStarred: true,
    hasAttachments: false,
    snippet: 'Someone starred your repository dashboard-analytics. Check your analytics to see the impact.',
    body: 'Hi Larina,\n\nGood news! Someone starred your repository dashboard-analytics.\n\nRepository: dashboard-analytics\nStars: 42\n\nKeep up the great work!\n\n- The GitHub Team',
    labels: ['GitHub', 'Notifications']
  },
  {
    id: '2',
    from: { name: 'LinkedIn', email: 'notifications@linkedin.com' },
    to: [{ email: 'tuescalarina3@gmail.com' }],
    subject: 'You have 5 new profile views',
    date: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    isRead: false,
    isStarred: false,
    hasAttachments: false,
    snippet: 'Your profile is getting noticed! See who viewed your profile this week.',
    body: 'Hi Larina,\n\nYour profile is trending! You had 5 people view your profile in the last week.\n\nView your profile analytics to see more details.\n\n- LinkedIn Team',
    labels: ['Social', 'LinkedIn']
  },
  {
    id: '3',
    from: { name: 'Amazon', email: 'shipment-update@amazon.com' },
    to: [{ email: 'tuescalarina3@gmail.com' }],
    subject: 'Your package has been delivered',
    date: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
    isRead: true,
    isStarred: false,
    hasAttachments: true,
    snippet: 'Your package was delivered successfully. Leave a review to help others.',
    body: 'Your package #123-4567890 was delivered to your address.\n\nItems delivered:\n- Wireless Mouse\n- USB-C Cable\n\nPlease leave a review if you enjoyed your purchase.',
    labels: ['Shopping', 'Amazon']
  },
  {
    id: '4',
    from: { name: 'Netflix', email: 'info@netflix.com' },
    to: [{ email: 'tuescalarina3@gmail.com' }],
    subject: 'New episodes of your favorite show are available',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    isRead: true,
    isStarred: true,
    hasAttachments: false,
    snippet: 'The latest season of your show is now streaming. Don\'t miss out!',
    body: 'Hi Larina,\n\nGood news! New episodes of "Tech Innovators" are now available on Netflix.\n\nSeason 3, Episodes 1-6 are ready to watch.\n\nContinue watching now!',
    labels: ['Entertainment', 'Netflix']
  },
  {
    id: '5',
    from: { name: 'Google Drive', email: 'drive-shares-noreply@google.com' },
    to: [{ email: 'tuescalarina3@gmail.com' }],
    subject: 'John shared "Project Documents" with you',
    date: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
    isRead: false,
    isStarred: false,
    hasAttachments: true,
    snippet: 'John has shared a folder containing 3 files with you. View them in Google Drive.',
    body: 'Hi Larina,\n\nJohn shared the following folder with you:\n\nFolder: Project Documents\nFiles: 3\nSize: 15.2 MB\n\nOpen in Google Drive to view the files.',
    labels: ['Google Drive', 'Shared']
  },
  {
    id: '6',
    from: { name: 'Spotify', email: 'no-reply@spotify.com' },
    to: [{ email: 'tuescalarina3@gmail.com' }],
    subject: 'Your Discover Weekly is here',
    date: new Date(Date.now() - 1000 * 60 * 60 * 72), // 3 days ago
    isRead: true,
    isStarred: false,
    hasAttachments: false,
    snippet: '30 new songs picked just for you. Open Spotify to listen now.',
    body: 'Your Discover Weekly playlist is ready!\n\n30 new tracks based on your listening history.\n\nOpen Spotify to discover your next favorite song.',
    labels: ['Music', 'Spotify']
  },
  {
    id: '7',
    from: { name: 'Medium Daily Digest', email: 'digest@medium.com' },
    to: [{ email: 'tuescalarina3@gmail.com' }],
    subject: '3 stories we think you\'ll love',
    date: new Date(Date.now() - 1000 * 60 * 60 * 96), // 4 days ago
    isRead: true,
    isStarred: false,
    hasAttachments: false,
    snippet: 'Based on your reading history, here are today\'s top stories for you.',
    body: 'Today\'s top stories:\n\n1. "The Future of Web Development"\n2. "Building Scalable Applications"\n3. "AI in Software Development"\n\nRead more on Medium.',
    labels: ['Newsletter', 'Medium']
  },
  {
    id: '8',
    from: { name: 'Slack', email: 'notifications@slack.com' },
    to: [{ email: 'tuescalarina3@gmail.com' }],
    subject: 'You have 10 unread messages in #project-updates',
    date: new Date(Date.now() - 1000 * 60 * 60 * 120), // 5 days ago
    isRead: false,
    isStarred: false,
    hasAttachments: false,
    snippet: 'Catch up on the latest project updates from your team.',
    body: 'Hi Larina,\n\nYou have 10 unread messages in #project-updates channel.\n\nRecent messages include:\n- Design review meeting notes\n- Sprint planning updates\n- Code review requests\n\nOpen Slack to catch up.',
    labels: ['Work', 'Slack']
  }
];

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Mock Gmail API Server' });
});

// Mock Gmail authentication
app.post('/api/gmail/authenticate', (req, res) => {
  try {
    const { email, appPassword } = req.body;

    console.log('🔐 Mock Gmail authentication for:', email);

    // Validate email matches expected
    if (email === 'tuescalarina3@gmail.com' && appPassword.length === 16) {
      // Use a consistent session ID for persistence
      const sessionId = 'persistent_gmail_session_' + email.replace(/[^a-zA-Z0-9]/g, '_');

      gmailSessions.set(sessionId, {
        email,
        authenticated: true,
        createdAt: new Date()
      });

      console.log('✅ Mock Gmail session created/updated:', sessionId);

      res.json({
        sessionId,
        email,
        message: 'Gmail authenticated successfully (Mock)'
      });
    } else {
      res.status(401).json({
        message: 'Invalid email or app password (use tuescalarina3@gmail.com and 16-digit password)'
      });
    }
  } catch (error) {
    console.error('Mock authentication error:', error);
    res.status(500).json({
      message: 'Authentication failed: ' + error.message
    });
  }
});

// Get mock emails
app.get('/api/gmail/emails/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    const limit = parseInt(req.query.limit) || 50;

    let session = gmailSessions.get(sessionId);

    // Auto-recreate session for persistent users
    if (!session && sessionId === 'persistent_gmail_session_tuescalarina3_gmail_com') {
      console.log('🔄 Auto-recreating Gmail session for persistent user');
      session = {
        email: 'tuescalarina3@gmail.com',
        authenticated: true,
        createdAt: new Date()
      };
      gmailSessions.set(sessionId, session);
    }

    if (!session) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    console.log('📧 Returning mock emails for:', session.email);

    const limitedEmails = mockEmails.slice(0, limit);

    res.json({
      emails: limitedEmails,
      total: limitedEmails.length
    });

  } catch (error) {
    console.error('Error fetching mock emails:', error);
    res.status(500).json({
      error: 'Failed to fetch emails',
      message: error.message
    });
  }
});

// Mock send email
app.post('/api/gmail/send/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    const { to, subject, body } = req.body;

    const session = gmailSessions.get(sessionId);
    if (!session) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    console.log('📤 Mock sending email from:', session.email, 'to:', to);

    // Simulate email sending delay
    setTimeout(() => {
      console.log('✅ Mock email sent successfully');
    }, 1000);

    res.json({
      messageId: 'mock_' + Date.now(),
      message: 'Email sent successfully (Mock)'
    });

  } catch (error) {
    console.error('Error sending mock email:', error);
    res.status(500).json({
      error: 'Failed to send email',
      message: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`
🚀 Mock Gmail API Server is running!
📍 Server: http://localhost:${PORT}
🌐 Frontend: http://localhost:5173
📧 Gmail API: Mock Mode (for testing)
📅 Started: ${new Date().toISOString()}

📋 Mock Endpoints:
   POST /api/gmail/authenticate
   GET  /api/gmail/emails/:sessionId
   POST /api/gmail/send/:sessionId

💡 Use tuescalarina3@gmail.com with any 16-digit app password
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