import React, { useState, useEffect, useCallback } from 'react';
import { Users, UserPlus, Search, Phone, Mail, Building, MapPin, AlertCircle, Loader2, RefreshCw, Star } from 'lucide-react';

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  emails: string[];
  phones: string[];
  company?: string;
  title?: string;
  addresses: Array<{
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  }>;
  favorite?: boolean;
  groups?: string[];
  notes?: string;
  birthday?: string;
  createdAt: string;
  updatedAt: string;
}

interface ContactsResponse {
  contacts: Contact[];
  total: number;
  page: number;
  pageSize: number;
}

const ContactsApp: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchContacts = useCallback(async (showRefreshLoading = false) => {
    try {
      if (showRefreshLoading) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Check if CardDAV credentials exist
      const cardDavPassword = localStorage.getItem('carddav_password');
      if (!cardDavPassword) {
        console.log('CardDAV credentials not found, using dummy data');
        // Use dummy data if no credentials
        setContacts(getDummyContacts());
        return;
      }

      // Try to fetch from CardDAV API
      const response = await fetch('/api/contacts', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${cardDavPassword}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        // If API fails, fallback to dummy data
        console.log('CardDAV API not available, using dummy data');
        setContacts(getDummyContacts());
        return;
      }

      const data: ContactsResponse = await response.json();
      setContacts(data.contacts || []);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load contacts';
      console.log('Error fetching contacts:', errorMessage);

      // Always fallback to dummy data on error
      setContacts(getDummyContacts());
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const handleToggleFavorite = async (contactId: string) => {
    try {
      const cardDavPassword = localStorage.getItem('carddav_password');
      const contact = contacts.find(c => c.id === contactId);
      if (!contact) return;

      if (cardDavPassword) {
        const response = await fetch(`/api/contacts/${contactId}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${cardDavPassword}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ favorite: !contact.favorite })
        });

        if (response.ok) {
          // Update local state
          setContacts(prev => prev.map(c =>
            c.id === contactId
              ? { ...c, favorite: !c.favorite, updatedAt: new Date().toISOString() }
              : c
          ));

          // Update selected contact if it's the same
          if (selectedContact?.id === contactId) {
            setSelectedContact(prev => prev ? { ...prev, favorite: !prev.favorite } : null);
          }
          return;
        }
      }

      // Just update local state if no API or API fails
      setContacts(prev => prev.map(c =>
        c.id === contactId
          ? { ...c, favorite: !c.favorite, updatedAt: new Date().toISOString() }
          : c
      ));

      if (selectedContact?.id === contactId) {
        setSelectedContact(prev => prev ? { ...prev, favorite: !prev.favorite } : null);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update contact';
      console.error('Error updating contact:', errorMessage);

      // Still update local state even on error
      setContacts(prev => prev.map(c =>
        c.id === contactId
          ? { ...c, favorite: !c.favorite, updatedAt: new Date().toISOString() }
          : c
      ));

      if (selectedContact?.id === contactId) {
        setSelectedContact(prev => prev ? { ...prev, favorite: !prev.favorite } : null);
      }
    }
  };

  const getDummyContacts = (): Contact[] => [
    {
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      emails: ['john.doe@example.com', 'j.doe@company.com'],
      phones: ['+1 (555) 123-4567', '+1 (555) 987-6543'],
      company: 'Tech Corp',
      title: 'Senior Software Engineer',
      addresses: [{
        street: '123 Main St',
        city: 'San Francisco',
        state: 'CA',
        zip: '94102',
        country: 'USA'
      }],
      favorite: true,
      groups: ['Work', 'Engineering'],
      notes: 'Met at tech conference 2023',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T14:30:00Z'
    },
    {
      id: '2',
      firstName: 'Jane',
      lastName: 'Smith',
      emails: ['jane.smith@example.com'],
      phones: ['+1 (555) 234-5678'],
      company: 'Design Studio',
      title: 'UX Designer',
      addresses: [{
        street: '456 Oak Ave',
        city: 'New York',
        state: 'NY',
        zip: '10001',
        country: 'USA'
      }],
      favorite: false,
      groups: ['Design', 'Clients'],
      createdAt: '2024-01-14T15:00:00Z',
      updatedAt: '2024-01-15T11:20:00Z'
    },
    {
      id: '3',
      firstName: 'Bob',
      lastName: 'Johnson',
      emails: ['bob.j@example.com', 'bobby@personal.com'],
      phones: ['+1 (555) 345-6789'],
      company: 'StartupXYZ',
      title: 'Product Manager',
      favorite: false,
      groups: ['Work', 'Product'],
      createdAt: '2024-01-13T09:00:00Z',
      updatedAt: '2024-01-15T16:45:00Z'
    },
    {
      id: '4',
      firstName: 'Alice',
      lastName: 'Brown',
      emails: ['alice.brown@example.com'],
      phones: ['+1 (555) 456-7890'],
      company: 'Marketing Agency',
      title: 'Marketing Director',
      addresses: [{
        street: '789 Pine Rd',
        city: 'Los Angeles',
        state: 'CA',
        zip: '90001',
        country: 'USA'
      }],
      favorite: true,
      groups: ['Marketing', 'VIP'],
      createdAt: '2024-01-12T14:00:00Z',
      updatedAt: '2024-01-14T10:30:00Z'
    },
    {
      id: '5',
      firstName: 'Charlie',
      lastName: 'Wilson',
      emails: ['charlie.w@example.com'],
      phones: ['+1 (555) 567-8901'],
      company: 'Freelance',
      title: 'Developer',
      favorite: false,
      groups: ['Freelancers'],
      createdAt: '2024-01-11T11:00:00Z',
      updatedAt: '2024-01-15T17:00:00Z'
    }
  ];

  const filteredContacts = contacts.filter(contact => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    const fullName = `${contact.firstName} ${contact.lastName}`.toLowerCase();
    const emailMatch = contact.emails.some(email => email.toLowerCase().includes(query));
    const phoneMatch = contact.phones.some(phone => phone.includes(query));
    const companyMatch = contact.company?.toLowerCase().includes(query);

    return fullName.includes(query) || emailMatch || phoneMatch || companyMatch;
  });

  const contactsStats = {
    total: contacts.length,
    favorites: contacts.filter(c => c.favorite).length,
    companies: new Set(contacts.map(c => c.company).filter(Boolean)).size
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Contacts</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Manage your professional network
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchContacts(true)}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 glass-button rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
            <UserPlus className="w-4 h-4" />
            Add Contact
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-red-800 font-medium">Error</p>
            <p className="text-sm text-red-600">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Contacts</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{contactsStats.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="glass-card rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Favorites</p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{contactsStats.favorites}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
              <Star className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="glass-card rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Companies</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{contactsStats.companies}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
              <Building className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="glass-card rounded-lg p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search contacts by name, email, phone, or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contacts List */}
        <div className="lg:col-span-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-3 text-gray-600 dark:text-gray-400">Loading contacts...</span>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {searchQuery ? 'No contacts found' : 'No contacts yet'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {searchQuery
                  ? `No contacts matching "${searchQuery}"`
                  : 'Start building your network by adding contacts'
                }
              </p>
              {!searchQuery && (
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                  Add Contact
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredContacts.map((contact) => (
                <div
                  key={contact.id}
                  onClick={() => setSelectedContact(contact)}
                  className={`glass-card rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                    selectedContact?.id === contact.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {getInitials(contact.firstName, contact.lastName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900 dark:text-white truncate">
                          {contact.firstName} {contact.lastName}
                        </h3>
                        {contact.favorite && (
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                        )}
                      </div>
                      {contact.title && contact.company && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {contact.title} at {contact.company}
                        </p>
                      )}
                      {contact.emails.length > 0 && (
                        <p className="text-sm text-blue-600 dark:text-blue-400 truncate">
                          {contact.emails[0]}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFavorite(contact.id);
                      }}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          contact.favorite
                            ? 'text-yellow-500 fill-yellow-500'
                            : 'text-gray-400'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Contact Details */}
        <div className="lg:col-span-1">
          {selectedContact ? (
            <div className="glass-card rounded-lg p-6">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">
                  {getInitials(selectedContact.firstName, selectedContact.lastName)}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {selectedContact.firstName} {selectedContact.lastName}
                </h3>
                {selectedContact.title && selectedContact.company && (
                  <>
                    <p className="text-gray-600 dark:text-gray-400">
                      {selectedContact.title}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      {selectedContact.company}
                    </p>
                  </>
                )}
              </div>

              <div className="space-y-4">
                {selectedContact.emails.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email
                    </h4>
                    <div className="space-y-1">
                      {selectedContact.emails.map((email, index) => (
                        <a
                          key={index}
                          href={`mailto:${email}`}
                          className="block text-sm text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {email}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {selectedContact.phones.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Phone
                    </h4>
                    <div className="space-y-1">
                      {selectedContact.phones.map((phone, index) => (
                        <a
                          key={index}
                          href={`tel:${phone}`}
                          className="block text-sm text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {phone}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {selectedContact.addresses.length > 0 && selectedContact.addresses[0] && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Address
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {[
                        selectedContact.addresses[0].street,
                        selectedContact.addresses[0].city,
                        selectedContact.addresses[0].state,
                        selectedContact.addresses[0].zip,
                        selectedContact.addresses[0].country
                      ].filter(Boolean).join(', ')}
                    </p>
                  </div>
                )}

                {selectedContact.groups && selectedContact.groups.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Groups</h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedContact.groups.map((group, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full"
                        >
                          {group}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedContact.notes && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedContact.notes}
                    </p>
                  </div>
                )}

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500">
                    Created: {formatDate(selectedContact.createdAt)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Updated: {formatDate(selectedContact.updatedAt)}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-card rounded-lg p-6 text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Select a contact
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Choose a contact from the list to view details
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactsApp;