'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, Filter, User, Mail, Phone, Building, MapPin, Star, MoreVertical, Edit, Trash2 } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { useContacts, useAppActions } from '@/store/useAppStore'
import { Contact } from '@/types'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

export default function ContactsPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const contacts = useContacts()
  const { addContact, updateContact, deleteContact } = useAppActions()

  const filteredContacts = contacts.filter(contact =>
    contact.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.email.some(email => email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (contact.company && contact.company.toLowerCase().includes(searchQuery.toLowerCase())) ||
    contact.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const favoriteContacts = contacts.filter(contact => contact.isFavorite)
  const recentContacts = contacts
    .filter(contact => contact.lastContacted)
    .sort((a, b) => (b.lastContacted?.getTime() || 0) - (a.lastContacted?.getTime() || 0))
    .slice(0, 5)

  const ContactCard = ({ contact, index }: { contact: Contact; index: number }) => (
    <motion.div
      key={contact.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card variant="glass" hover className="cursor-pointer" onClick={() => setSelectedContact(contact)}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="relative">
                {contact.photo ? (
                  <img
                    src={contact.photo}
                    alt={`${contact.firstName} ${contact.lastName}`}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium">
                      {contact.firstName.charAt(0)}{contact.lastName.charAt(0)}
                    </span>
                  </div>
                )}
                {contact.isFavorite && (
                  <Star className="absolute -top-1 -right-1 w-4 h-4 text-yellow-500 fill-current" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {contact.firstName} {contact.lastName}
                </h3>
                {contact.jobTitle && contact.company && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {contact.jobTitle} at {contact.company}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                // Show contact options
              }}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
            >
              <MoreVertical className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          <div className="space-y-2">
            {contact.email.length > 0 && (
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <Mail className="w-4 h-4" />
                <span className="truncate">{contact.email[0]}</span>
              </div>
            )}
            {contact.phone.length > 0 && (
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <Phone className="w-4 h-4" />
                <span>{contact.phone[0]}</span>
              </div>
            )}
            {contact.company && (
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <Building className="w-4 h-4" />
                <span>{contact.company}</span>
              </div>
            )}
          </div>

          {contact.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {contact.tags.slice(0, 3).map((tag, tagIndex) => (
                <span
                  key={tagIndex}
                  className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 text-xs rounded-full"
                >
                  {tag}
                </span>
              ))}
              {contact.tags.length > 3 && (
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-400 text-xs rounded-full">
                  +{contact.tags.length - 3}
                </span>
              )}
            </div>
          )}

          {contact.lastContacted && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Last contacted {format(contact.lastContacted, 'MMM d, yyyy')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Contacts
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your professional and personal network
          </p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          icon={<Plus className="w-4 h-4" />}
        >
          New Contact
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card variant="glass" hover>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Contacts</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {contacts.length}
                </p>
              </div>
              <User className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card variant="glass" hover>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Favorites</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {favoriteContacts.length}
                </p>
              </div>
              <Star className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card variant="glass" hover>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Companies</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {new Set(contacts.filter(c => c.company).map(c => c.company)).size}
                </p>
              </div>
              <Building className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card variant="glass" hover>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Recent</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {recentContacts.length}
                </p>
              </div>
              <Phone className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-1 gap-4 w-full sm:w-auto">
          <Input
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search className="w-4 h-4" />}
            className="flex-1"
          />
          <Button variant="outline" icon={<Filter className="w-4 h-4" />}>
            Filter
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            Grid
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            List
          </Button>
        </div>
      </div>

      {/* Favorites Section */}
      {favoriteContacts.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <Star className="w-5 h-5 text-yellow-500 mr-2 fill-current" />
            Favorite Contacts
          </h2>
          <div className={cn(
            viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-3'
          )}>
            {favoriteContacts.map((contact, index) => viewMode === 'grid' ? (
              <ContactCard key={contact.id} contact={contact} index={index} />
            ) : (
              <ContactListItem key={contact.id} contact={contact} index={index} onClick={setSelectedContact} />
            ))}
          </div>
        </div>
      )}

      {/* All Contacts */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          All Contacts ({filteredContacts.length})
        </h2>
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredContacts.map((contact, index) => (
              <ContactCard key={contact.id} contact={contact} index={index} />
            ))}
          </div>
        ) : (
          <Card variant="glass">
            <CardContent className="p-0">
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredContacts.map((contact, index) => (
                  <ContactListItem
                    key={contact.id}
                    contact={contact}
                    index={index}
                    onClick={setSelectedContact}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {filteredContacts.length === 0 && (
        <div className="text-center py-12">
          <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No contacts found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Start building your network by adding your first contact.
          </p>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            Add Contact
          </Button>
        </div>
      )}

      {/* Create Contact Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add New Contact"
        size="lg"
      >
        <ContactForm
          onSubmit={(data) => {
            addContact(data)
            setIsCreateModalOpen(false)
          }}
          onCancel={() => setIsCreateModalOpen(false)}
        />
      </Modal>

      {/* Contact Detail Modal */}
      <Modal
        isOpen={!!selectedContact}
        onClose={() => setSelectedContact(null)}
        title={selectedContact ? `${selectedContact.firstName} ${selectedContact.lastName}` : ''}
        size="lg"
      >
        {selectedContact && (
          <ContactDetail
            contact={selectedContact}
            onUpdate={(data) => {
              updateContact(selectedContact.id, data)
              setSelectedContact(null)
            }}
            onDelete={() => {
              deleteContact(selectedContact.id)
              setSelectedContact(null)
            }}
          />
        )}
      </Modal>
    </div>
  )
}

// Contact List Item Component
function ContactListItem({
  contact,
  index,
  onClick
}: {
  contact: Contact
  index: number
  onClick: (contact: Contact) => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
      onClick={() => onClick(contact)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {contact.photo ? (
            <img
              src={contact.photo}
              alt={`${contact.firstName} ${contact.lastName}`}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <span className="text-white font-medium">
                {contact.firstName.charAt(0)}{contact.lastName.charAt(0)}
              </span>
            </div>
          )}
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-medium text-gray-900 dark:text-white">
                {contact.firstName} {contact.lastName}
              </h3>
              {contact.isFavorite && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {contact.jobTitle && `${contact.jobTitle}`}
              {contact.jobTitle && contact.company && ' at '}
              {contact.company}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            {contact.email.length > 0 && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {contact.email[0]}
              </p>
            )}
            {contact.phone.length > 0 && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {contact.phone[0]}
              </p>
            )}
          </div>
          <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
            <MoreVertical className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// Contact Form Component
function ContactForm({
  onSubmit,
  onCancel
}: {
  onSubmit: (data: any) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    jobTitle: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    },
    birthday: '',
    notes: '',
    tags: '',
    isFavorite: false
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      email: formData.email.split(',').map(email => email.trim()).filter(Boolean),
      phone: formData.phone.split(',').map(phone => phone.trim()).filter(Boolean),
      birthday: formData.birthday ? new Date(formData.birthday) : undefined,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      address: Object.values(formData.address).some(val => val) ? formData.address : undefined
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            First Name *
          </label>
          <input
            type="text"
            value={formData.firstName}
            onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            placeholder="John"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Last Name *
          </label>
          <input
            type="text"
            value={formData.lastName}
            onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            placeholder="Doe"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email
          </label>
          <input
            type="text"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            placeholder="john@example.com, john.work@example.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Phone
          </label>
          <input
            type="text"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            placeholder="+1 555-0123, +1 555-0124"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Company
          </label>
          <input
            type="text"
            value={formData.company}
            onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            placeholder="Acme Inc."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Job Title
          </label>
          <input
            type="text"
            value={formData.jobTitle}
            onChange={(e) => setFormData(prev => ({ ...prev, jobTitle: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            placeholder="Software Engineer"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Address
        </label>
        <div className="grid grid-cols-2 gap-4">
          <input
            type="text"
            value={formData.address.street}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              address: { ...prev.address, street: e.target.value }
            }))}
            className="col-span-2 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            placeholder="123 Main St"
          />
          <input
            type="text"
            value={formData.address.city}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              address: { ...prev.address, city: e.target.value }
            }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            placeholder="New York"
          />
          <input
            type="text"
            value={formData.address.state}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              address: { ...prev.address, state: e.target.value }
            }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            placeholder="NY"
          />
          <input
            type="text"
            value={formData.address.zipCode}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              address: { ...prev.address, zipCode: e.target.value }
            }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            placeholder="10001"
          />
          <input
            type="text"
            value={formData.address.country}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              address: { ...prev.address, country: e.target.value }
            }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            placeholder="USA"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Birthday
          </label>
          <input
            type="date"
            value={formData.birthday}
            onChange={(e) => setFormData(prev => ({ ...prev, birthday: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tags
          </label>
          <input
            type="text"
            value={formData.tags}
            onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            placeholder="work, friend, family (comma separated)"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Notes
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          placeholder="Additional notes about this contact..."
        />
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="isFavorite"
          checked={formData.isFavorite}
          onChange={(e) => setFormData(prev => ({ ...prev, isFavorite: e.target.checked }))}
          className="mr-2"
        />
        <label htmlFor="isFavorite" className="text-sm text-gray-700 dark:text-gray-300">
          Mark as favorite
        </label>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          Add Contact
        </Button>
      </div>
    </form>
  )
}

// Contact Detail Component
function ContactDetail({
  contact,
  onUpdate,
  onDelete
}: {
  contact: Contact
  onUpdate: (data: Partial<Contact>) => void
  onDelete: () => void
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {contact.photo ? (
            <img
              src={contact.photo}
              alt={`${contact.firstName} ${contact.lastName}`}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xl font-medium">
                {contact.firstName.charAt(0)}{contact.lastName.charAt(0)}
              </span>
            </div>
          )}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {contact.firstName} {contact.lastName}
            </h2>
            {contact.jobTitle && contact.company && (
              <p className="text-gray-600 dark:text-gray-400">
                {contact.jobTitle} at {contact.company}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" icon={<Edit className="w-4 h-4" />}>
            Edit
          </Button>
          <Button variant="destructive" size="sm" icon={<Trash2 className="w-4 h-4" />} onClick={onDelete}>
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {contact.email.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</h3>
            <div className="space-y-2">
              {contact.email.map((email, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <a href={`mailto:${email}`} className="text-blue-600 hover:text-blue-700">
                    {email}
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {contact.phone.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone</h3>
            <div className="space-y-2">
              {contact.phone.map((phone, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <a href={`tel:${phone}`} className="text-blue-600 hover:text-blue-700">
                    {phone}
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {contact.address && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Address</h3>
            <div className="flex items-start space-x-2">
              <MapPin className="w-4 h-4 text-gray-500 mt-1" />
              <p className="text-gray-700 dark:text-gray-300">
                {contact.address.street}<br />
                {contact.address.city}, {contact.address.state} {contact.address.zipCode}<br />
                {contact.address.country}
              </p>
            </div>
          </div>
        )}

        {contact.birthday && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Birthday</h3>
            <p className="text-gray-700 dark:text-gray-300">
              {format(contact.birthday, 'MMMM d, yyyy')}
            </p>
          </div>
        )}
      </div>

      {contact.notes && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes</h3>
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {contact.notes}
          </p>
        </div>
      )}

      {contact.tags.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {contact.tags.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 text-sm rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Added {format(contact.createdAt, 'MMMM d, yyyy')}
        </p>
        <Button onClick={() => onUpdate({ isFavorite: !contact.isFavorite })}>
          {contact.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
        </Button>
      </div>
    </div>
  )
}