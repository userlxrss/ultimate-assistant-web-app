import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Edit2, Trash2, Phone, Mail, Building, User, Users, AlertCircle, Check, Info, ExternalLink } from 'lucide-react';
import { useNotifications } from '../NotificationSystem';
import { workingCardDavGoogleContacts, CardDavContact } from '../../utils/workingCardDavGoogleContacts';

type Contact = CardDavContact;

interface DuplicateGroup {
  id: string;
  contacts: Contact[];
  similarity: number;
  mergedFields: {
    names: string[];
    emails: string[];
    phones: string[];
  };
}

const ContactsApp: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDuplicates, setShowDuplicates] = useState(false);
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [authForm, setAuthForm] = useState({ email: '', appPassword: '' });
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [bridgeStatus, setBridgeStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [usingDirectCardDAV, setUsingDirectCardDAV] = useState(false);
  const [hasLoadedContacts, setHasLoadedContacts] = useState(false);
  const { showSuccess, showError, showInfo, clearAllNotifications } = useNotifications();

  // Form state for create/edit
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    organization: '',
    title: ''
  });

  // Check if CardDAV bridge is running
  useEffect(() => {
    const checkBridgeStatus = async () => {
      try {
        const response = await fetch('http://localhost:3014/health');
        if (response.ok) {
          setBridgeStatus('online');
          console.log('✅ Working CardDAV bridge is online');
        } else {
          setBridgeStatus('offline');
        }
      } catch (error) {
        setBridgeStatus('offline');
        console.log('⚠️ Working CardDAV bridge is offline - please start it');
      }
    };

    checkBridgeStatus();
    const interval = setInterval(checkBridgeStatus, 10000); // Check every 10 seconds to reduce spam
    return () => clearInterval(interval);
  }, []);

  // Check if CardDAV is authenticated and preset user credentials
  useEffect(() => {
    const checkAuth = async () => {
      if (bridgeStatus !== 'online') {
        console.log('⚠️ CardDAV bridge is offline, cannot authenticate');
        return;
      }

      try {
        // Pre-set user credentials for immediate testing
        await workingCardDavGoogleContacts.presetUserCredentials();

        const isCardDavAuthenticated = workingCardDavGoogleContacts.isAuthenticated();
        setIsConnected(isCardDavAuthenticated);

        console.log('📱 Working CardDAV authentication status check:', {
          'bridgeStatus': bridgeStatus,
          'isAuthenticated': isCardDavAuthenticated,
          'finalIsConnected': isCardDavAuthenticated
        });

        if (isCardDavAuthenticated) {
          console.log('✅ Working CardDAV is authenticated with user credentials - ready to fetch real contacts');
        } else {
          console.log('⚠️ No working CardDAV credentials found - need to set up app password');
        }
      } catch (error) {
        console.error('❌ Failed to preset CardDAV credentials:', error);
        setIsConnected(false);
      }
    };

    if (bridgeStatus === 'online') {
      checkAuth();
    }
  }, [bridgeStatus]);

  // Test connection to CardDAV Google Contacts
  const testConnection = async () => {
    if (bridgeStatus !== 'online') {
      showError('Bridge Offline', 'Please start the CardDAV bridge server first');
      return;
    }

    if (!workingCardDavGoogleContacts.isAuthenticated()) {
      showError('Not Connected', 'Please connect to Google Contacts first');
      return;
    }

    setIsTestingConnection(true);
    try {
      const isConnected = await workingCardDavGoogleContacts.testConnection();
      if (isConnected) {
        showSuccess('Connection Successful', 'Successfully connected to Google Contacts via Working CardDAV Bridge');
      } else {
        showError('Connection Failed', 'Could not connect to Google Contacts via Working CardDAV Bridge');
      }
    } catch (error) {
      console.error('Working CardDAV connection test failed:', error);
      showError('Connection Test Failed', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsTestingConnection(false);
    }
  };

  // Contact fetching using working CardDAV protocol
  const fetchContacts = useCallback(async (isManualRefresh = false) => {
    if (bridgeStatus !== 'online') {
      showError('Bridge Offline', 'Please start the CardDAV bridge server first');
      return;
    }

    setIsLoading(true);
    try {
      console.log('📊 Fetching contacts using working CardDAV protocol...');
      let contacts;

      if (usingDirectCardDAV) {
        contacts = await workingCardDavGoogleContacts.getContactsViaCardDAV();
        console.log('📊 Using direct CardDAV protocol access');
      } else {
        contacts = await workingCardDavGoogleContacts.getContacts();
        console.log('📊 Using CardDAV bridge API access');
      }

      console.log(`📊 Successfully fetched ${contacts.length} real Google contacts via working CardDAV`);
      setContacts(contacts);

      // Show success message for manual refresh or first load
      if (isManualRefresh || !hasLoadedContacts) {
        const message = contacts.length > 0
          ? `Loaded ${contacts.length} contacts from your Google Contacts via Working CardDAV${usingDirectCardDAV ? ' (Direct Protocol)' : ' Bridge'}`
          : 'No contacts found in your Google Contacts';

        showInfo('CardDAV Contacts Loaded', message);
      }

      // Only show no contacts message once if there are truly no contacts
      if (contacts.length === 0 && !hasLoadedContacts) {
        setTimeout(() => {
          showInfo('No Contacts', 'No contacts were found. Check your CardDAV settings and Google Contacts.');
        }, 2000);
      }

      // Mark as loaded after successful fetch
      setHasLoadedContacts(true);

    } catch (error) {
      console.error('Failed to fetch working CardDAV contacts:', error);

      // Don't show error for authentication issues, just log it
      if (error.message.includes('Please authenticate first')) {
        console.log('⚠️ Working CardDAV authentication required');
        showError('Authentication Required', 'Please set up your app password to access Google Contacts via Working CardDAV');
        setShowAuth(true);
      } else {
        showError('Failed to load contacts', error instanceof Error ? error.message : 'Unknown error');
      }
    } finally {
      setIsLoading(false);
    }
  }, [bridgeStatus, usingDirectCardDAV, showError, hasLoadedContacts, showInfo]);

  // Auto-fetch contacts when component mounts and authenticated (only once)
  useEffect(() => {
    if (isConnected && bridgeStatus === 'online' && !hasLoadedContacts) {
      fetchContacts(false); // Auto-fetch is not a manual refresh
    }
  }, [isConnected, bridgeStatus, hasLoadedContacts, fetchContacts]);

  // Filter contacts based on search query
  useEffect(() => {
    if (!searchQuery) {
      setFilteredContacts(contacts);
    } else {
      const filtered = contacts.filter(contact => {
        const searchString = searchQuery.toLowerCase();
        const name = contact.displayName?.toLowerCase() || '';
        const email = contact.emails?.map(e => e.value).join(' ').toLowerCase() || '';
        const phone = contact.phoneNumbers?.map(p => p.value).join(' ').toLowerCase() || '';
        const organization = contact.organizations?.map(o => o.name).join(' ').toLowerCase() || '';

        return name.includes(searchString) ||
               email.includes(searchString) ||
               phone.includes(searchString) ||
               organization.includes(searchString);
      });
      setFilteredContacts(filtered);
    }
  }, [contacts, searchQuery]);

  // Find duplicate contacts
  const findDuplicates = useCallback(() => {
    const duplicateGroups = workingCardDavGoogleContacts.findDuplicates(contacts);

    setDuplicateGroups(duplicateGroups);
    setShowDuplicates(true);

    if (duplicateGroups.length > 0) {
      showInfo('Duplicates Found', `Found ${duplicateGroups.length} potential duplicate groups`);
    } else {
      showInfo('No Duplicates', 'No duplicate contacts found');
    }
  }, [contacts, showInfo]);

  // Create or update contact
  const handleSaveContact = async () => {
    try {
      const contactData: Partial<CardDavContact> = {
        displayName: `${formData.firstName} ${formData.lastName}`.trim(),
        name: {
          givenName: formData.firstName,
          familyName: formData.lastName,
          formatted: `${formData.firstName} ${formData.lastName}`.trim()
        },
        emails: formData.email ? [{ value: formData.email, type: 'work' }] : [],
        phoneNumbers: formData.phone ? [{ value: formData.phone, type: 'mobile' }] : [],
        organizations: formData.organization ? [{
          name: formData.organization,
          title: formData.title
        }] : []
      };

      let newContact: Contact;

      if (isEditing && selectedContact) {
        // Update existing contact
        newContact = await workingCardDavGoogleContacts.updateContact(
          selectedContact.href || selectedContact.id,
          contactData,
          selectedContact.etag || ''
        );
        setContacts(prev => prev.map(c =>
          c.id === selectedContact.id ? newContact : c
        ));
        showSuccess('Contact Updated', `${newContact.displayName} has been updated`);
      } else {
        // Create new contact
        newContact = await workingCardDavGoogleContacts.createContact(contactData);
        setContacts(prev => [newContact, ...prev]);
        showSuccess('Contact Created', `${newContact.displayName} has been added`);
      }

      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        organization: '',
        title: ''
      });
      setIsCreating(false);
      setIsEditing(false);
      setSelectedContact(null);
    } catch (error) {
      console.error('Failed to save contact:', error);
      showError('Failed to save contact', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  // Delete contact
  const handleDeleteContact = async (contact: Contact) => {
    if (!confirm(`Are you sure you want to delete ${contact.displayName || 'this contact'}?`)) {
      return;
    }

    try {
      await workingCardDavGoogleContacts.deleteContact(
        contact.href || contact.id,
        contact.etag || ''
      );
      setContacts(prev => prev.filter(c => c.id !== contact.id));
      showSuccess('Contact Deleted', `${contact.displayName || 'Contact'} has been deleted`);

      if (selectedContact?.id === contact.id) {
        setSelectedContact(null);
      }
    } catch (error) {
      console.error('Failed to delete contact:', error);
      showError('Failed to delete contact', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  // Edit contact
  const handleEditContact = (contact: Contact) => {
    setSelectedContact(contact);
    setFormData({
      firstName: contact.name?.givenName || '',
      lastName: contact.name?.familyName || '',
      email: contact.emails?.[0]?.value || '',
      phone: contact.phoneNumbers?.[0]?.value || '',
      organization: contact.organizations?.[0]?.name || '',
      title: contact.organizations?.[0]?.title || ''
    });
    setIsEditing(true);
    setIsCreating(true);
  };

  // Get primary display name
  const getDisplayName = (contact: Contact) => {
    return contact.displayName || contact.name?.formatted || 'Unknown Contact';
  };

  // Get primary email
  const getPrimaryEmail = (contact: Contact) => {
    return contact.emails?.[0]?.value || '';
  };

  // Get primary phone
  const getPrimaryPhone = (contact: Contact) => {
    return contact.phoneNumbers?.[0]?.value || '';
  };

  // Get organization
  const getOrganization = (contact: Contact) => {
    return contact.organizations?.[0]?.name || '';
  };

  // Handle authentication
  const handleAuth = async () => {
    try {
      if (!authForm.email || !authForm.appPassword) {
        showError('Missing Information', 'Please enter both email and app password');
        return;
      }

      if (bridgeStatus !== 'online') {
        showError('Bridge Offline', 'Please start the CardDAV bridge server first');
        return;
      }

      console.log('🔐 Setting up working CardDAV Google Contacts...');
      setIsLoading(true);

      try {
        // Set working CardDAV credentials with app password
        await workingCardDavGoogleContacts.setCredentials(authForm.email, authForm.appPassword);

        setShowAuth(false);
        setIsConnected(true);
        showSuccess('Authentication Successful', 'Your Google account has been connected via Working CardDAV Bridge');
        // Fetch contacts after successful authentication (this will be handled by the auto-fetch useEffect)
        setHasLoadedContacts(false); // Reset to allow first-time loading
      } catch (error) {
        showError('Authentication Failed', error instanceof Error ? error.message : 'Unknown error');
      }
    } catch (error) {
      console.error('Authentication failed:', error);
      showError('Authentication Failed', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  // Bridge status indicator
  const BridgeStatusIndicator = () => (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
      bridgeStatus === 'online'
        ? 'bg-green-50 text-green-700 border border-green-200'
        : 'bg-red-50 text-red-700 border border-red-200'
    }`}>
      <div className={`w-2 h-2 rounded-full ${
        bridgeStatus === 'online' ? 'bg-green-500' : 'bg-red-500'
      }`} />
      <span>
        CardDAV Bridge: {bridgeStatus === 'online' ? 'Online' : 'Offline'}
      </span>
      {bridgeStatus === 'offline' && (
        <button
          onClick={() => window.open('http://localhost:3014/health', '_blank')}
          className="ml-2 text-blue-600 hover:text-blue-800"
          title="Start Bridge Server"
        >
          <ExternalLink className="w-4 h-4" />
        </button>
      )}
    </div>
  );

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sage-50 via-dusty-blue-50 to-soft-lavender-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="p-6">
          <div className="glass-card rounded-2xl p-8 max-w-md mx-auto">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white mx-auto mb-4">
                <User className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Connect Google Contacts via Working CardDAV</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Connect to your Google Contacts using our working CardDAV bridge with your app-specific password.
              </p>

              {/* Bridge Status */}
              <div className="mb-4">
                <BridgeStatusIndicator />
              </div>

              {/* Info about Working CardDAV implementation */}
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 mb-4">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <div className="text-left">
                    <p className="text-sm text-green-800 dark:text-green-200">
                      <strong>Working CardDAV Implementation:</strong> Custom CardDAV bridge that provides real CardDAV protocol access to Google Contacts.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {!showAuth ? (
              <div className="space-y-3">
                <button
                  onClick={() => setShowAuth(true)}
                  disabled={bridgeStatus !== 'online'}
                  className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  Connect via Working CardDAV
                </button>

                <button
                  onClick={() => setShowHelp(true)}
                  className="w-full px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                >
                  Setup Instructions
                </button>

                {bridgeStatus === 'online' && (
                  <button
                    onClick={() => setUsingDirectCardDAV(!usingDirectCardDAV)}
                    className="w-full px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm"
                  >
                    {usingDirectCardDAV ? 'Use Bridge API' : 'Use Direct CardDAV Protocol'}
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Gmail Address
                  </label>
                  <input
                    type="email"
                    placeholder="yourname@gmail.com"
                    value={authForm.email}
                    onChange={(e) => setAuthForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    App-Specific Password
                  </label>
                  <input
                    type="password"
                    placeholder="16-character app password"
                    value={authForm.appPassword}
                    onChange={(e) => setAuthForm(prev => ({ ...prev, appPassword: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Generate this in your Google Account settings under 2-Step Verification
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleAuth}
                    disabled={isLoading || bridgeStatus !== 'online'}
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    Connect
                  </button>
                  <button
                    onClick={() => setShowAuth(false)}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Bridge Setup:</h3>
              <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>1. Start the bridge: <code className="bg-blue-100 px-1 rounded">node working-carddav-bridge.cjs</code></li>
                <li>2. Enable 2-Step Verification in Google Account</li>
                <li>3. Generate app password for "Mail" or "Other"</li>
                <li>4. Connect using your Gmail and app password</li>
                <li>5. Access your real Google Contacts via CardDAV!</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Help Modal */}
        {showHelp && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Working Google Contacts Setup Instructions
                </h2>
                <button
                  onClick={() => setShowHelp(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <AlertCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="prose prose-sm dark:prose-invert">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                  <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Working CardDAV Bridge</h3>
                  <p className="text-blue-800 dark:text-blue-200 text-sm">
                    This application uses a custom CardDAV bridge that provides working CardDAV protocol access to your Google Contacts.
                    The bridge runs locally and translates CardDAV requests to Google Contacts API calls.
                  </p>
                </div>

                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Step-by-Step Setup:</h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
                  <li>
                    <strong>Start the CardDAV Bridge:</strong>
                    <p className="text-sm mt-1">
                      Run: <code className="bg-gray-100 px-1 rounded">node working-carddav-bridge.cjs</code>
                    </p>
                  </li>
                  <li>
                    <strong>Enable 2-Step Verification:</strong>
                    <p className="text-sm mt-1">Go to your Google Account settings → Security → 2-Step Verification and enable it.</p>
                  </li>
                  <li>
                    <strong>Generate App Password:</strong>
                    <p className="text-sm mt-1">Go to Security → App passwords → Select "Mail" or "Other" → Generate password.</p>
                  </li>
                  <li>
                    <strong>Connect to the Bridge:</strong>
                    <p className="text-sm mt-1">Use your Gmail address and the 16-character app password to authenticate.</p>
                  </li>
                  <li>
                    <strong>Choose Access Method:</strong>
                    <p className="text-sm mt-1">Use either the Bridge API (easier) or direct CardDAV protocol (advanced).</p>
                  </li>
                </ol>

                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 mt-4">CardDAV Endpoints:</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300 text-sm">
                  <li><strong>Bridge URL:</strong> http://localhost:3014</li>
                  <li><strong>CardDAV Root:</strong> http://localhost:3014/carddav/</li>
                  <li><strong>User Principal:</strong> http://localhost:3014/carddav/user/</li>
                  <li><strong>Address Book:</strong> http://localhost:3014/carddav/user/contacts/</li>
                </ul>

                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 mt-4">Troubleshooting:</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300 text-sm">
                  <li>Ensure the CardDAV bridge is running (check health endpoint)</li>
                  <li>If authentication fails, ensure 2-Step Verification is enabled</li>
                  <li>Make sure you're using the correct app password for CardDAV access</li>
                  <li>Check that you're entering the full 16-character password</li>
                  <li>The bridge provides both REST API and direct CardDAV protocol access</li>
                </ul>

                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mt-4">
                  <p className="text-green-800 dark:text-green-200 text-sm">
                    <strong>Current Status:</strong> This implementation uses a working CardDAV bridge that provides real CardDAV protocol access to your Google Contacts.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowHelp(false)}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sage-50 via-dusty-blue-50 to-soft-lavender-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="p-6">
        {/* Header */}
        <div className="glass-card rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Google Contacts (Working CardDAV)</h1>
              <div className="mt-2">
                <BridgeStatusIndicator />
                {usingDirectCardDAV && (
                  <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-700 rounded text-sm">
                    Direct CardDAV Protocol
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={testConnection}
                disabled={isTestingConnection || bridgeStatus !== 'online'}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isTestingConnection ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Test Connection
              </button>
              <button
                onClick={findDuplicates}
                disabled={contacts.length === 0}
                className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Users className="w-4 h-4" />
                Find Duplicates
              </button>
              <button
                onClick={() => {
                  clearAllNotifications();
                  fetchContacts(true);
                }}
                disabled={isLoading || bridgeStatus !== 'online'}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                Refresh
              </button>
              <button
                onClick={() => {
                  setIsCreating(true);
                  setIsEditing(false);
                  setFormData({
                    firstName: '',
                    lastName: '',
                    email: '',
                    phone: '',
                    organization: '',
                    title: ''
                  });
                }}
                className="px-4 py-2 bg-sage-500 text-white rounded-lg hover:bg-sage-600 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Contact
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg glass-button text-sm focus:outline-none focus:ring-2 focus:ring-sage-500"
            />
          </div>
        </div>

        {/* Duplicate Groups */}
        {showDuplicates && duplicateGroups.length > 0 && (
          <div className="glass-card rounded-2xl p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Potential Duplicates</h2>
            <div className="space-y-4">
              {duplicateGroups.map(group => (
                <div key={group.id} className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900 dark:text-white">Duplicate Group</h3>
                    <span className="text-sm text-amber-600 dark:text-amber-400">
                      {group.contacts.length} contacts
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {group.contacts.map(contact => (
                      <div key={contact.id} className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4 text-gray-400" />
                        {getDisplayName(contact)}
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <button className="px-3 py-1 bg-amber-500 text-white text-sm rounded hover:bg-amber-600 transition-colors">
                      Merge
                    </button>
                    <button
                      onClick={() => setShowDuplicates(false)}
                      className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 transition-colors"
                    >
                      Ignore
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contact List */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              All Contacts ({filteredContacts.length})
            </h2>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-sage-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                {searchQuery ? 'No contacts found matching your search' : 'No contacts available'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredContacts.map(contact => (
                <div
                  key={contact.id}
                  className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedContact(contact)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 bg-sage-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {getDisplayName(contact).charAt(0).toUpperCase()}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditContact(contact);
                        }}
                        className="p-1 text-gray-400 hover:text-sage-500 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteContact(contact);
                        }}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                    {getDisplayName(contact)}
                  </h3>

                  <div className="space-y-1 text-sm">
                    {getPrimaryEmail(contact) && (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Mail className="w-3 h-3" />
                        {getPrimaryEmail(contact)}
                      </div>
                    )}
                    {getPrimaryPhone(contact) && (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Phone className="w-3 h-3" />
                        {getPrimaryPhone(contact)}
                      </div>
                    )}
                    {getOrganization(contact) && (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Building className="w-3 h-3" />
                        {getOrganization(contact)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Contact Modal */}
        {selectedContact && !isCreating && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {getDisplayName(selectedContact)}
                </h2>
                <button
                  onClick={() => setSelectedContact(null)}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <AlertCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {getPrimaryEmail(selectedContact) && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                      <p className="text-gray-900 dark:text-white">{getPrimaryEmail(selectedContact)}</p>
                    </div>
                  </div>
                )}

                {getPrimaryPhone(selectedContact) && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
                      <p className="text-gray-900 dark:text-white">{getPrimaryPhone(selectedContact)}</p>
                    </div>
                  </div>
                )}

                {getOrganization(selectedContact) && (
                  <div className="flex items-center gap-3">
                    <Building className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Organization</p>
                      <p className="text-gray-900 dark:text-white">{getOrganization(selectedContact)}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    handleEditContact(selectedContact);
                    setSelectedContact(null);
                  }}
                  className="flex-1 px-4 py-2 bg-sage-500 text-white rounded-lg hover:bg-sage-600 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => setSelectedContact(null)}
                  className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create/Edit Contact Modal */}
        {isCreating && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {isEditing ? 'Edit Contact' : 'Create Contact'}
                </h2>
                <button
                  onClick={() => {
                    setIsCreating(false);
                    setIsEditing(false);
                    setSelectedContact(null);
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <AlertCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Organization
                  </label>
                  <input
                    type="text"
                    value={formData.organization}
                    onChange={(e) => setFormData(prev => ({ ...prev, organization: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSaveContact}
                  disabled={!formData.firstName && !formData.lastName}
                  className="flex-1 px-4 py-2 bg-sage-500 text-white rounded-lg hover:bg-sage-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isEditing ? 'Update' : 'Create'}
                </button>
                <button
                  onClick={() => {
                    setIsCreating(false);
                    setIsEditing(false);
                    setSelectedContact(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactsApp;