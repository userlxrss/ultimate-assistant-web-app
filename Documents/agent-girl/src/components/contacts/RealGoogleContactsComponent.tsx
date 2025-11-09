import React, { useState, useEffect } from 'react';
import { Users, Search, Phone, Mail, Building, Camera, AlertCircle, Check, ExternalLink, RefreshCw } from 'lucide-react';
import { realGoogleContacts, GoogleContact, GoogleUserInfo } from '../../utils/realGoogleContacts';

const RealGoogleContactsComponent: React.FC = () => {
  const [contacts, setContacts] = useState<GoogleContact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<GoogleContact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userInfo, setUserInfo] = useState<GoogleUserInfo | null>(null);
  const [showStats, setShowStats] = useState(false);

  // Initialize on component mount
  useEffect(() => {
    initializeContacts();
  }, []);

  // Initialize contacts service
  const initializeContacts = async () => {
    try {
      setLoading(true);
      const isAuth = await realGoogleContacts.initialize();

      if (isAuth) {
        const userInfo = realGoogleContacts.getUserInfo();
        setUserInfo(userInfo);
        setIsAuthenticated(true);
        await fetchContacts();
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Initialization error:', error);
      setError('Failed to initialize Google Contacts');
    } finally {
      setLoading(false);
    }
  };

  // Fetch real contacts
  const fetchContacts = async () => {
    try {
      setLoading(true);
      setError('');

      const result = await realGoogleContacts.getContacts();
      setContacts(result.connections);
      setFilteredContacts(result.connections);

      console.log(`🎉 Successfully loaded ${result.connections.length} REAL Google Contacts!`);
      console.log(`👤 User: ${realGoogleContacts.getUserInfo()?.name}`);

    } catch (error: any) {
      console.error('Error fetching contacts:', error);
      setError(error.message);

      if (error.message.includes('OAuth Required')) {
        setIsAuthenticated(false);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Google authentication
  const handleConnectGoogle = async () => {
    try {
      setLoading(true);
      await realGoogleContacts.startOAuthFlow();
    } catch (error) {
      console.error('Error starting OAuth flow:', error);
      setError('Failed to start Google authentication');
      setLoading(false);
    }
  };

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await realGoogleContacts.signOut();
      setIsAuthenticated(false);
      setUserInfo(null);
      setContacts([]);
      setFilteredContacts([]);
      setError('');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Handle search
  useEffect(() => {
    if (searchQuery) {
      const filtered = realGoogleContacts.searchContacts(contacts, searchQuery);
      setFilteredContacts(filtered);
    } else {
      setFilteredContacts(contacts);
    }
  }, [searchQuery, contacts]);

  // Get contact statistics
  const getStats = () => {
    return realGoogleContacts.getContactStats(contacts);
  };

  const stats = getStats();

  if (!isAuthenticated) {
    return (
      <div className="p-6">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Connect Google Contacts
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Access your real Google Contacts from your account
            </p>
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div>
                <h3 className="font-medium text-amber-900 dark:text-amber-100 mb-1">
                  Real Data Only
                </h3>
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  This integration fetches your ACTUAL Google Contacts, not sample data.
                  No more dummy contacts - only your real address book!
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleConnectGoogle}
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-emerald-500/80 to-teal-600/80 hover:from-emerald-500 hover:to-teal-600 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <ExternalLink className="w-4 h-4" />
                Connect Google Account
              </>
            )}
          </button>

          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
              What you'll get:
            </h4>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>✅ All your contacts from tuescalarina3@gmail.com</li>
              <li>✅ Contact photos and details</li>
              <li>✅ Email addresses and phone numbers</li>
              <li>✅ Organizations and job titles</li>
              <li>✅ Search and filtering</li>
              <li>✅ No more dummy data!</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Google Contacts
          </h1>
          {userInfo && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Connected as {userInfo.name} ({userInfo.email})
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowStats(!showStats)}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            {showStats ? 'Hide' : 'Show'} Stats
          </button>

          <button
            onClick={fetchContacts}
            disabled={loading}
            className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleSignOut}
            className="px-4 py-2 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Success Message */}
      <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
        <div className="flex items-center gap-3">
          <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
          <div>
            <h3 className="font-medium text-green-900 dark:text-green-100">
              Real Google Contacts Connected! 🎉
            </h3>
            <p className="text-sm text-green-700 dark:text-green-300">
              You're now viewing your actual Google Contacts, not sample data.
            </p>
          </div>
        </div>
      </div>

      {/* Statistics */}
      {showStats && (
        <div className="mb-6 grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.total}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Contacts</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {stats.withEmail}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">With Email</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats.withPhone}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">With Phone</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {stats.withOrganization}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">With Organization</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {stats.withPhoto}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">With Photo</div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search contacts by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-emerald-600 dark:text-emerald-400" />
          <span className="ml-3 text-gray-600 dark:text-gray-400">
            Loading your Google Contacts...
          </span>
        </div>
      )}

      {/* Contacts List */}
      {!loading && filteredContacts.length === 0 && searchQuery && (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No contacts found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Try adjusting your search terms
          </p>
        </div>
      )}

      {!loading && filteredContacts.length === 0 && !searchQuery && (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No contacts found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Your Google Contacts might be empty or there was an issue fetching them
          </p>
        </div>
      )}

      {!loading && filteredContacts.length > 0 && (
        <div className="grid gap-4">
          {filteredContacts.map((contact) => (
            <div
              key={contact.id}
              className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                {/* Contact Photo */}
                <div className="flex-shrink-0">
                  {contact.photos && contact.photos.length > 0 ? (
                    <img
                      src={contact.photos[0].url}
                      alt={contact.displayName}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Contact Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">
                    {contact.displayName}
                  </h3>

                  {/* Email */}
                  {contact.emails && contact.emails.length > 0 && (
                    <div className="flex items-center gap-2 mt-1">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {contact.emails[0].value}
                      </span>
                    </div>
                  )}

                  {/* Phone */}
                  {contact.phoneNumbers && contact.phoneNumbers.length > 0 && (
                    <div className="flex items-center gap-2 mt-1">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {contact.phoneNumbers[0].value}
                      </span>
                    </div>
                  )}

                  {/* Organization */}
                  {contact.organizations && contact.organizations.length > 0 && (
                    <div className="flex items-center gap-2 mt-1">
                      <Building className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {contact.organizations[0].name}
                        {contact.organizations[0].title && ` - ${contact.organizations[0].title}`}
                      </span>
                    </div>
                  )}
                </div>

                {/* More info indicator */}
                {(contact.emails && contact.emails.length > 1) ||
                 (contact.phoneNumbers && contact.phoneNumbers.length > 1) ||
                 (contact.organizations && contact.organizations.length > 1) ? (
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                        +{[
                          ...(contact.emails || []),
                          ...(contact.phoneNumbers || []),
                          ...(contact.organizations || [])
                        ].length - 1}
                      </span>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RealGoogleContactsComponent;