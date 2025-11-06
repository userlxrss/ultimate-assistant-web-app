const express = require('express');
const { google } = require('googleapis');
const router = express.Router();

// Get Gmail API instance with authenticated user
const getGmailService = async (req, res) => {
  try {
    if (!req.session.userId) {
      throw new Error('User not authenticated');
    }

    // Get tokens from database (this would be a real database in production)
    const { DatabaseService } = require('../real-oauth-server');
    const tokenData = DatabaseService.getServiceTokens(req.session.userId, 'google');

    if (!tokenData) {
      throw new Error('No Google tokens found');
    }

    // Check if token needs refresh
    const tokens = await DatabaseService.refreshTokenIfExpired(req.session.userId, 'google');

    if (!tokens) {
      throw new Error('Failed to refresh token');
    }

    // Create OAuth2 client and set credentials
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.REDIRECT_URI
    );

    oauth2Client.setCredentials(tokens);

    return google.gmail({ version: 'v1', auth: oauth2Client });
  } catch (error) {
    console.error('Error getting Gmail service:', error);
    throw error;
  }
};

// Get Gmail profile
router.get('/profile', async (req, res) => {
  try {
    const gmail = await getGmailService(req, res);
    const response = await gmail.users.getProfile({ userId: 'me' });

    res.json({
      success: true,
      profile: response.data
    });
  } catch (error) {
    console.error('Gmail profile error:', error);
    res.status(500).json({
      error: 'Failed to get Gmail profile',
      message: error.message
    });
  }
});

// Get list of emails
router.get('/messages', async (req, res) => {
  try {
    const { maxResults = 10, pageToken } = req.query;
    const gmail = await getGmailService(req, res);

    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults: parseInt(maxResults),
      pageToken: pageToken,
      labelIds: ['INBOX'] // Only get inbox messages
    });

    res.json({
      success: true,
      messages: response.data.messages || [],
      nextPageToken: response.data.nextPageToken,
      resultSizeEstimate: response.data.resultSizeEstimate
    });
  } catch (error) {
    console.error('Gmail messages list error:', error);
    res.status(500).json({
      error: 'Failed to get messages',
      message: error.message
    });
  }
});

// Get full email details
router.get('/messages/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    const gmail = await getGmailService(req, res);

    const response = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full' // Get full message including headers and body
    });

    res.json({
      success: true,
      message: response.data
    });
  } catch (error) {
    console.error('Gmail message get error:', error);
    res.status(500).json({
      error: 'Failed to get message',
      message: error.message
    });
  }
});

// Send email
router.post('/send', async (req, res) => {
  try {
    const { to, subject, body, isHtml = false } = req.body;

    if (!to || !subject || !body) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'to, subject, and body are required'
      });
    }

    const gmail = await getGmailService(req, res);

    // Create email message
    const email = [
      `To: ${to}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      `Content-Type: ${isHtml ? 'text/html' : 'text/plain'}; charset=utf-8`,
      '',
      body
    ].join('\n');

    // Encode message in base64url format
    const encodedMessage = Buffer.from(email)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage
      }
    });

    console.log(`📧 Email sent successfully to ${to}`);

    res.json({
      success: true,
      message: 'Email sent successfully',
      messageId: response.data.id
    });
  } catch (error) {
    console.error('Gmail send error:', error);
    res.status(500).json({
      error: 'Failed to send email',
      message: error.message
    });
  }
});

// Get unread emails count
router.get('/unread-count', async (req, res) => {
  try {
    const gmail = await getGmailService(req, res);

    const response = await gmail.users.messages.list({
      userId: 'me',
      labelIds: ['UNREAD'],
      maxResults: 1 // We only need the count
    });

    res.json({
      success: true,
      unreadCount: response.data.resultSizeEstimate || 0
    });
  } catch (error) {
    console.error('Gmail unread count error:', error);
    res.status(500).json({
      error: 'Failed to get unread count',
      message: error.message
    });
  }
});

// Mark email as read
router.post('/messages/:messageId/read', async (req, res) => {
  try {
    const { messageId } = req.params;
    const gmail = await getGmailService(req, res);

    await gmail.users.messages.modify({
      userId: 'me',
      id: messageId,
      requestBody: {
        removeLabelIds: ['UNREAD']
      }
    });

    res.json({
      success: true,
      message: 'Email marked as read'
    });
  } catch (error) {
    console.error('Gmail mark as read error:', error);
    res.status(500).json({
      error: 'Failed to mark email as read',
      message: error.message
    });
  }
});

// Delete email
router.delete('/messages/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    const gmail = await getGmailService(req, res);

    await gmail.users.messages.trash({
      userId: 'me',
      id: messageId
    });

    res.json({
      success: true,
      message: 'Email moved to trash'
    });
  } catch (error) {
    console.error('Gmail delete error:', error);
    res.status(500).json({
      error: 'Failed to delete email',
      message: error.message
    });
  }
});

// Get email threads
router.get('/threads', async (req, res) => {
  try {
    const { maxResults = 10, pageToken } = req.query;
    const gmail = await getGmailService(req, res);

    const response = await gmail.users.threads.list({
      userId: 'me',
      maxResults: parseInt(maxResults),
      pageToken: pageToken
    });

    res.json({
      success: true,
      threads: response.data.threads || [],
      nextPageToken: response.data.nextPageToken,
      resultSizeEstimate: response.data.resultSizeEstimate
    });
  } catch (error) {
    console.error('Gmail threads error:', error);
    res.status(500).json({
      error: 'Failed to get threads',
      message: error.message
    });
  }
});

module.exports = router;