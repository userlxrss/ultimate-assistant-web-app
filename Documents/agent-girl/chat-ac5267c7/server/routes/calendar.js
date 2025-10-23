const express = require('express');
const { google } = require('googleapis');
const router = express.Router();
const fetch = require('node-fetch');

// Get Calendar API instance with authenticated user
const getCalendarService = async (req, res) => {
  try {
    if (!req.session.userId) {
      throw new Error('User not authenticated');
    }

    // Get tokens from database
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

    return google.calendar({ version: 'v3', auth: oauth2Client });
  } catch (error) {
    console.error('Error getting Calendar service:', error);
    throw error;
  }
};

// Get calendar list
router.get('/calendars', async (req, res) => {
  try {
    const calendar = await getCalendarService(req, res);
    const response = await calendar.calendarList.list();

    res.json({
      success: true,
      calendars: response.data.items || []
    });
  } catch (error) {
    console.error('Calendar list error:', error);
    res.status(500).json({
      error: 'Failed to get calendars',
      message: error.message
    });
  }
});

// Get events from primary calendar
router.get('/events', async (req, res) => {
  try {
    const {
      calendarId = 'primary',
      timeMin,
      timeMax,
      maxResults = 10,
      singleEvents = true,
      orderBy = 'startTime'
    } = req.query;

    const calendar = await getCalendarService(req, res);

    const params = {
      calendarId,
      maxResults: parseInt(maxResults),
      singleEvents: singleEvents === 'true',
      orderBy
    };

    // Add time filters if provided
    if (timeMin) params.timeMin = timeMin;
    if (timeMax) params.timeMax = timeMax;

    const response = await calendar.events.list(params);

    res.json({
      success: true,
      events: response.data.items || [],
      nextPageToken: response.data.nextPageToken,
      timeZone: response.data.timeZone
    });
  } catch (error) {
    console.error('Calendar events error:', error);
    res.status(500).json({
      error: 'Failed to get events',
      message: error.message
    });
  }
});

// Get specific event
router.get('/events/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { calendarId = 'primary' } = req.query;

    const calendar = await getCalendarService(req, res);
    const response = await calendar.events.get({
      calendarId,
      eventId
    });

    res.json({
      success: true,
      event: response.data
    });
  } catch (error) {
    console.error('Calendar event get error:', error);
    res.status(500).json({
      error: 'Failed to get event',
      message: error.message
    });
  }
});

// Create new event
router.post('/events', async (req, res) => {
  try {
    const {
      summary,
      description,
      start,
      end,
      location,
      attendees = [],
      calendarId = 'primary'
    } = req.body;

    if (!summary || !start || !end) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'summary, start, and end are required'
      });
    }

    const calendar = await getCalendarService(req, res);

    const event = {
      summary,
      description,
      location,
      start: {
        dateTime: start,
        timeZone: 'UTC'
      },
      end: {
        dateTime: end,
        timeZone: 'UTC'
      },
      attendees: attendees.map(email => ({ email })),
      reminders: {
        useDefault: true
      }
    };

    const response = await calendar.events.insert({
      calendarId,
      requestBody: event
    });

    console.log(`📅 Event created: ${summary}`);

    res.json({
      success: true,
      message: 'Event created successfully',
      event: response.data
    });
  } catch (error) {
    console.error('Calendar event create error:', error);
    res.status(500).json({
      error: 'Failed to create event',
      message: error.message
    });
  }
});

// Update event
router.put('/events/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const {
      summary,
      description,
      start,
      end,
      location,
      attendees = [],
      calendarId = 'primary'
    } = req.body;

    const calendar = await getCalendarService(req, res);

    const event = {
      summary,
      description,
      location,
      start: {
        dateTime: start,
        timeZone: 'UTC'
      },
      end: {
        dateTime: end,
        timeZone: 'UTC'
      },
      attendees: attendees.map(email => ({ email }))
    };

    const response = await calendar.events.update({
      calendarId,
      eventId,
      requestBody: event
    });

    console.log(`📅 Event updated: ${summary}`);

    res.json({
      success: true,
      message: 'Event updated successfully',
      event: response.data
    });
  } catch (error) {
    console.error('Calendar event update error:', error);
    res.status(500).json({
      error: 'Failed to update event',
      message: error.message
    });
  }
});

// Delete event
router.delete('/events/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { calendarId = 'primary' } = req.query;

    const calendar = await getCalendarService(req, res);
    await calendar.events.delete({
      calendarId,
      eventId
    });

    console.log(`🗑️ Event deleted: ${eventId}`);

    res.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    console.error('Calendar event delete error:', error);
    res.status(500).json({
      error: 'Failed to delete event',
      message: error.message
    });
  }
});

// Get events for today
router.get('/today', async (req, res) => {
  try {
    const { calendarId = 'primary' } = req.query;

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const calendar = await getCalendarService(req, res);

    const response = await calendar.events.list({
      calendarId,
      timeMin: today.toISOString(),
      timeMax: tomorrow.toISOString(),
      singleEvents: true,
      orderBy: 'startTime'
    });

    res.json({
      success: true,
      events: response.data.items || [],
      date: today.toISOString().split('T')[0]
    });
  } catch (error) {
    console.error('Calendar today events error:', error);
    res.status(500).json({
      error: 'Failed to get today events',
      message: error.message
    });
  }
});

// Get upcoming events (next 7 days)
router.get('/upcoming', async (req, res) => {
  try {
    const { calendarId = 'primary', days = 7 } = req.query;

    const now = new Date();
    const future = new Date(now);
    future.setDate(future.getDate() + parseInt(days));

    const calendar = await getCalendarService(req, res);

    const response = await calendar.events.list({
      calendarId,
      timeMin: now.toISOString(),
      timeMax: future.toISOString(),
      singleEvents: true,
      orderBy: 'startTime'
    });

    res.json({
      success: true,
      events: response.data.items || [],
      period: `Next ${days} days`
    });
  } catch (error) {
    console.error('Calendar upcoming events error:', error);
    res.status(500).json({
      error: 'Failed to get upcoming events',
      message: error.message
    });
  }
});

// Quick add event
router.post('/quick-add', async (req, res) => {
  try {
    const { text, calendarId = 'primary' } = req.body;

    if (!text) {
      return res.status(400).json({
        error: 'Missing required field',
        message: 'text is required'
      });
    }

    const calendar = await getCalendarService(req, res);

    const response = await calendar.events.quickAdd({
      calendarId,
      text
    });

    console.log(`⚡ Quick added event: ${text}`);

    res.json({
      success: true,
      message: 'Event created successfully',
      event: response.data
    });
  } catch (error) {
    console.error('Calendar quick add error:', error);
    res.status(500).json({
      error: 'Failed to create event',
      message: error.message
    });
  }
});

// iCal proxy endpoint - avoids CORS issues
router.get('/proxy/*', async (req, res) => {
  try {
    const icalUrl = `https://calendar.google.com/${req.params[0]}`;

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

module.exports = router;