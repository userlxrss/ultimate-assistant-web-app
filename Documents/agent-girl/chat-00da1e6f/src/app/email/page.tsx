'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, Filter, Reply, Forward, Star, Trash2, Archive, Mail, MailOpen, Paperclip, Clock, User } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { useEmails, useAppActions } from '@/store/useAppStore'
import { Email } from '@/types'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

export default function EmailPage() {
  const [isComposeModalOpen, setIsComposeModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFolder, setSelectedFolder] = useState<string>('inbox')
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null)
  const [composeData, setComposeData] = useState({
    to: '',
    cc: '',
    bcc: '',
    subject: '',
    body: ''
  })

  const emails = useEmails()
  const { addEmail, updateEmail, deleteEmail } = useAppActions()

  const folders = [
    { id: 'inbox', name: 'Inbox', icon: Mail, count: emails.filter(e => !e.isRead).length },
    { id: 'sent', name: 'Sent', icon: MailOpen, count: 0 },
    { id: 'starred', name: 'Starred', icon: Star, count: emails.filter(e => e.isStarred).length },
    { id: 'archive', name: 'Archive', icon: Archive, count: 0 }
  ]

  const filteredEmails = emails.filter(email => {
    const matchesSearch = email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         email.body.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         email.from.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         email.from.email.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesFolder = selectedFolder === 'inbox' ? !email.isDraft :
                         selectedFolder === 'sent' ? email.sentAt :
                         selectedFolder === 'starred' ? email.isStarred :
                         selectedFolder === 'archive' ? false : true

    return matchesSearch && matchesFolder
  }).sort((a, b) => b.receivedAt.getTime() - a.receivedAt.getTime())

  const unreadEmails = filteredEmails.filter(email => !email.isRead)
  const importantEmails = filteredEmails.filter(email => email.isImportant)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Email
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your inbox and stay connected
          </p>
        </div>
        <Button
          onClick={() => setIsComposeModalOpen(true)}
          icon={<Plus className="w-4 h-4" />}
        >
          Compose
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card variant="glass" hover>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Unread</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {unreadEmails.length}
                </p>
              </div>
              <Mail className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card variant="glass" hover>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Important</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {importantEmails.length}
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
                <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {emails.length}
                </p>
              </div>
              <MailOpen className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card variant="glass" hover>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Starred</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {emails.filter(e => e.isStarred).length}
                </p>
              </div>
              <Star className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-64 space-y-4">
          <Card variant="glass">
            <CardContent className="p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Folders</h3>
              <div className="space-y-2">
                {folders.map(folder => (
                  <button
                    key={folder.id}
                    onClick={() => setSelectedFolder(folder.id)}
                    className={cn(
                      'w-full flex items-center justify-between p-2 rounded-lg transition-colors',
                      selectedFolder === folder.id
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                    )}
                  >
                    <div className="flex items-center space-x-2">
                      <folder.icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{folder.name}</span>
                    </div>
                    {folder.count > 0 && (
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        {folder.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card variant="glass">
            <CardContent className="p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Labels</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Important</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Work</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Personal</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Projects</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Email List */}
        <div className="flex-1 space-y-4">
          {/* Search and Controls */}
          <div className="flex gap-4">
            <Input
              placeholder="Search emails..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="w-4 h-4" />}
              className="flex-1"
            />
            <Button variant="outline" icon={<Filter className="w-4 h-4" />}>
              Filter
            </Button>
          </div>

          {/* Email List */}
          <Card variant="glass">
            <CardContent className="p-0">
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredEmails.map((email, index) => (
                  <motion.div
                    key={email.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      'p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors',
                      !email.isRead && 'bg-blue-50 dark:bg-blue-900/10'
                    )}
                    onClick={() => {
                      setSelectedEmail(email)
                      if (!email.isRead) {
                        updateEmail(email.id, { isRead: true })
                      }
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1 min-w-0">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium">
                              {email.from.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className={cn(
                              'text-sm truncate',
                              email.isRead ? 'text-gray-900 dark:text-white' : 'font-semibold text-gray-900 dark:text-white'
                            )}>
                              {email.from.name}
                            </p>
                            <div className="flex items-center space-x-2 flex-shrink-0">
                              {email.isImportant && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
                              {email.attachments.length > 0 && <Paperclip className="w-4 h-4 text-gray-500" />}
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {format(email.receivedAt, 'MMM d')}
                              </span>
                            </div>
                          </div>
                          <p className={cn(
                            'text-sm truncate mb-1',
                            email.isRead ? 'text-gray-900 dark:text-white' : 'font-semibold text-gray-900 dark:text-white'
                          )}>
                            {email.subject}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                            {email.body}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
                {filteredEmails.length === 0 && (
                  <div className="text-center py-12">
                    <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      No emails found
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Try adjusting your search or filters.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Email Detail (Sidebar) */}
        {selectedEmail && (
          <div className="w-96">
            <Card variant="glass">
              <CardContent className="p-6">
                <EmailDetail
                  email={selectedEmail}
                  onClose={() => setSelectedEmail(null)}
                  onReply={() => {
                    setComposeData({
                      to: selectedEmail.from.email,
                      cc: '',
                      bcc: '',
                      subject: `Re: ${selectedEmail.subject}`,
                      body: `\n\n---\nOn ${format(selectedEmail.receivedAt, 'MMM d, yyyy')}, ${selectedEmail.from.name} wrote:\n${selectedEmail.body}`
                    })
                    setIsComposeModalOpen(true)
                  }}
                  onForward={() => {
                    setComposeData({
                      to: '',
                      cc: '',
                      bcc: '',
                      subject: `Fwd: ${selectedEmail.subject}`,
                      body: `\n\n--- Forwarded message ---\nFrom: ${selectedEmail.from.name} <${selectedEmail.from.email}>\nDate: ${format(selectedEmail.receivedAt, 'MMM d, yyyy')}\nSubject: ${selectedEmail.subject}\n\n${selectedEmail.body}`
                    })
                    setIsComposeModalOpen(true)
                  }}
                />
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Compose Modal */}
      <Modal
        isOpen={isComposeModalOpen}
        onClose={() => setIsComposeModalOpen(false)}
        title="New Message"
        size="lg"
      >
        <ComposeForm
          data={composeData}
          onChange={setComposeData}
          onSubmit={(data) => {
            addEmail({
              ...data,
              from: { name: 'You', email: 'you@example.com' },
              to: data.to.split(',').map(email => ({ name: email.trim(), email: email.trim() })),
              cc: data.cc ? data.cc.split(',').map(email => ({ name: email.trim(), email: email.trim() })) : [],
              bcc: data.bcc ? data.bcc.split(',').map(email => ({ name: email.trim(), email: email.trim() })) : [],
              body: data.body,
              subject: data.subject,
              attachments: [],
              labels: [],
              isRead: true,
              isImportant: false,
              isStarred: false,
              isDraft: false,
              sentAt: new Date(),
              receivedAt: new Date()
            })
            setIsComposeModalOpen(false)
            setComposeData({ to: '', cc: '', bcc: '', subject: '', body: '' })
          }}
          onCancel={() => {
            setIsComposeModalOpen(false)
            setComposeData({ to: '', cc: '', bcc: '', subject: '', body: '' })
          }}
        />
      </Modal>
    </div>
  )
}

// Email Detail Component
function EmailDetail({
  email,
  onClose,
  onReply,
  onForward
}: {
  email: Email
  onClose: () => void
  onReply: () => void
  onForward: () => void
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
          {email.subject}
        </h2>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
        >
          ×
        </button>
      </div>

      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
          <span className="text-sm font-medium">
            {email.from.name.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {email.from.name}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {email.from.email}
          </p>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {format(email.receivedAt, 'MMM d, yyyy HH:mm')}
        </span>
      </div>

      <div className="prose prose-sm dark:prose-invert max-w-none">
        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
          {email.body}
        </p>
      </div>

      {email.attachments.length > 0 && (
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Attachments ({email.attachments.length})
          </p>
          <div className="space-y-2">
            {email.attachments.map((attachment, index) => (
              <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <Paperclip className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {attachment.filename}
                </span>
                <span className="text-xs text-gray-500">
                  ({(attachment.size / 1024).toFixed(1)} KB)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center space-x-2 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button size="sm" icon={<Reply className="w-4 h-4" />} onClick={onReply}>
          Reply
        </Button>
        <Button variant="outline" size="sm" icon={<Forward className="w-4 h-4" />} onClick={onForward}>
          Forward
        </Button>
        <Button variant="outline" size="sm" icon={<Star className="w-4 h-4" />}>
          Star
        </Button>
        <Button variant="outline" size="sm" icon={<Archive className="w-4 h-4" />}>
          Archive
        </Button>
        <Button variant="destructive" size="sm" icon={<Trash2 className="w-4 h-4" />}>
          Delete
        </Button>
      </div>
    </div>
  )
}

// Compose Form Component
function ComposeForm({
  data,
  onChange,
  onSubmit,
  onCancel
}: {
  data: any
  onChange: (data: any) => void
  onSubmit: (data: any) => void
  onCancel: () => void
}) {
  const [showCcBcc, setShowCcBcc] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(data)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          To *
        </label>
        <input
          type="email"
          value={data.to}
          onChange={(e) => onChange({ ...data, to: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          placeholder="recipient@example.com"
          required
        />
      </div>

      {showCcBcc && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Cc
            </label>
            <input
              type="email"
              value={data.cc}
              onChange={(e) => onChange({ ...data, cc: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="cc@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Bcc
            </label>
            <input
              type="email"
              value={data.bcc}
              onChange={(e) => onChange({ ...data, bcc: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="bcc@example.com"
            />
          </div>
        </>
      )}

      {!showCcBcc && (
        <button
          type="button"
          onClick={() => setShowCcBcc(true)}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          Add Cc/Bcc
        </button>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Subject *
        </label>
        <input
          type="text"
          value={data.subject}
          onChange={(e) => onChange({ ...data, subject: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          placeholder="Email subject"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Message *
        </label>
        <textarea
          value={data.body}
          onChange={(e) => onChange({ ...data, body: e.target.value })}
          rows={10}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          placeholder="Type your message here..."
          required
        />
      </div>

      <div className="flex justify-between items-center pt-4">
        <div className="flex items-center space-x-2">
          <Button type="button" variant="outline" size="sm" icon={<Paperclip className="w-4 h-4" />}>
            Attach
          </Button>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            Send
          </Button>
        </div>
      </div>
    </form>
  )
}