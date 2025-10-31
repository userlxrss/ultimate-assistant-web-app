require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const MemoryStore = require('memorystore')(session);
const nodemailer = require('nodemailer');
const Imap = require('imap');
const { simpleParser } = require('mailparser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3012; // FIXED: Use port 3012 consistently

// Persistent session storage
const SESSIONS_FILE = path.join(__dirname, 'gmail-sessions.json');

// Load existing sessions from file
let gmailSessions = new Map();
try {
  if (fs.existsSync(SESSIONS_FILE)) {
    const sessionsData = JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf8'));
    gmailSessions = new Map(Object.entries(sessionsData));
    console.log(`📧 Loaded ${gmailSessions.size} persistent Gmail sessions`);

    // Validate and log each loaded session
    for (const [sessionId, session] of gmailSessions.entries()) {
      console.log(`📧 Session loaded: ${sessionId} -> ${session.email}`);
    }
  }
} catch (error) {
  console.log('⚠️ Could not load Gmail sessions file, starting fresh');
}

// Save sessions to file
function saveSessions() {
  try {
    const sessionsData = Object.fromEntries(gmailSessions);
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessionsData, null, 2));
    console.log(`💾 Saved ${gmailSessions.size} Gmail sessions to file`);
  } catch (error) {
    console.error('❌ Failed to save Gmail sessions:', error);
  }
}

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5180', 'http://localhost:5200'],
  credentials: true
}));

app.use(express.json());
app.use(session({
  store: new MemoryStore({ checkPeriod: 86400000 }),
  secret: 'gmail-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Gmail IMAP Server',
    port: PORT,
    activeSessions: gmailSessions.size,
    sessions: Array.from(gmailSessions.keys())
  });
});

// Debug endpoint for session troubleshooting
app.get('/debug/sessions', (req, res) => {
  const sessionsInfo = {};
  for (const [sessionId, session] of gmailSessions.entries()) {
    sessionsInfo[sessionId] = {
      email: session.email,
      createdAt: session.createdAt,
      hasPassword: !!session.appPassword
    };
  }
  res.json({
    totalSessions: gmailSessions.size,
    sessions: sessionsInfo
  });
});

// Parse email address helper
function parseAddress(addr) {
  const match = addr.match(/^(?:"?([^"]*)"?\s)?(?:<?(.+@[^>]+)>?)/);
  return match ? {
    name: match[1] || '',
    email: match[2] || ''
  } : { email: addr, name: '' };
}

// Enhanced IMAP configuration with better error handling
function getImapConfig(email, appPassword) {
  return {
    user: email,
    password: appPassword,
    host: 'imap.gmail.com',
    port: 993,
    tls: true,
    tlsOptions: {
      rejectUnauthorized: false,
      servername: 'imap.gmail.com'
    },
    connTimeout: 60000, // 60 seconds connection timeout
    authTimeout: 30000, // 30 seconds auth timeout
    keepalive: {
      interval: 10000, // 10 seconds
      idleInterval: 300000, // 5 minutes
      forceNoop: true
    }
  };
}

// Decode base64url content with proper error handling
function decodeBase64UrlContent(encodedContent) {
  if (!encodedContent) return '';

  try {
    // Replace base64url-specific characters and decode
    const normalized = encodedContent.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = Buffer.from(normalized, 'base64').toString('utf8');
    return decoded;
  } catch (error) {
    console.error('❌ Error decoding base64url content:', error);
    return encodedContent; // Return original if decoding fails
  }
}

// Enhanced email content extraction with multiple fallbacks
function extractEmailContent(parsed, buffer) {
  let content = {
    text: '',
    html: '',
    snippet: ''
  };

  try {
    // Primary: Use parsed content from mailparser
    if (parsed) {
      content.text = parsed.text || '';
      content.html = parsed.html || '';
      content.snippet = parsed.text ? parsed.text.substring(0, 150) + '...' : 'No preview available';

      console.log('📧 Using parsed content:', {
        hasText: !!content.text,
        hasHtml: !!content.html,
        textLength: content.text.length,
        htmlLength: content.html.length
      });

      // If we have good content, return it
      if (content.text.length > 10 || content.html.length > 10) {
        return content;
      }
    }

    // Fallback 1: Try to extract from raw buffer
    if (buffer && buffer.length > 0) {
      const rawContent = buffer.toString('utf8');

      // Look for common email content patterns
      const textMatch = rawContent.match(/Content-Type: text\/plain;.*?\r?\n\r?\n([\s\S]*?)(?=\r?\n--|\r?\nContent-Type:|$)/i);
      const htmlMatch = rawContent.match(/Content-Type: text\/html;.*?\r?\n\r?\n([\s\S]*?)(?=\r?\n--|\r?\nContent-Type:|$)/i);

      if (textMatch && textMatch[1]) {
        // Decode if it looks like base64
        let decodedText = textMatch[1].trim();
        if (decodedText.length > 50 && /^[A-Za-z0-9+/=]+$/.test(decodedText)) {
          decodedText = decodeBase64UrlContent(decodedText);
        }
        content.text = decodedText;
        content.snippet = decodedText.substring(0, 150) + '...';
        console.log('📧 Extracted text from raw buffer');
      }

      if (htmlMatch && htmlMatch[1]) {
        let decodedHtml = htmlMatch[1].trim();
        if (decodedHtml.length > 50 && /^[A-Za-z0-9+/=]+$/.test(decodedHtml)) {
          decodedHtml = decodeBase64UrlContent(decodedHtml);
        }
        content.html = decodedHtml;
        console.log('📧 Extracted HTML from raw buffer');
      }
    }

    // Fallback 2: Create meaningful content from headers
    if (!content.text && !content.html) {
      content.text = 'This email appears to be empty or contains content that could not be parsed. This might happen with emails that only contain attachments or have special formatting.';
      content.snippet = 'Email content could not be parsed.';
      console.log('📧 Using fallback content');
    }

    return content;
  } catch (error) {
    console.error('❌ Error extracting email content:', error);
    return {
      text: 'Email content could not be parsed due to an error.',
      html: '',
      snippet: 'Email content could not be parsed.'
    };
  }
}

// Gmail authentication with enhanced error handling
app.post('/api/gmail/authenticate', async (req, res) => {
  try {
    const { email, appPassword } = req.body;

    console.log('🔐 Gmail authentication attempt for:', email);

    // Validate inputs
    if (!email || !appPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email and App Password are required'
      });
    }

    if (!email.includes('@gmail.com')) {
      return res.status(400).json({
        success: false,
        message: 'Please use a valid Gmail address (@gmail.com)'
      });
    }

    // Test IMAP connection with enhanced error handling
    const imapConfig = getImapConfig(email, appPassword);
    const imap = new Imap(imapConfig);

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        imap.end();
        reject(new Error('Connection timeout. Please check your network and try again.'));
      }, 30000); // 30 second timeout

      imap.once('ready', () => {
        clearTimeout(timeout);
        console.log('✅ IMAP connection successful');
        imap.end();
        resolve();
      });

      imap.once('error', (err) => {
        clearTimeout(timeout);
        console.error('❌ IMAP connection failed:', err);

        // Provide specific error messages
        if (err.message.includes('Invalid credentials') || err.message.includes('Authentication failed')) {
          reject(new Error('Invalid email or App Password. Please check your credentials and ensure IMAP is enabled in Gmail settings.'));
        } else if (err.message.includes('Too many simultaneous connections')) {
          reject(new Error('Too many Gmail connections. Please wait a few minutes and try again.'));
        } else if (err.message.includes('timeout')) {
          reject(new Error('Connection timeout. Please check your internet connection.'));
        } else {
          reject(new Error(`Gmail connection error: ${err.message}`));
        }
      });

      try {
        imap.connect();
      } catch (connectErr) {
        clearTimeout(timeout);
        reject(new Error(`Failed to connect to Gmail: ${connectErr.message}`));
      }
    });

    // Generate persistent session ID
    const sessionId = 'persistent_gmail_session_' + email.replace(/[@.]/g, '_');

    // Store session
    gmailSessions.set(sessionId, {
      email,
      appPassword,
      createdAt: new Date(),
      lastUsed: new Date()
    });

    // Save to file for persistence
    saveSessions();

    console.log('✅ Gmail session created:', sessionId);

    res.json({
      success: true,
      sessionId,
      email,
      message: 'Gmail authenticated successfully'
    });

  } catch (error) {
    console.error('Gmail authentication error:', error);
    res.status(401).json({
      success: false,
      message: error.message || 'Authentication failed. Please check your credentials and try again.'
    });
  }
});

// Get emails with ENHANCED content fetching and parsing
app.get('/api/gmail/emails/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const limit = parseInt(req.query.limit) || 50;

    const session = gmailSessions.get(sessionId);
    if (!session) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired session. Please authenticate again.'
      });
    }

    console.log('📧 Fetching emails for:', session.email);

    // Update last used time
    session.lastUsed = new Date();

    const imapConfig = getImapConfig(session.email, session.appPassword);
    const imap = new Imap(imapConfig);
    const emails = [];

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        imap.end();
        reject(new Error('Email fetch timeout. Please try again.'));
      }, 45000); // 45 second timeout

      imap.once('ready', () => {
        clearTimeout(timeout);

        imap.openBox('INBOX', false, (err, box) => {
          if (err) {
            console.error('❌ Failed to open INBOX:', err);
            return reject(new Error('Failed to access Gmail inbox. Please check your permissions.'));
          }

          console.log(`📧 INBOX opened: ${box.messages.total} messages total`);

          // Fetch recent emails with FULL content - ENHANCED
          const fetchLimit = Math.min(20, limit);
          const startSeq = Math.max(1, box.messages.total - fetchLimit + 1);

          console.log(`📧 Fetching messages ${startSeq} to ${box.messages.total} with FULL content`);

          // CRITICAL FIX: Fetch full message content, not just headers
          const fetch = imap.seq.fetch(`${startSeq}:*`, {
            bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE MESSAGE-ID)', '1', '1.MIME', '1.TEXT', '2.TEXT', '3.TEXT', '4.TEXT', '5.TEXT'],
            struct: true,
            envelope: true
          });

          let processedCount = 0;

          fetch.on('message', (msg, seqno) => {
            console.log(`📧 Processing message ${seqno}`);
            const email = { id: seqno.toString() };
            let messageBuffer = Buffer.alloc(0);
            let fullBuffer = Buffer.alloc(0);

            msg.on('body', (stream, info) => {
              let buffer = Buffer.alloc(0);

              stream.on('data', (chunk) => {
                buffer = Buffer.concat([buffer, chunk]);
                fullBuffer = Buffer.concat([fullBuffer, chunk]);
              });

              stream.once('end', async () => {
                try {
                  console.log(`📧 Received message part ${info.which}, size: ${buffer.length} bytes`);

                  // ENHANCED: Parse full email content with comprehensive logging
                  console.log('📧 Attempting to parse email content...');
                  const parsed = await simpleParser(fullBuffer);

                  console.log('📧 Email parsing successful:', {
                    hasText: !!parsed.text,
                    hasHtml: !!parsed.html,
                    hasSubject: !!parsed.subject,
                    hasFrom: !!parsed.from,
                    textLength: parsed.text ? parsed.text.length : 0,
                    htmlLength: parsed.html ? parsed.html.length : 0,
                    attachmentsCount: parsed.attachments ? parsed.attachments.length : 0
                  });

                  // ENHANCED: Extract email content with multiple fallbacks
                  const content = extractEmailContent(parsed, fullBuffer);

                  console.log('📧 Content extraction result:', {
                    hasText: !!content.text,
                    hasHtml: !!content.html,
                    snippetLength: content.snippet.length
                  });

                  // Extract email data with ENHANCED content handling
                  email.from = parsed.from ? {
                    name: parsed.from.name || parsed.from.value[0]?.name || '',
                    email: parsed.from.value[0]?.address || ''
                  } : null;

                  email.to = parsed.to && parsed.to.length > 0 ? [{
                    name: parsed.to[0]?.name || '',
                    email: parsed.to[0]?.value?.[0]?.address || ''
                  }] : [];

                  email.subject = parsed.subject || '(No subject)';
                  email.date = parsed.date || new Date();

                  // CRITICAL FIX: Use extracted content
                  email.body = content.text;
                  email.html = content.html;
                  email.snippet = content.snippet;

                  console.log(`📧 Email content processed:`, {
                    subject: email.subject.substring(0, 50),
                    bodyLength: email.body.length,
                    htmlLength: email.html ? email.html.length : 0,
                    snippetLength: email.snippet.length
                  });

                  email.isRead = false; // Will be updated by attributes
                  email.isStarred = false; // Will be updated by attributes
                  email.hasAttachments = parsed.attachments && parsed.attachments.length > 0;
                  email.labels = ['inbox'];
                  email.attachments = parsed.attachments ? parsed.attachments.map(att => ({
                    id: att.contentId || Math.random().toString(36),
                    filename: att.filename || 'attachment',
                    mimeType: att.contentType || 'application/octet-stream',
                    size: att.size || 0,
                    url: null
                  })) : [];
                  email.threadId = parsed.messageId || email.id;
                  email.isImportant = false;
                  email.folder = 'inbox';

                  emails.unshift(email); // Add to beginning (newest first)
                  processedCount++;

                  console.log(`✅ Processed email: ${email.subject.substring(0, 50)}... (${email.body.length} chars)`);
                } catch (parseError) {
                  console.error('❌ Error parsing email:', parseError);

                  // ENHANCED fallback with better content extraction
                  try {
                    const header = Imap.parseHeader(fullBuffer.toString('utf8'));
                    const content = extractEmailContent(null, fullBuffer);

                    email.from = header.from && header.from[0] ? parseAddress(header.from[0]) : null;
                    email.to = header.to && header.to[0] ? [parseAddress(header.to[0])] : [];
                    email.subject = header.subject && header.subject[0] ? header.subject[0] : '(No subject)';
                    email.date = header.date && header.date[0] ? new Date(header.date[0]) : new Date();

                    // Use extracted content
                    email.body = content.text;
                    email.html = content.html;
                    email.snippet = content.snippet;

                    email.isRead = false;
                    email.isStarred = false;
                    email.hasAttachments = false;
                    email.labels = ['inbox'];
                    email.attachments = [];
                    email.threadId = email.id;
                    email.isImportant = false;
                    email.folder = 'inbox';

                    emails.unshift(email);
                    processedCount++;

                    console.log(`📧 Fallback processing successful: ${email.subject.substring(0, 50)}...`);
                  } catch (headerError) {
                    console.error('❌ Error even parsing headers:', headerError);
                    // Create minimal email record
                    email.subject = 'Error parsing email';
                    email.body = 'This email could not be parsed due to formatting issues.';
                    email.snippet = 'Email parsing failed.';
                    email.from = { name: 'Unknown', email: 'unknown@example.com' };
                    email.to = [];
                    email.date = new Date();
                    email.isRead = false;
                    email.isStarred = false;
                    email.hasAttachments = false;
                    email.labels = ['inbox'];
                    email.attachments = [];
                    email.threadId = email.id;
                    email.isImportant = false;
                    email.folder = 'inbox';

                    emails.unshift(email);
                    processedCount++;
                  }
                }
              });
            });

            msg.once('attributes', (attrs) => {
              // Update email with IMAP attributes
              const emailIndex = emails.findIndex(e => e.id === email.id);
              if (emailIndex !== -1) {
                emails[emailIndex].isRead = !attrs.flags.includes('\\Seen');
                emails[emailIndex].isStarred = attrs.flags.includes('\\Flagged');
                emails[emailIndex].hasAttachments = attrs.struct && attrs.struct.some(part =>
                  part.disposition && part.disposition.type === 'attachment'
                );

                console.log(`📧 Updated email ${email.id} attributes:`, {
                  isRead: emails[emailIndex].isRead,
                  isStarred: emails[emailIndex].isStarred,
                  hasAttachments: emails[emailIndex].hasAttachments
                });
              }
            });
          });

          fetch.once('error', (err) => {
            console.error('❌ Fetch error:', err);
            clearTimeout(timeout);
            reject(new Error(`Failed to fetch emails: ${err.message}`));
          });

          fetch.once('end', () => {
            clearTimeout(timeout);
            console.log(`✅ Email fetch completed. Processed ${processedCount} emails.`);

            // Log summary of content processing
            const withContent = emails.filter(e => e.body && e.body.length > 10).length;
            const withHtml = emails.filter(e => e.html && e.html.length > 10).length;
            console.log(`📧 Content summary: ${withContent}/${emails.length} with text, ${withHtml}/${emails.length} with HTML`);

            imap.end();
            resolve();
          });
        });
      });

      imap.once('error', (err) => {
        clearTimeout(timeout);
        console.error('❌ IMAP connection error:', err);

        if (err.message.includes('Invalid credentials')) {
          reject(new Error('Authentication failed. Please reconnect your Gmail account.'));
        } else {
          reject(new Error(`Gmail connection error: ${err.message}`));
        }
      });

      try {
        imap.connect();
      } catch (connectErr) {
        clearTimeout(timeout);
        reject(new Error(`Failed to connect to Gmail: ${connectErr.message}`));
      }
    });

    console.log(`✅ Successfully fetched ${emails.length} emails with ENHANCED content parsing`);

    res.json({
      success: true,
      emails,
      total: emails.length,
      message: `Loaded ${emails.length} emails successfully`
    });

  } catch (error) {
    console.error('❌ Failed to fetch emails:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch emails. Please try again.'
    });
  }
});

// Send email with enhanced error handling
app.post('/api/gmail/send/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { to, subject, body, cc, bcc } = req.body;

    const session = gmailSessions.get(sessionId);
    if (!session) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired session. Please authenticate again.'
      });
    }

    console.log('📤 Sending email from:', session.email);

    // Validate required fields
    if (!to || !subject || !body) {
      return res.status(400).json({
        success: false,
        error: 'To, subject, and body are required'
      });
    }

    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: session.email,
        pass: session.appPassword
      },
      pool: true,
      maxConnections: 5,
      maxMessages: 100
    });

    const mailOptions = {
      from: session.email,
      to: to,
      cc: cc || undefined,
      bcc: bcc || undefined,
      subject: subject,
      text: body,
      html: `<p>${body.replace(/\n/g, '<br>')}</p>`
    };

    const result = await transporter.sendMail(mailOptions);

    console.log('✅ Email sent successfully:', result.messageId);

    res.json({
      success: true,
      messageId: result.messageId,
      message: 'Email sent successfully'
    });

  } catch (error) {
    console.error('❌ Failed to send email:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send email. Please try again.'
    });
  }
});

// Clear session
app.delete('/api/gmail/session/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;

    if (gmailSessions.has(sessionId)) {
      gmailSessions.delete(sessionId);
      saveSessions();
      console.log('🗑️ Session cleared:', sessionId);
      res.json({
        success: true,
        message: 'Session cleared successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }
  } catch (error) {
    console.error('❌ Failed to clear session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear session: ' + error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Gmail IMAP Server running on port ${PORT}`);
  console.log(`📧 Active sessions: ${gmailSessions.size}`);
  console.log(`🔗 API endpoints:`);
  console.log(`   POST /api/gmail/authenticate - Authenticate Gmail`);
  console.log(`   GET  /api/gmail/emails/:sessionId - Get emails`);
  console.log(`   POST /api/gmail/send/:sessionId - Send email`);
  console.log(`   DELETE /api/gmail/session/:sessionId - Clear session`);
  console.log(`   GET  /health - Health check`);
  console.log(`   GET  /debug/sessions - Debug sessions`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down Gmail server...');
  saveSessions();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down Gmail server...');
  saveSessions();
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  saveSessions();
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});