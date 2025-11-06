const express = require('express');
const { google } = require('googleapis');
const router = express.Router();

// Middleware to check Google authentication
const requireGoogleAuth = (req, res, next) => {
  if (!req.session.googleTokens) {
    return res.status(401).json({
      error: 'Google not authenticated',
      message: 'Please connect your Google account first'
    });
  }
  next();
};

// Helper function to get authenticated Google client
const getGoogleClient = (tokens) => {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials(tokens);
  return oauth2Client;
};

// Helper function to refresh token if needed
const ensureValidToken = async (req, res, next) => {
  try {
    const tokens = req.session.googleTokens;
    const oauth2Client = getGoogleClient(tokens);

    // Check if token is expired
    if (tokens.expiry_date && Date.now() >= tokens.expiry_date) {
      if (tokens.refresh_token) {
        // Refresh the token
        const { credentials } = await oauth2Client.refreshAccessToken();
        req.session.googleTokens = { ...tokens, ...credentials };
        oauth2Client.setCredentials(credentials);
      } else {
        return res.status(401).json({
          error: 'Token expired',
          message: 'Please reconnect your Google account'
        });
      }
    }

    req.googleClient = oauth2Client;
    next();
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({
      error: 'Token refresh failed',
      message: 'Please reconnect your Google account'
    });
  }
};

// Apply authentication middleware to all routes
router.use(requireGoogleAuth, ensureValidToken);

// Gmail endpoints
router.get('/gmail/profile', async (req, res) => {
  try {
    const gmail = google.gmail({ version: 'v1', auth: req.googleClient });
    const response = await gmail.users.getProfile({ userId: 'me' });

    res.json({
      emailAddress: response.data.emailAddress,
      messagesTotal: response.data.messagesTotal,
      threadsTotal: response.data.threadsTotal,
      historyId: response.data.historyId
    });
  } catch (error) {
    console.error('Gmail profile error:', error);
    res.status(500).json({ error: 'Failed to fetch Gmail profile' });
  }
});

router.get('/gmail/messages', async (req, res) => {
  try {
    const {
      maxResults = 50,
      pageToken,
      q = '',
      labelIds = []
    } = req.query;

    const gmail = google.gmail({ version: 'v1', auth: req.googleClient });

    const params = {
      userId: 'me',
      maxResults: parseInt(maxResults),
      q
    };

    if (pageToken) params.pageToken = pageToken;
    if (labelIds.length > 0) params.labelIds = Array.isArray(labelIds) ? labelIds : [labelIds];

    const response = await gmail.users.messages.list(params);

    // Fetch full message details for each message
    if (response.data.messages) {
      const messages = await Promise.all(
        response.data.messages.map(async (msg) => {
          const fullMessage = await gmail.users.messages.get({
            userId: 'me',
            id: msg.id,
            format: 'full'
          });
          return parseGmailMessage(fullMessage.data);
        })
      );

      res.json({
        messages,
        nextPageToken: response.data.nextPageToken,
        resultSizeEstimate: response.data.resultSizeEstimate
      });
    } else {
      res.json({
        messages: [],
        resultSizeEstimate: response.data.resultSizeEstimate || 0
      });
    }
  } catch (error) {
    console.error('Gmail messages error:', error);
    res.status(500).json({ error: 'Failed to fetch Gmail messages' });
  }
});

router.get('/gmail/messages/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const gmail = google.gmail({ version: 'v1', auth: req.googleClient });

    const response = await gmail.users.messages.get({
      userId: 'me',
      id: id,
      format: 'full'
    });

    res.json(parseGmailMessage(response.data));
  } catch (error) {
    console.error('Gmail message error:', error);
    res.status(500).json({ error: 'Failed to fetch Gmail message' });
  }
});

router.post('/gmail/messages/:id/modify', async (req, res) => {
  try {
    const { id } = req.params;
    const { addLabelIds, removeLabelIds } = req.body;

    const gmail = google.gmail({ version: 'v1', auth: req.googleClient });

    const response = await gmail.users.messages.modify({
      userId: 'me',
      id: id,
      requestBody: {
        addLabelIds: addLabelIds || [],
        removeLabelIds: removeLabelIds || []
      }
    });

    res.json(parseGmailMessage(response.data));
  } catch (error) {
    console.error('Gmail modify error:', error);
    res.status(500).json({ error: 'Failed to modify Gmail message' });
  }
});

router.post('/gmail/send', async (req, res) => {
  try {
    const { to, subject, body, cc, bcc } = req.body;

    const gmail = google.gmail({ version: 'v1', auth: req.googleClient });

    // Create email message
    const email = [
      `To: ${Array.isArray(to) ? to.join(', ') : to}`,
      cc && `Cc: ${Array.isArray(cc) ? cc.join(', ') : cc}`,
      bcc && `Bcc: ${Array.isArray(bcc) ? bcc.join(', ') : bcc}`,
      `Subject: ${subject}`,
      '',
      body
    ].filter(Boolean).join('\n');

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

    res.json({
      success: true,
      messageId: response.data.id,
      threadId: response.data.threadId
    });
  } catch (error) {
    console.error('Gmail send error:', error);
    res.status(500).json({ error: 'Failed to send Gmail message' });
  }
});

// Calendar endpoints
router.get('/calendar/calendars', async (req, res) => {
  try {
    const calendar = google.calendar({ version: 'v3', auth: req.googleClient });

    const response = await calendar.calendarList.list({
      minAccessRole: 'writer'
    });

    res.json(response.data.items);
  } catch (error) {
    console.error('Calendar list error:', error);
    res.status(500).json({ error: 'Failed to fetch calendar list' });
  }
});

router.get('/calendar/events', async (req, res) => {
  try {
    const {
      calendarId = 'primary',
      timeMin,
      timeMax,
      maxResults = 50,
      singleEvents = true,
      orderBy = 'startTime'
    } = req.query;

    const calendar = google.calendar({ version: 'v3', auth: req.googleClient });

    const params = {
      calendarId,
      maxResults: parseInt(maxResults),
      singleEvents: singleEvents === 'true',
      orderBy
    };

    if (timeMin) params.timeMin = timeMin;
    if (timeMax) params.timeMax = timeMax;

    const response = await calendar.events.list(params);

    res.json({
      events: response.data.items,
      nextPageToken: response.data.nextPageToken,
      timeZone: response.data.timeZone
    });
  } catch (error) {
    console.error('Calendar events error:', error);
    res.status(500).json({ error: 'Failed to fetch calendar events' });
  }
});

router.post('/calendar/events', async (req, res) => {
  try {
    const { calendarId = 'primary', event } = req.body;

    const calendar = google.calendar({ version: 'v3', auth: req.googleClient });

    const response = await calendar.events.insert({
      calendarId,
      requestBody: event
    });

    res.json(response.data);
  } catch (error) {
    console.error('Calendar create error:', error);
    res.status(500).json({ error: 'Failed to create calendar event' });
  }
});

// Contacts endpoints
router.get('/contacts/connections', async (req, res) => {
  try {
    const { maxResults = 50, pageToken } = req.query;

    const people = google.people({ version: 'v1', auth: req.googleClient });

    const params = {
      resourceName: 'people/me',
      personFields: 'names,emailAddresses,phoneNumbers,organizations,photos',
      pageSize: parseInt(maxResults)
    };

    if (pageToken) params.pageToken = pageToken;

    const response = await people.people.connections.list(params);

    res.json({
      connections: response.data.connections,
      nextPageToken: response.data.nextPageToken,
      totalItems: response.data.totalItems
    });
  } catch (error) {
    console.error('Contacts error:', error);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

// Helper function to parse Gmail messages
function parseGmailMessage(message) {
  const headers = message.payload.headers;
  const getHeader = (name) => {
    const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
    return header ? header.value : '';
  };

  const parseEmailAddresses = (headerValue) => {
    if (!headerValue) return [];
    return headerValue.split(',').map(addr => {
      const match = addr.trim().match(/^(.*?)\s*<(.+?)>$/) || [, '', addr.trim()];
      return {
        name: match[1]?.replace(/"/g, '').trim() || '',
        email: match[2] || addr.trim(),
      };
    });
  };

  const extractBody = (payload) => {
    if (payload.body?.data) {
      return Buffer.from(payload.body.data, 'base64url').toString('utf-8');
    }

    if (payload.parts) {
      const textPart = payload.parts.find(part => part.mimeType === 'text/plain');
      if (textPart?.body?.data) {
        return Buffer.from(textPart.body.data, 'base64url').toString('utf-8');
      }

      const htmlPart = payload.parts.find(part => part.mimeType === 'text/html');
      if (htmlPart?.body?.data) {
        return Buffer.from(htmlPart.body.data, 'base64url').toString('utf-8');
      }
    }

    return '';
  };

  const extractAttachments = (payload) => {
    const attachments = [];

    if (payload.parts) {
      payload.parts.forEach(part => {
        if (part.filename && part.body?.attachmentId) {
          attachments.push({
            id: part.body.attachmentId,
            filename: part.filename,
            mimeType: part.mimeType,
            size: part.body.size || 0,
          });
        }

        if (part.parts) {
          attachments.push(...extractAttachments(part));
        }
      });
    }

    return attachments;
  };

  const attachments = extractAttachments(message.payload);

  return {
    id: message.id,
    threadId: message.threadId,
    subject: getHeader('Subject') || '(No subject)',
    snippet: message.snippet || '',
    body: extractBody(message.payload),
    from: parseEmailAddresses(getHeader('From'))[0] || { email: 'unknown@example.com' },
    to: parseEmailAddresses(getHeader('To')),
    cc: parseEmailAddresses(getHeader('Cc')),
    bcc: parseEmailAddresses(getHeader('Bcc')),
    date: new Date(parseInt(message.internalDate)),
    isRead: !message.labelIds?.includes('UNREAD'),
    isStarred: message.labelIds?.includes('STARRED') || false,
    isImportant: message.labelIds?.includes('IMPORTANT') || false,
    labels: message.labelIds || [],
    attachments,
    hasAttachments: attachments.length > 0,
    folder: determineFolder(message.labelIds || []),
  };
}

function determineFolder(labelIds) {
  if (labelIds.includes('INBOX')) return 'inbox';
  if (labelIds.includes('SENT')) return 'sent';
  if (labelIds.includes('DRAFT')) return 'drafts';
  if (labelIds.includes('SPAM')) return 'spam';
  if (labelIds.includes('TRASH')) return 'trash';
  if (labelIds.includes('IMPORTANT')) return 'important';
  return 'inbox';
}

module.exports = router;