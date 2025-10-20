'use client'

import { useState, useEffect } from 'react'
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Save,
  Mail,
  Phone,
  Building,
  MapPin,
  Filter,
  UserPlus,
  Star,
  Calendar,
  Download,
  Upload,
  FileDown,
  Clock,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  User,
  MailIcon,
  Video,
  MoreVertical,
  Copy,
  Share2,
  RefreshCw,
  Heart,
  Tag,
  Camera,
  TrendingUp,
  Activity,
  Grid,
  List
} from 'lucide-react'

interface Contact {
  id: number
  firstName: string
  lastName: string
  email: string
  phone: string
  company: string
  position: string
  address: string
  groups: string[]
  tags: string[]
  isFavorite: boolean
  notes: string
  birthday?: string
  profilePhoto?: string
  website?: string
  linkedIn?: string
  createdAt: string
  lastContacted?: string
  contactCount: number
  duplicate?: boolean
  googleId?: string
  syncStatus: 'synced' | 'pending' | 'error'
}

interface ContactActivity {
  id: string
  contactId: number
  type: 'email' | 'call' | 'meeting' | 'note'
  title: string
  description: string
  date: string
  time: string
}

interface ContactAnalytics {
  totalContacts: number
  favoriteContacts: number
  recentContacts: number
  mostContacted: { contact: Contact; count: number }[]
  contactsByCompany: { company: string; count: number }[]
  upcomingBirthdays: Contact[]
}

export default function Contacts() {
  const [contacts, setContacts] = useState<Contact[]>([
    {
      id: 1,
      firstName: 'John',
      lastName: 'Smith',
      email: 'john.smith@company.com',
      phone: '+1 (555) 123-4567',
      company: 'Tech Solutions Inc.',
      position: 'Senior Developer',
      address: '123 Main St, New York, NY 10001',
      groups: ['Work', 'Development'],
      tags: ['React', 'Node.js', 'Senior'],
      isFavorite: true,
      notes: 'Met at tech conference. Excellent React developer.',
      birthday: '1985-06-15',
      profilePhoto: '/api/placeholder/150/150',
      website: 'https://johnsmith.dev',
      linkedIn: 'https://linkedin.com/in/johnsmith',
      createdAt: '2024-01-10',
      lastContacted: '2024-01-17',
      contactCount: 12,
      syncStatus: 'synced',
      googleId: 'google_1234567890'
    },
    {
      id: 2,
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah.j@marketing.com',
      phone: '+1 (555) 234-5678',
      company: 'Marketing Pro',
      position: 'Marketing Director',
      address: '456 Oak Ave, Los Angeles, CA 90001',
      groups: ['Work', 'Marketing'],
      tags: ['Marketing', 'Strategy', 'Director'],
      isFavorite: false,
      notes: 'Key contact for Q4 marketing campaigns.',
      birthday: '1988-09-22',
      website: 'https://marketingpro.com',
      linkedIn: 'https://linkedin.com/in/sarahjohnson',
      createdAt: '2024-01-08',
      lastContacted: '2024-01-16',
      contactCount: 8,
      syncStatus: 'synced',
      googleId: 'google_0987654321'
    },
    {
      id: 3,
      firstName: 'Michael',
      lastName: 'Chen',
      email: 'm.chen@design.com',
      phone: '+1 (555) 345-6789',
      company: 'Creative Studio',
      position: 'UX Designer',
      address: '789 Pine St, San Francisco, CA 94102',
      groups: ['Work', 'Design'],
      tags: ['UX', 'UI', 'Designer', 'Creative'],
      isFavorite: true,
      notes: 'Great portfolio. Collaborated on mobile app design.',
      birthday: '1990-03-10',
      website: 'https://michaelchen.design',
      linkedIn: 'https://linkedin.com/in/michaelchen',
      createdAt: '2024-01-05',
      lastContacted: '2024-01-15',
      contactCount: 15,
      duplicate: false,
      syncStatus: 'synced',
      googleId: 'google_1122334455'
    },
    {
      id: 4,
      firstName: 'Emily',
      lastName: 'Davis',
      email: 'emily.davis@finance.com',
      phone: '+1 (555) 456-7890',
      company: 'Finance Corp',
      position: 'CFO',
      address: '321 Elm St, Chicago, IL 60601',
      groups: ['Work', 'Finance'],
      tags: ['Finance', 'CFO', 'Investment'],
      isFavorite: false,
      notes: 'Financial advisor for investment opportunities.',
      birthday: '1982-11-28',
      website: 'https://financecorp.com',
      linkedIn: 'https://linkedin.com/in/emilydavis',
      createdAt: '2024-01-03',
      lastContacted: '2024-01-14',
      contactCount: 6,
      syncStatus: 'synced',
      googleId: 'google_5566778899'
    },
    {
      id: 5,
      firstName: 'Robert',
      lastName: 'Wilson',
      email: 'robert.w@startup.com',
      phone: '+1 (555) 567-8901',
      company: 'Startup Hub',
      position: 'CEO',
      address: '654 Maple Dr, Austin, TX 78701',
      groups: ['Business', 'Investors'],
      tags: ['CEO', 'Investor', 'Startup'],
      isFavorite: true,
      notes: 'Potential investor for our next round.',
      birthday: '1979-04-05',
      website: 'https://startuphub.io',
      linkedIn: 'https://linkedin.com/in/robertwilson',
      createdAt: '2024-01-01',
      lastContacted: '2024-01-18',
      contactCount: 20,
      syncStatus: 'synced',
      googleId: 'google_9988776655'
    },
    {
      id: 6,
      firstName: 'Lisa',
      lastName: 'Anderson',
      email: 'lisa.anderson@techcorp.com',
      phone: '+1 (555) 678-9012',
      company: 'TechCorp',
      position: 'Product Manager',
      address: '111 Broad St, Boston, MA 02110',
      groups: ['Work', 'Product'],
      tags: ['Product', 'Agile', 'Management'],
      isFavorite: false,
      notes: 'Product lead for mobile app project.',
      birthday: '1987-08-12',
      website: 'https://techcorp.com',
      linkedIn: 'https://linkedin.com/in/lisaanderson',
      createdAt: '2024-01-12',
      lastContacted: '2024-01-13',
      contactCount: 4,
      syncStatus: 'pending',
      googleId: 'google_1234567891'
    },
    {
      id: 7,
      firstName: 'James',
      lastName: 'Miller',
      email: 'james.miller@consulting.com',
      phone: '+1 (555) 789-0123',
      company: 'Consulting Group',
      position: 'Senior Consultant',
      address: '222 Market St, Seattle, WA 98101',
      groups: ['Business', 'Consulting'],
      tags: ['Consultant', 'Strategy', 'Senior'],
      isFavorite: false,
      notes: 'Business strategy consultant.',
      birthday: '1984-12-03',
      website: 'https://consultinggroup.com',
      linkedIn: 'https://linkedin.com/in/jamesmiller',
      createdAt: '2024-01-11',
      lastContacted: '2024-01-12',
      contactCount: 3,
      duplicate: true,
      syncStatus: 'error',
      googleId: 'google_2345678901'
    }
  ])

  const [contactActivities] = useState<ContactActivity[]>([
    {
      id: '1',
      contactId: 1,
      type: 'email',
      title: 'Project Update Discussion',
      description: 'Discussed Q1 planning and roadmap priorities',
      date: '2024-01-17',
      time: '14:30'
    },
    {
      id: '2',
      contactId: 3,
      type: 'meeting',
      title: 'Design Review Meeting',
      description: 'Reviewed mobile app UI/UX designs',
      date: '2024-01-16',
      time: '10:00'
    },
    {
      id: '3',
      contactId: 5,
      type: 'call',
      title: 'Investment Discussion',
      description: 'Initial investment call - positive feedback',
      date: '2024-01-18',
      time: '15:45'
    }
  ])

  const [showNewContact, setShowNewContact] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [showContactDetails, setShowContactDetails] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGroup, setSelectedGroup] = useState('All')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedCompany, setSelectedCompany] = useState('All')
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [showDuplicatesOnly, setShowDuplicatesOnly] = useState(false)
  const [sortBy, setSortBy] = useState<'name' | 'company' | 'lastContacted' | 'createdAt'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showBirthdays, setShowBirthdays] = useState(false)
  const [selectedContacts, setSelectedContacts] = useState<number[]>([])
  const [showConfirmDelete, setShowConfirmDelete] = useState<number | null>(null)
  const [searchFilters, setSearchFilters] = useState({
    hasBirthday: false,
    hasPhoto: false,
    syncStatus: 'all' as 'all' | 'synced' | 'pending' | 'error',
    dateRange: 'all' as 'all' | 'today' | 'week' | 'month'
  })

  const [newContact, setNewContact] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    position: '',
    address: '',
    groups: '',
    tags: '',
    notes: '',
    birthday: '',
    website: '',
    linkedIn: ''
  })

  const groups = ['All', 'Work', 'Business', 'Development', 'Marketing', 'Design', 'Finance', 'Investors', 'Personal']
  const availableTags = ['React', 'Node.js', 'Marketing', 'Strategy', 'UX', 'UI', 'Designer', 'Creative', 'Product', 'Agile', 'Management', 'Consultant', 'Senior', 'CEO', 'Investor', 'Startup', 'Finance', 'CFO', 'Investment']
  const companies = ['All', 'Tech Solutions Inc.', 'Marketing Pro', 'Creative Studio', 'Finance Corp', 'Startup Hub', 'TechCorp', 'Consulting Group']

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch =
      contact.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesGroup = selectedGroup === 'All' || contact.groups.includes(selectedGroup)
    const matchesTags = selectedTags.length === 0 || selectedTags.some(tag => contact.tags.includes(tag))
    const matchesCompany = selectedCompany === 'All' || contact.company === selectedCompany
    const matchesFavorites = !showFavoritesOnly || contact.isFavorite
    const matchesDuplicates = !showDuplicatesOnly || contact.duplicate
    const matchesSyncStatus = searchFilters.syncStatus === 'all' || contact.syncStatus === searchFilters.syncStatus
    const matchesBirthday = !searchFilters.hasBirthday || contact.birthday
    const matchesPhoto = !searchFilters.hasPhoto || contact.profilePhoto

    // Date range filtering
    let matchesDateRange = true
    if (searchFilters.dateRange !== 'all') {
      const contactDate = new Date(contact.createdAt)
      const now = new Date()
      switch (searchFilters.dateRange) {
        case 'today':
          matchesDateRange = contactDate.toDateString() === now.toDateString()
          break
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          matchesDateRange = contactDate >= weekAgo
          break
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          matchesDateRange = contactDate >= monthAgo
          break
      }
    }

    return matchesSearch && matchesGroup && matchesTags && matchesCompany &&
           matchesFavorites && matchesDuplicates && matchesSyncStatus &&
           matchesBirthday && matchesPhoto && matchesDateRange
  })

  // Sorting logic
  const sortedContacts = [...filteredContacts].sort((a, b) => {
    let comparison = 0
    switch (sortBy) {
      case 'name':
        comparison = `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
        break
      case 'company':
        comparison = a.company.localeCompare(b.company)
        break
      case 'lastContacted':
        comparison = (a.lastContacted || '').localeCompare(b.lastContacted || '')
        break
      case 'createdAt':
        comparison = a.createdAt.localeCompare(b.createdAt)
        break
    }
    return sortOrder === 'asc' ? comparison : -comparison
  })

  // Analytics
  const getAnalytics = (): ContactAnalytics => {
    const upcomingBirthdays = contacts
      .filter(c => c.birthday)
      .map(c => ({ ...c, birthdayDate: new Date(c.birthday!) }))
      .filter(c => {
        const today = new Date()
        const thisYear = today.getFullYear()
        const birthdayThisYear = new Date(c.birthdayDate.setFullYear(thisYear))
        const daysUntilBirthday = Math.ceil((birthdayThisYear.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        return daysUntilBirthday >= 0 && daysUntilBirthday <= 30
      })
      .sort((a, b) => {
        const dateA = new Date(a.birthday!)
        const dateB = new Date(b.birthday!)
        const today = new Date()
        const thisYear = today.getFullYear()
        const birthdayA = new Date(dateA.setFullYear(thisYear))
        const birthdayB = new Date(dateB.setFullYear(thisYear))
        return birthdayA.getTime() - birthdayB.getTime()
      })

    const mostContacted = contacts
      .sort((a, b) => b.contactCount - a.contactCount)
      .slice(0, 5)
      .map(contact => ({ contact, count: contact.contactCount }))

    const contactsByCompany = contacts.reduce((acc, contact) => {
      if (contact.company) {
        acc[contact.company] = (acc[contact.company] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)

    return {
      totalContacts: contacts.length,
      favoriteContacts: contacts.filter(c => c.isFavorite).length,
      recentContacts: contacts.filter(c => {
        const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        return new Date(c.lastContacted || c.createdAt) >= lastWeek
      }).length,
      mostContacted,
      contactsByCompany: Object.entries(contactsByCompany).map(([company, count]) => ({ company, count })),
      upcomingBirthdays
    }
  }

  // Get contact activities for a specific contact
  const getContactActivities = (contactId: number) => {
    return contactActivities.filter(activity => activity.contactId === contactId)
  }

  // Export functionality
  const exportContacts = (contactIds?: number[]) => {
    const contactsToExport = contactIds
      ? contacts.filter(c => contactIds.includes(c.id))
      : contacts

    const csv = [
      ['First Name', 'Last Name', 'Email', 'Phone', 'Company', 'Position', 'Groups', 'Tags', 'Birthday', 'Notes'],
      ...contactsToExport.map(c => [
        c.firstName,
        c.lastName,
        c.email,
        c.phone,
        c.company,
        c.position,
        c.groups.join(';'),
        c.tags.join(';'),
        c.birthday || '',
        c.notes
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `contacts_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // VCard generation
  const generateVCard = (contact: Contact) => {
    const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${contact.firstName} ${contact.lastName}
N:${contact.lastName};${contact.firstName};;;
EMAIL:${contact.email}
TEL:${contact.phone}
ORG:${contact.company}
TITLE:${contact.position}
ADR:;;${contact.address};;;;
URL:${contact.website || ''}
NOTE:${contact.notes}
BDAY:${contact.birthday || ''}
END:VCARD`

    const blob = new Blob([vcard], { type: 'text/vcard' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${contact.firstName}_${contact.lastName}.vcf`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Duplicate detection
  const detectDuplicates = () => {
    const duplicates: Contact[][] = []
    const processed = new Set<number>()

    contacts.forEach(contact => {
      if (processed.has(contact.id)) return

      const similarContacts = contacts.filter(c =>
        c.id !== contact.id &&
        !processed.has(c.id) &&
        (c.email.toLowerCase() === contact.email.toLowerCase() ||
         c.phone === contact.phone ||
         `${c.firstName} ${c.lastName}`.toLowerCase() === `${contact.firstName} ${contact.lastName}`.toLowerCase())
      )

      if (similarContacts.length > 0) {
        duplicates.push([contact, ...similarContacts])
        similarContacts.forEach(c => processed.add(c.id))
      }
      processed.add(contact.id)
    })

    return duplicates
  }

  const duplicates = detectDuplicates()

  const handleCreateContact = () => {
    if (newContact.firstName && newContact.lastName) {
      const contact: Contact = {
        id: Date.now(),
        firstName: newContact.firstName,
        lastName: newContact.lastName,
        email: newContact.email,
        phone: newContact.phone,
        company: newContact.company,
        position: newContact.position,
        address: newContact.address,
        groups: newContact.groups.split(',').map(g => g.trim()).filter(g => g),
        tags: newContact.tags.split(',').map(t => t.trim()).filter(t => t),
        isFavorite: false,
        notes: newContact.notes,
        birthday: newContact.birthday || undefined,
        website: newContact.website || undefined,
        linkedIn: newContact.linkedIn || undefined,
        createdAt: new Date().toISOString().split('T')[0],
        lastContacted: undefined,
        contactCount: 0,
        duplicate: false,
        syncStatus: 'pending'
      }
      setContacts([contact, ...contacts])
      setNewContact({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        company: '',
        position: '',
        address: '',
        groups: '',
        tags: '',
        notes: '',
        birthday: '',
        website: '',
        linkedIn: ''
      })
      setShowNewContact(false)
    }
  }

  const handleUpdateContact = () => {
    if (editingContact) {
      setContacts(contacts.map(contact =>
        contact.id === editingContact.id ? editingContact : contact
      ))
      setEditingContact(null)
    }
  }

  const handleDeleteContact = (id: number) => {
    setContacts(contacts.filter(contact => contact.id !== id))
    setShowConfirmDelete(null)
  }

  const handleToggleFavorite = (id: number) => {
    setContacts(contacts.map(contact =>
      contact.id === id ? { ...contact, isFavorite: !contact.isFavorite } : contact
    ))
  }

  const handleSelectContact = (id: number) => {
    if (selectedContacts.includes(id)) {
      setSelectedContacts(selectedContacts.filter(cId => cId !== id))
    } else {
      setSelectedContacts([...selectedContacts, id])
    }
  }

  const handleSelectAll = () => {
    if (selectedContacts.length === sortedContacts.length) {
      setSelectedContacts([])
    } else {
      setSelectedContacts(sortedContacts.map(c => c.id))
    }
  }

  const handleMergeContacts = (contactIds: number[]) => {
    const contactsToMerge = contacts.filter(c => contactIds.includes(c.id))
    if (contactsToMerge.length < 2) return

    const primaryContact = contactsToMerge[0]
    const mergedContact: Contact = {
      ...primaryContact,
      email: primaryContact.email || contactsToMerge.find(c => c.email)?.email || '',
      phone: primaryContact.phone || contactsToMerge.find(c => c.phone)?.phone || '',
      groups: [...new Set(contactsToMerge.flatMap(c => c.groups))],
      tags: [...new Set(contactsToMerge.flatMap(c => c.tags))],
      notes: contactsToMerge.map(c => c.notes).filter(n => n).join('\n---\n'),
      contactCount: contactsToMerge.reduce((sum, c) => sum + c.contactCount, 0)
    }

    setContacts(contacts.filter(c => !contactIds.includes(c.id)).concat(mergedContact))
    setSelectedContacts([])
  }

  const handleSyncWithGoogle = () => {
    setContacts(contacts.map(contact => ({
      ...contact,
      syncStatus: 'synced' as const,
      googleId: `google_${Date.now()}_${contact.id}`
    })))
  }

  
  return (
    <div className="p-8 overflow-auto h-full">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Contacts</h1>
            <p className="text-gray-600 mt-2">Manage your professional and personal contacts</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAnalytics(!showAnalytics)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                showAnalytics
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <TrendingUp className="w-4 h-4 inline mr-2" />
              Analytics
            </button>
            <button
              onClick={handleSyncWithGoogle}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Sync Google
            </button>
            <button
              onClick={() => setShowNewContact(true)}
              className="bg-primary-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-600 transition-colors flex items-center"
            >
              <UserPlus className="w-5 h-5 mr-2" />
              Add Contact
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border mb-6">
        <div className="p-4 border-b">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name, email, company, tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="name">Sort by Name</option>
                <option value="company">Sort by Company</option>
                <option value="lastContacted">Sort by Last Contact</option>
                <option value="createdAt">Sort by Date Added</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 border rounded-lg hover:bg-gray-50"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="px-3 py-2 border rounded-lg hover:bg-gray-50"
              >
                {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 border-b">
          <div className="flex flex-wrap gap-4">
            {/* Group Filters */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Groups:</span>
              <div className="flex gap-1">
                {groups.map(group => (
                  <button
                    key={group}
                    onClick={() => setSelectedGroup(group)}
                    className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                      selectedGroup === group
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {group}
                  </button>
                ))}
              </div>
            </div>

            {/* Company Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Company:</span>
              <select
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                className="px-3 py-1 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {companies.map(company => (
                  <option key={company} value={company}>{company}</option>
                ))}
              </select>
            </div>

            {/* Quick Filters */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                  showFavoritesOnly
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Star className={`w-3 h-3 inline mr-1 ${showFavoritesOnly ? 'fill-current' : ''}`} />
                Favorites
              </button>
              <button
                onClick={() => setShowDuplicatesOnly(!showDuplicatesOnly)}
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                  showDuplicatesOnly
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <AlertCircle className={`w-3 h-3 inline mr-1`} />
                Duplicates
              </button>
              <button
                onClick={() => setShowBirthdays(!showBirthdays)}
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                  showBirthdays
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Calendar className={`w-3 h-3 inline mr-1`} />
                Birthdays
              </button>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedContacts.length > 0 && (
          <div className="p-4 bg-blue-50 border-b">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-700">
                {selectedContacts.length} contacts selected
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => exportContacts(selectedContacts)}
                  className="text-xs px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Export Selected
                </button>
                {selectedContacts.length > 1 && (
                  <button
                    onClick={() => handleMergeContacts(selectedContacts)}
                    className="text-xs px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600"
                  >
                    Merge Selected
                  </button>
                )}
                <button
                  onClick={() => setSelectedContacts([])}
                  className="text-xs px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Advanced Filters Toggle */}
        <div className="p-4">
          <details className="cursor-pointer">
            <summary className="text-sm font-medium text-gray-700 mb-3">Advanced Filters</summary>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={searchFilters.hasBirthday}
                  onChange={(e) => setSearchFilters({ ...searchFilters, hasBirthday: e.target.checked })}
                  className="rounded"
                />
                <label className="text-sm">Has Birthday</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={searchFilters.hasPhoto}
                  onChange={(e) => setSearchFilters({ ...searchFilters, hasPhoto: e.target.checked })}
                  className="rounded"
                />
                <label className="text-sm">Has Photo</label>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm">Sync Status:</label>
                <select
                  value={searchFilters.syncStatus}
                  onChange={(e) => setSearchFilters({ ...searchFilters, syncStatus: e.target.value as any })}
                  className="text-sm px-2 py-1 border rounded"
                >
                  <option value="all">All</option>
                  <option value="synced">Synced</option>
                  <option value="pending">Pending</option>
                  <option value="error">Error</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm">Date Range:</label>
                <select
                  value={searchFilters.dateRange}
                  onChange={(e) => setSearchFilters({ ...searchFilters, dateRange: e.target.value as any })}
                  className="text-sm px-2 py-1 border rounded"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>
              </div>
            </div>
          </details>
        </div>
      </div>

      {/* Birthday Reminders */}
      {showBirthdays && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-6">
          <h3 className="text-lg font-semibold text-purple-800 mb-3">Upcoming Birthdays</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {getAnalytics().upcomingBirthdays.map(contact => (
              <div key={contact.id} className="bg-white p-3 rounded-lg border border-purple-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {contact.firstName[0]}{contact.lastName[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{contact.firstName} {contact.lastName}</p>
                      <p className="text-xs text-gray-500">{contact.birthday}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => window.open(`mailto:${contact.email}`)}
                    className="text-purple-500 hover:text-purple-700"
                  >
                    <Mail className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Duplicate Detection */}
      {showDuplicatesOnly && duplicates.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <h3 className="text-lg font-semibold text-red-800 mb-3">Duplicate Contacts Found</h3>
          {duplicates.map((duplicateGroup, index) => (
            <div key={index} className="bg-white p-3 rounded-lg border border-red-200 mb-3">
              <p className="text-sm font-medium text-red-700 mb-2">
                Potential duplicates: {duplicateGroup.map(c => `${c.firstName} ${c.lastName}`).join(', ')}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleMergeContacts(duplicateGroup.map(c => c.id))}
                  className="text-xs px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Merge
                </button>
                <button
                  onClick={() => setShowDuplicatesOnly(false)}
                  className="text-xs px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  Ignore
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Analytics Dashboard */}
      {showAnalytics && (
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Contact Analytics</h3>
          {(() => {
            const analytics = getAnalytics()
            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{analytics.totalContacts}</div>
                  <div className="text-sm text-gray-600">Total Contacts</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{analytics.favoriteContacts}</div>
                  <div className="text-sm text-gray-600">Favorites</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{analytics.recentContacts}</div>
                  <div className="text-sm text-gray-600">Recently Contacted</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{duplicates.reduce((sum, group) => sum + group.length, 0)}</div>
                  <div className="text-sm text-gray-600">Duplicates Found</div>
                </div>
              </div>
            )
          })()}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Most Contacted</h4>
              <div className="space-y-2">
                {getAnalytics().mostContacted.map(({ contact, count }, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{contact.firstName} {contact.lastName}</span>
                    <span className="text-sm font-medium text-gray-800">{count} interactions</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Contacts by Company</h4>
              <div className="space-y-2">
                {getAnalytics().contactsByCompany.map(({ company, count }, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{company}</span>
                    <span className="text-sm font-medium text-gray-800">{count} contacts</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contacts List/Grid View */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        {/* List Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={handleSelectAll}
              className="flex items-center text-sm text-gray-600 hover:text-gray-800"
            >
              {selectedContacts.length === sortedContacts.length && sortedContacts.length > 0 ? (
                <CheckSquare className="w-4 h-4 mr-1" />
              ) : (
                <Square className="w-4 h-4 mr-1" />
              )}
              Select All
            </button>
            <span className="text-sm text-gray-500">
              {sortedContacts.length} contacts found
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => exportContacts()}
              className="text-sm px-3 py-1 border rounded-lg hover:bg-gray-50 flex items-center"
            >
              <Download className="w-4 h-4 mr-1" />
              Export All
            </button>
          </div>
        </div>

        {/* Grid View */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedContacts.map((contact) => (
              <div key={contact.id} className="bg-white border rounded-xl p-6 hover:shadow-md transition-all relative">
                {/* Selection Checkbox */}
                <button
                  onClick={() => handleSelectContact(contact.id)}
                  className="absolute top-4 left-4 z-10"
                >
                  {selectedContacts.includes(contact.id) ? (
                    <CheckSquare className="w-4 h-4 text-blue-600" />
                  ) : (
                    <Square className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                  )}
                </button>

                {/* Sync Status Indicator */}
                <div className="absolute top-4 right-4">
                  {contact.syncStatus === 'synced' && (
                    <CheckCircle className="w-4 h-4 text-green-500" title="Synced with Google" />
                  )}
                  {contact.syncStatus === 'pending' && (
                    <Clock className="w-4 h-4 text-yellow-500" title="Pending sync" />
                  )}
                  {contact.syncStatus === 'error' && (
                    <AlertCircle className="w-4 h-4 text-red-500" title="Sync error" />
                  )}
                </div>

                {/* Contact Header */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="relative">
                    {contact.profilePhoto ? (
                      <img
                        src={contact.profilePhoto}
                        alt={`${contact.firstName} ${contact.lastName}`}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                        {contact.firstName[0]}{contact.lastName[0]}
                      </div>
                    )}
                    {contact.duplicate && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                        <AlertCircle className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800">
                      {contact.firstName} {contact.lastName}
                    </h3>
                    <p className="text-sm text-gray-600">{contact.position}</p>
                    {contact.company && (
                      <p className="text-sm text-gray-500">{contact.company}</p>
                    )}
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-2 mb-4">
                  {contact.email && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="w-4 h-4 mr-2 text-gray-400" />
                      <a href={`mailto:${contact.email}`} className="hover:text-blue-600 truncate">
                        {contact.email}
                      </a>
                    </div>
                  )}
                  {contact.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="w-4 h-4 mr-2 text-gray-400" />
                      <a href={`tel:${contact.phone}`} className="hover:text-blue-600">
                        {contact.phone}
                      </a>
                    </div>
                  )}
                  {contact.address && (
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                      <span className="truncate">{contact.address}</span>
                    </div>
                  )}
                </div>

                {/* Tags */}
                {contact.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {contact.tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                    {contact.tags.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        +{contact.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* Groups */}
                {contact.groups.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {contact.groups.map((group, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                      >
                        {group}
                      </span>
                    ))}
                  </div>
                )}

                {/* Last Contacted */}
                {contact.lastContacted && (
                  <div className="text-xs text-gray-500 mb-3">
                    Last contacted: {contact.lastContacted}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleToggleFavorite(contact.id)}
                      className="p-2 text-gray-400 hover:text-yellow-500 rounded-lg transition-colors"
                      title="Add to favorites"
                    >
                      <Star className={`w-4 h-4 ${contact.isFavorite ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                    </button>
                    <button
                      onClick={() => setSelectedContact(contact); setShowContactDetails(true)}
                      className="p-2 text-gray-400 hover:text-blue-600 rounded-lg transition-colors"
                      title="View details"
                    >
                      <User className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingContact(contact)}
                      className="p-2 text-gray-400 hover:text-blue-600 rounded-lg transition-colors"
                      title="Edit contact"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => generateVCard(contact)}
                      className="p-2 text-gray-400 hover:text-green-600 rounded-lg transition-colors"
                      title="Export vCard"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setShowConfirmDelete(contact.id)}
                      className="p-2 text-gray-400 hover:text-red-600 rounded-lg transition-colors"
                      title="Delete contact"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* List View */
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">
                    <button
                      onClick={handleSelectAll}
                      className="flex items-center text-sm text-gray-600 hover:text-gray-800"
                    >
                      {selectedContacts.length === sortedContacts.length && sortedContacts.length > 0 ? (
                        <CheckSquare className="w-4 h-4" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="text-left p-3 text-sm font-medium text-gray-700">Name</th>
                  <th className="text-left p-3 text-sm font-medium text-gray-700">Email</th>
                  <th className="text-left p-3 text-sm font-medium text-gray-700">Phone</th>
                  <th className="text-left p-3 text-sm font-medium text-gray-700">Company</th>
                  <th className="text-left p-3 text-sm font-medium text-gray-700">Tags</th>
                  <th className="text-left p-3 text-sm font-medium text-gray-700">Last Contacted</th>
                  <th className="text-left p-3 text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedContacts.map((contact) => (
                  <tr key={contact.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <button
                        onClick={() => handleSelectContact(contact.id)}
                      >
                        {selectedContacts.includes(contact.id) ? (
                          <CheckSquare className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Square className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                        )}
                      </button>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {contact.profilePhoto ? (
                          <img
                            src={contact.profilePhoto}
                            alt=""
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {contact.firstName[0]}{contact.lastName[0]}
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-gray-800">
                            {contact.firstName} {contact.lastName}
                          </div>
                          <div className="text-xs text-gray-500">{contact.position}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline text-sm">
                        {contact.email}
                      </a>
                    </td>
                    <td className="p-3 text-sm text-gray-600">{contact.phone}</td>
                    <td className="p-3 text-sm text-gray-600">{contact.company}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {contact.tags.slice(0, 2).map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                        {contact.tags.length > 2 && (
                          <span className="text-xs text-gray-500">+{contact.tags.length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-sm text-gray-500">
                      {contact.lastContacted || 'Never'}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleToggleFavorite(contact.id)}
                          className="p-1 text-gray-400 hover:text-yellow-500 rounded"
                          title="Add to favorites"
                        >
                          <Star className={`w-4 h-4 ${contact.isFavorite ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                        </button>
                        <button
                          onClick={() => setSelectedContact(contact); setShowContactDetails(true)}
                          className="p-1 text-gray-400 hover:text-blue-600 rounded"
                          title="View details"
                        >
                          <User className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingContact(contact)}
                          className="p-1 text-gray-400 hover:text-blue-600 rounded"
                          title="Edit contact"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setShowConfirmDelete(contact.id)}
                          className="p-1 text-gray-400 hover:text-red-600 rounded"
                          title="Delete contact"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* No Contacts Found */}
        {sortedContacts.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No contacts found</p>
            <button
              onClick={() => setShowNewContact(true)}
              className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              Add Your First Contact
            </button>
          </div>
        )}
      </div>

      {/* Contact Details Modal */}
      {showContactDetails && selectedContact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] mx-4 flex flex-col">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800">Contact Details</h2>
                <button
                  onClick={() => {setShowContactDetails(false); setSelectedContact(null)}}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-6">
              <div className="flex items-start gap-6 mb-6">
                {selectedContact.profilePhoto ? (
                  <img
                    src={selectedContact.profilePhoto}
                    alt=""
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold text-3xl">
                    {selectedContact.firstName[0]}{selectedContact.lastName[0]}
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">
                    {selectedContact.firstName} {selectedContact.lastName}
                  </h3>
                  <p className="text-lg text-gray-600 mb-2">{selectedContact.position}</p>
                  {selectedContact.company && (
                    <p className="text-gray-600 mb-2">{selectedContact.company}</p>
                  )}
                  <div className="flex gap-2">
                    {selectedContact.groups.map((group, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full"
                      >
                        {group}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => window.open(`mailto:${selectedContact.email}`)}
                    className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    title="Send email"
                  >
                    <Mail className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => window.open(`tel:${selectedContact.phone}`)}
                    className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                    title="Make call"
                  >
                    <Phone className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => generateVCard(selectedContact)}
                    className="p-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
                    title="Export contact"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">Contact Information</h4>
                  <div className="space-y-3">
                    {selectedContact.email && (
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-gray-400" />
                        <a href={`mailto:${selectedContact.email}`} className="text-blue-600 hover:underline">
                          {selectedContact.email}
                        </a>
                      </div>
                    )}
                    {selectedContact.phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="w-5 h-5 text-gray-400" />
                        <a href={`tel:${selectedContact.phone}`} className="text-blue-600 hover:underline">
                          {selectedContact.phone}
                        </a>
                      </div>
                    )}
                    {selectedContact.address && (
                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-gray-400" />
                        <span>{selectedContact.address}</span>
                      </div>
                    )}
                    {selectedContact.website && (
                      <div className="flex items-center gap-3">
                        <Upload className="w-5 h-5 text-gray-400" />
                        <a href={selectedContact.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {selectedContact.website}
                        </a>
                      </div>
                    )}
                    {selectedContact.linkedIn && (
                      <div className="flex items-center gap-3">
                        <Users className="w-5 h-5 text-gray-400" />
                        <a href={selectedContact.linkedIn} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          LinkedIn Profile
                        </a>
                      </div>
                    )}
                    {selectedContact.birthday && (
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-gray-400" />
                        <span>Birthday: {selectedContact.birthday}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">Tags</h4>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {selectedContact.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <h4 className="font-semibold text-gray-800 mb-3">Statistics</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Contact Count:</span>
                      <span className="font-medium">{selectedContact.contactCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Last Contacted:</span>
                      <span className="font-medium">{selectedContact.lastContacted || 'Never'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Added:</span>
                      <span className="font-medium">{selectedContact.createdAt}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedContact.notes && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-800 mb-3">Notes</h4>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedContact.notes}</p>
                  </div>
                </div>
              )}

              {/* Activity Timeline */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Recent Activity</h4>
                <div className="space-y-3">
                  {getContactActivities(selectedContact.id).map((activity) => (
                    <div key={activity.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0">
                        {activity.type === 'email' && <Mail className="w-5 h-5 text-blue-500" />}
                        {activity.type === 'call' && <Phone className="w-5 h-5 text-green-500" />}
                        {activity.type === 'meeting' && <Calendar className="w-5 h-5 text-purple-500" />}
                        {activity.type === 'note' && <FileDown className="w-5 h-5 text-gray-500" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-gray-800">{activity.title}</p>
                          <span className="text-xs text-gray-500">{activity.date} at {activity.time}</span>
                        </div>
                        <p className="text-sm text-gray-600">{activity.description}</p>
                      </div>
                    </div>
                  ))}
                  {getContactActivities(selectedContact.id).length === 0 && (
                    <p className="text-gray-500 text-center py-4">No recent activity</p>
                  )}
                </div>
              </div>
            </div>
            <div className="p-6 border-t bg-gray-50">
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {setShowContactDetails(false); setSelectedContact(null)}}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg font-medium"
                >
                  Close
                </button>
                <button
                  onClick={() => {setEditingContact(selectedContact); setShowContactDetails(false)}}
                  className="px-4 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 flex items-center"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Contact
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showConfirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">Delete Contact</h3>
                <p className="text-gray-600">This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowConfirmDelete(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteContact(showConfirmDelete)}
                className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Contact Modal */}
      {showNewContact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Add New Contact</h2>
              <button
                onClick={() => setShowNewContact(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-700">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="First Name *"
                    value={newContact.firstName}
                    onChange={(e) => setNewContact({ ...newContact, firstName: e.target.value })}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <input
                    type="text"
                    placeholder="Last Name *"
                    value={newContact.lastName}
                    onChange={(e) => setNewContact({ ...newContact, lastName: e.target.value })}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <input
                  type="email"
                  placeholder="Email"
                  value={newContact.email}
                  onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <input
                  type="tel"
                  placeholder="Phone"
                  value={newContact.phone}
                  onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <input
                  type="text"
                  placeholder="Address"
                  value={newContact.address}
                  onChange={(e) => setNewContact({ ...newContact, address: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Professional Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-700">Professional Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Company"
                    value={newContact.company}
                    onChange={(e) => setNewContact({ ...newContact, company: e.target.value })}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <input
                    type="text"
                    placeholder="Position"
                    value={newContact.position}
                    onChange={(e) => setNewContact({ ...newContact, position: e.target.value })}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <input
                  type="url"
                  placeholder="Website (https://example.com)"
                  value={newContact.website}
                  onChange={(e) => setNewContact({ ...newContact, website: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <input
                  type="url"
                  placeholder="LinkedIn Profile (https://linkedin.com/in/username)"
                  value={newContact.linkedIn}
                  onChange={(e) => setNewContact({ ...newContact, linkedIn: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-700">Personal Information</h3>
                <input
                  type="date"
                  placeholder="Birthday"
                  value={newContact.birthday}
                  onChange={(e) => setNewContact({ ...newContact, birthday: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <input
                  type="text"
                  placeholder="Groups (comma separated)"
                  value={newContact.groups}
                  onChange={(e) => setNewContact({ ...newContact, groups: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <input
                  type="text"
                  placeholder="Tags (comma separated)"
                  value={newContact.tags}
                  onChange={(e) => setNewContact({ ...newContact, tags: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <textarea
                  placeholder="Notes"
                  value={newContact.notes}
                  onChange={(e) => setNewContact({ ...newContact, notes: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 h-24 resize-none"
                />
              </div>

              {/* Quick Tags */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-700">Quick Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {availableTags.slice(0, 8).map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        const currentTags = newContact.tags.split(',').map(t => t.trim()).filter(t => t)
                        if (!currentTags.includes(tag)) {
                          setNewContact({
                            ...newContact,
                            tags: [...currentTags, tag].join(', ')
                          })
                        }
                      }}
                      className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full hover:bg-gray-200"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  onClick={() => setShowNewContact(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateContact}
                  className="px-4 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 flex items-center"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Add Contact
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Contact Modal */}
      {editingContact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Edit Contact</h2>
              <button
                onClick={() => setEditingContact(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-700">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    value={editingContact.firstName}
                    onChange={(e) => setEditingContact({ ...editingContact, firstName: e.target.value })}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <input
                    type="text"
                    value={editingContact.lastName}
                    onChange={(e) => setEditingContact({ ...editingContact, lastName: e.target.value })}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <input
                  type="email"
                  value={editingContact.email}
                  onChange={(e) => setEditingContact({ ...editingContact, email: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <input
                  type="tel"
                  value={editingContact.phone}
                  onChange={(e) => setEditingContact({ ...editingContact, phone: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <input
                  type="text"
                  value={editingContact.address}
                  onChange={(e) => setEditingContact({ ...editingContact, address: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Professional Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-700">Professional Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    value={editingContact.company}
                    onChange={(e) => setEditingContact({ ...editingContact, company: e.target.value })}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <input
                    type="text"
                    value={editingContact.position}
                    onChange={(e) => setEditingContact({ ...editingContact, position: e.target.value })}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <input
                  type="url"
                  value={editingContact.website || ''}
                  onChange={(e) => setEditingContact({ ...editingContact, website: e.target.value })}
                  placeholder="Website (https://example.com)"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <input
                  type="url"
                  value={editingContact.linkedIn || ''}
                  onChange={(e) => setEditingContact({ ...editingContact, linkedIn: e.target.value })}
                  placeholder="LinkedIn Profile (https://linkedin.com/in/username)"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-700">Personal Information</h3>
                <input
                  type="date"
                  value={editingContact.birthday || ''}
                  onChange={(e) => setEditingContact({ ...editingContact, birthday: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <input
                  type="text"
                  value={editingContact.groups.join(', ')}
                  onChange={(e) => setEditingContact({ ...editingContact, groups: e.target.value.split(',').map(g => g.trim()) })}
                  placeholder="Groups (comma separated)"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <input
                  type="text"
                  value={editingContact.tags.join(', ')}
                  onChange={(e) => setEditingContact({ ...editingContact, tags: e.target.value.split(',').map(t => t.trim()) })}
                  placeholder="Tags (comma separated)"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <textarea
                  value={editingContact.notes}
                  onChange={(e) => setEditingContact({ ...editingContact, notes: e.target.value })}
                  placeholder="Notes"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 h-24 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  onClick={() => setEditingContact(null)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateContact}
                  className="px-4 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 flex items-center"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Update Contact
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}