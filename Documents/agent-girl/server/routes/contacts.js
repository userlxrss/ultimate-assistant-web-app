const express = require('express');
const { google } = require('googleapis');
const router = express.Router();

// Get People API instance with authenticated user
const getPeopleService = async (req, res) => {
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

    return google.people({ version: 'v1', auth: oauth2Client });
  } catch (error) {
    console.error('Error getting People service:', error);
    throw error;
  }
};

// Get contact list
router.get('/', async (req, res) => {
  try {
    const {
      pageSize = 50,
      pageToken,
      sortOrder = 'FIRST_NAME_ASCENDING'
    } = req.query;

    const people = await getPeopleService(req, res);

    const response = await people.people.connections.list({
      resourceName: 'people/me',
      personFields: 'names,emailAddresses,phoneNumbers,organizations,photos',
      pageSize: parseInt(pageSize),
      pageToken,
      sortOrder
    });

    res.json({
      success: true,
      contacts: response.data.connections || [],
      nextPageToken: response.data.nextPageToken,
      totalItems: response.data.totalItems,
      totalPeople: response.data.totalPeople
    });
  } catch (error) {
    console.error('Contacts list error:', error);
    res.status(500).json({
      error: 'Failed to get contacts',
      message: error.message
    });
  }
});

// Get specific contact
router.get('/:contactId', async (req, res) => {
  try {
    const { contactId } = req.params;

    const people = await getPeopleService(req, res);
    const response = await people.people.get({
      resourceName: `people/${contactId}`,
      personFields: 'names,emailAddresses,phoneNumbers,organizations,photos,birthdays,addresses,relations'
    });

    res.json({
      success: true,
      contact: response.data
    });
  } catch (error) {
    console.error('Contact get error:', error);
    res.status(500).json({
      error: 'Failed to get contact',
      message: error.message
    });
  }
});

// Create new contact
router.post('/', async (req, res) => {
  try {
    const {
      names = [],
      emailAddresses = [],
      phoneNumbers = [],
      organizations = []
    } = req.body;

    if (names.length === 0) {
      return res.status(400).json({
        error: 'Missing required field',
        message: 'At least one name is required'
      });
    }

    const people = await getPeopleService(req, res);

    const contact = {
      names,
      emailAddresses,
      phoneNumbers,
      organizations
    };

    const response = await people.people.createContact({
      requestBody: contact
    });

    console.log(`👤 Contact created: ${names[0].displayName || 'Unknown'}`);

    res.json({
      success: true,
      message: 'Contact created successfully',
      contact: response.data
    });
  } catch (error) {
    console.error('Contact create error:', error);
    res.status(500).json({
      error: 'Failed to create contact',
      message: error.message
    });
  }
});

// Update contact
router.put('/:contactId', async (req, res) => {
  try {
    const { contactId } = req.params;
    const {
      names = [],
      emailAddresses = [],
      phoneNumbers = [],
      organizations = []
    } = req.body;

    const people = await getPeopleService(req, res);

    const contact = {
      names,
      emailAddresses,
      phoneNumbers,
      organizations
    };

    const response = await people.people.updateContact({
      resourceName: `people/${contactId}`,
      updatePersonFields: 'names,emailAddresses,phoneNumbers,organizations',
      requestBody: contact
    });

    console.log(`📝 Contact updated: ${contactId}`);

    res.json({
      success: true,
      message: 'Contact updated successfully',
      contact: response.data
    });
  } catch (error) {
    console.error('Contact update error:', error);
    res.status(500).json({
      error: 'Failed to update contact',
      message: error.message
    });
  }
});

// Delete contact
router.delete('/:contactId', async (req, res) => {
  try {
    const { contactId } = req.params;

    const people = await getPeopleService(req, res);
    await people.people.deleteContact({
      resourceName: `people/${contactId}`
    });

    console.log(`🗑️ Contact deleted: ${contactId}`);

    res.json({
      success: true,
      message: 'Contact deleted successfully'
    });
  } catch (error) {
    console.error('Contact delete error:', error);
    res.status(500).json({
      error: 'Failed to delete contact',
      message: error.message
    });
  }
});

// Search contacts
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const { pageSize = 25 } = req.query;

    const people = await getPeopleService(req, res);

    const response = await people.people.searchContacts({
      query,
      readMask: 'names,emailAddresses,phoneNumbers,organizations,photos',
      pageSize: parseInt(pageSize)
    });

    res.json({
      success: true,
      contacts: response.data.results || [],
      query
    });
  } catch (error) {
    console.error('Contact search error:', error);
    res.status(500).json({
      error: 'Failed to search contacts',
      message: error.message
    });
  }
});

// Get contact groups
router.get('/groups/list', async (req, res) => {
  try {
    const people = await getPeopleService(req, res);

    const response = await people.contactGroups.list();

    res.json({
      success: true,
      groups: response.data.contactGroups || []
    });
  } catch (error) {
    console.error('Contact groups error:', error);
    res.status(500).json({
      error: 'Failed to get contact groups',
      message: error.message
    });
  }
});

// Get contacts in a specific group
router.get('/groups/:groupId/contacts', async (req, res) => {
  try {
    const { groupId } = req.params;
    const { pageSize = 50, pageToken } = req.query;

    const people = await getPeopleService(req, res);

    const response = await people.contactGroups.get({
      resourceName: `contactGroups/${groupId}`,
      maxMembers: parseInt(pageSize),
      pageToken
    });

    res.json({
      success: true,
      contacts: response.data.memberResourceNames || [],
      nextPageToken: response.data.nextPageToken
    });
  } catch (error) {
    console.error('Group contacts error:', error);
    res.status(500).json({
      error: 'Failed to get group contacts',
      message: error.message
    });
  }
});

// Batch get contacts (for multiple contact IDs)
router.post('/batch-get', async (req, res) => {
  try {
    const { contactIds } = req.body;

    if (!contactIds || !Array.isArray(contactIds)) {
      return res.status(400).json({
        error: 'Missing required field',
        message: 'contactIds array is required'
      });
    }

    const people = await getPeopleService(req, res);

    const resourceNames = contactIds.map(id => `people/${id}`);

    const response = await people.people.getBatchGet({
      resourceNames,
      personFields: 'names,emailAddresses,phoneNumbers,organizations,photos'
    });

    res.json({
      success: true,
      contacts: response.data.responses || []
    });
  } catch (error) {
    console.error('Batch get contacts error:', error);
    res.status(500).json({
      error: 'Failed to get contacts',
      message: error.message
    });
  }
});

// Get contact by email
router.get('/email/:email', async (req, res) => {
  try {
    const { email } = req.params;

    const people = await getPeopleService(req, res);

    const response = await people.people.searchContacts({
      query: email,
      readMask: 'names,emailAddresses,phoneNumbers,organizations,photos',
      pageSize: 1
    });

    if (response.data.results && response.data.results.length > 0) {
      res.json({
        success: true,
        contact: response.data.results[0].person
      });
    } else {
      res.json({
        success: false,
        message: 'No contact found with that email'
      });
    }
  } catch (error) {
    console.error('Contact by email error:', error);
    res.status(500).json({
      error: 'Failed to find contact',
      message: error.message
    });
  }
});

module.exports = router;