'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Mail,
  Plus,
  Search,
  Send,
  Inbox,
  Star,
  Archive,
  Trash2,
  Edit,
  X,
  Save,
  Reply,
  ReplyAll,
  Forward,
  Paperclip,
  Calendar,
  User,
  Clock,
  Check,
  CheckSquare,
  Square,
  Bold,
  Italic,
  Link,
  List,
  ListOrdered,
  Filter,
  ChevronDown,
  Eye,
  EyeOff,
  RefreshCw,
  Download,
  Upload,
  MoreVertical,
  Tag,
  TagOff
} from 'lucide-react'

interface EmailMessage {
  id: number
  from: string
  fromName?: string
  to: string[]
  cc?: string[]
  bcc?: string[]
  subject: string
  body: string
  date: string
  time: string
  isRead: boolean
  isStarred: boolean
  isImportant: boolean
  folder: 'inbox' | 'sent' | 'drafts' | 'trash' | 'archive'
  labels: string[]
  attachments: Attachment[]
  threadId?: string
  threadCount?: number
  isScheduled?: boolean
  scheduledDate?: string
  isDraft?: boolean
  priority: 'low' | 'normal' | 'high'
  isSpam?: boolean
  replyTo?: string
  hasBeenRepliedTo?: boolean
}

interface Attachment {
  id: string
  name: string
  size: string
  type: string
  url?: string
}

interface EmailTemplate {
  id: string
  name: string
  subject: string
  body: string
}

interface EmailSignature {
  id: string
  name: string
  content: string
}

interface EmailAnalytics {
  sentCount: number
  receivedCount: number
  replyRate: number
  averageResponseTime: string
  mostContacted: { email: string; count: number }[]
}

export default function Email() {
  const [availableLabels] = useState([
    { id: 'personal', name: 'Personal', color: 'bg-blue-500' },
    { id: 'work', name: 'Work', color: 'bg-purple-500' },
    { id: 'promotions', name: 'Promotions', color: 'bg-green-500' },
    { id: 'social', name: 'Social', color: 'bg-red-500' },
    { id: 'updates', name: 'Updates', color: 'bg-yellow-500' },
    { id: 'forums', name: 'Forums', color: 'bg-orange-500' },
    { id: 'important', name: 'Important', color: 'bg-red-600' },
    { id: 'urgent', name: 'Urgent', color: 'bg-red-700' }
  ])

  const [emailTemplates] = useState<EmailTemplate[]>([
    {
      id: '1',
      name: 'Meeting Request',
      subject: 'Meeting Request: {{subject}}',
      body: 'Hi {{name}},\n\nI would like to schedule a meeting to discuss {{topic}}.\n\nPlease let me know what time works best for you.\n\nBest regards,\n{{signature}}'
    },
    {
      id: '2',
      name: 'Follow Up',
      subject: 'Following up on {{subject}}',
      body: 'Hi {{name}},\n\nJust wanted to follow up on our previous conversation about {{topic}}.\n\nLooking forward to hearing from you.\n\nBest regards,\n{{signature}}'
    },
    {
      id: '3',
      name: 'Thank You',
      subject: 'Thank You - {{subject}}',
      body: 'Hi {{name}},\n\nThank you for {{reason}}.\n\nI really appreciate your help and support.\n\nBest regards,\n{{signature}}'
    }
  ])

  const [emailSignatures] = useState<EmailSignature[]>([
    {
      id: '1',
      name: 'Professional',
      content: 'Best regards,\nJohn Doe\nSenior Developer\nCompany Name\nEmail: john.doe@company.com\nPhone: (555) 123-4567'
    },
    {
      id: '2',
      name: 'Casual',
      content: 'Cheers,\nJohn'
    }
  ])

  const [emails, setEmails] = useState<EmailMessage[]>([
    {
      id: 1,
      from: 'john.smith@example.com',
      fromName: 'John Smith',
      to: ['me@example.com'],
      subject: 'Project Update - Q1 Planning',
      body: 'Hi Team,\n\nI wanted to share the latest updates on our Q1 planning. We\'ve made significant progress on the roadmap and I\'d like to schedule a meeting to discuss the next steps.\n\nKey achievements:\n- Completed initial research phase\n- Defined project scope\n- Allocated resources\n\nPlease review the attached documents and let me know your availability for next week.\n\nBest regards,\nJohn',
      date: '2024-01-17',
      time: '09:30',
      isRead: false,
      isStarred: true,
      isImportant: true,
      folder: 'inbox',
      labels: ['work', 'important'],
      attachments: [
        { id: '1', name: 'Q1_Roadmap.pdf', size: '2.4 MB', type: 'application/pdf' },
        { id: '2', name: 'Budget.xlsx', size: '1.1 MB', type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
      ],
      threadId: 'thread_1',
      threadCount: 3,
      priority: 'high'
    },
    {
      id: 2,
      from: 'marketing@company.com',
      fromName: 'Marketing Team',
      to: ['me@example.com'],
      cc: ['manager@company.com'],
      subject: 'New Marketing Campaign Launch',
      body: 'Dear Team,\n\nWe\'re excited to announce the launch of our new marketing campaign! This initiative will help us reach our target audience more effectively.\n\nCampaign highlights:\n- Social media strategy\n- Content marketing plan\n- Email marketing automation\n- Analytics and tracking\n\nLooking forward to your feedback and support.\n\nMarketing Team',
      date: '2024-01-16',
      time: '14:15',
      isRead: true,
      isStarred: false,
      isImportant: false,
      folder: 'inbox',
      labels: ['promotions', 'work'],
      attachments: [],
      threadId: 'thread_2',
      threadCount: 1,
      priority: 'normal'
    },
    {
      id: 3,
      from: 'me@example.com',
      fromName: 'Me',
      to: ['client@business.com'],
      cc: ['boss@company.com'],
      subject: 'Proposal for New Project',
      body: 'Dear Client,\n\nThank you for the opportunity to work on your upcoming project. I\'ve attached our detailed proposal outlining the scope, timeline, and budget.\n\nWe\'re confident that our team can deliver exceptional results within the specified timeframe.\n\nPlease let me know if you have any questions or would like to schedule a call to discuss further.\n\nBest regards,\nMe',
      date: '2024-01-15',
      time: '11:00',
      isRead: true,
      isStarred: true,
      isImportant: true,
      folder: 'sent',
      labels: ['work', 'important'],
      attachments: [
        { id: '3', name: 'Proposal.pdf', size: '3.7 MB', type: 'application/pdf' }
      ],
      threadId: 'thread_3',
      threadCount: 2,
      priority: 'high',
      hasBeenRepliedTo: true
    },
    {
      id: 4,
      from: 'hr@company.com',
      fromName: 'HR Team',
      to: ['all@company.com'],
      subject: 'Team Building Event - Save the Date',
      body: 'Hi Everyone,\n\nWe\'re organizing a team building event on January 25th. It will be a great opportunity to connect with colleagues and have some fun outside of work.\n\nDetails:\n- Date: January 25, 2024\n- Time: 2:00 PM - 6:00 PM\n- Location: Conference Center\n- Activities: Games, Dinner, Awards\n\nPlease RSVP by January 20th.\n\nHR Team',
      date: '2024-01-14',
      time: '16:45',
      isRead: false,
      isStarred: false,
      isImportant: false,
      folder: 'inbox',
      labels: ['social', 'updates'],
      attachments: [],
      threadId: 'thread_4',
      threadCount: 1,
      priority: 'low'
    },
    {
      id: 5,
      from: 'newsletter@techblog.com',
      fromName: 'Tech Newsletter',
      to: ['me@example.com'],
      subject: 'Weekly Tech Digest - AI Breakthroughs',
      body: 'This week in tech:\n\n1. Major AI breakthrough in language processing\n2. New JavaScript framework released\n3. Cybersecurity alert for popular software\n4. Startup funding round highlights\n\nRead more on our website.',
      date: '2024-01-13',
      time: '08:00',
      isRead: true,
      isStarred: false,
      isImportant: false,
      folder: 'inbox',
      labels: ['social', 'updates'],
      attachments: [],
      threadId: 'thread_5',
      threadCount: 1,
      priority: 'low',
      isSpam: false
    },
    {
      id: 6,
      from: 'me@example.com',
      fromName: 'Me',
      to: ['team@company.com'],
      subject: 'Draft: Weekly Status Report',
      body: 'Team,\n\nHere\'s my weekly status update:\n\nCompleted:\n- Feature X implementation\n- Bug fixes for module Y\n\nIn Progress:\n- Performance optimization\n- Documentation updates\n\nBlockers:\n- Waiting for API access\n\n[Draft - Not sent yet]',
      date: '2024-01-12',
      time: '17:30',
      isRead: true,
      isStarred: false,
      isImportant: false,
      folder: 'drafts',
      labels: ['work'],
      attachments: [],
      threadId: 'thread_6',
      threadCount: 1,
      priority: 'normal',
      isDraft: true
    }
  ])

  const [selectedFolder, setSelectedFolder] = useState<'inbox' | 'sent' | 'drafts' | 'trash' | 'archive'>('inbox')
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null)
  const [showCompose, setShowCompose] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showStarredOnly, setShowStarredOnly] = useState(false)
  const [selectedLabels, setSelectedLabels] = useState<string[]>([])
  const [showSearchFilters, setShowSearchFilters] = useState(false)
  const [searchFilters, setSearchFilters] = useState({
    dateRange: 'all', // all, today, week, month, year
    hasAttachments: false,
    fromPerson: '',
    priority: 'all', // all, low, normal, high
    isUnread: false
  })
  const [showCc, setShowCc] = useState(false)
  const [showBcc, setShowBcc] = useState(false)
  const [selectedEmails, setSelectedEmails] = useState<number[]>([])
  const [showSelectAll, setShowSelectAll] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null)
  const [selectedSignature, setSelectedSignature] = useState<EmailSignature | null>(null)
  const [showScheduleSend, setShowScheduleSend] = useState(false)
  const [scheduleDateTime, setScheduleDateTime] = useState('')
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null)
  const [showQuickReply, setShowQuickReply] = useState(false)
  const [showRichTextEditor, setShowRichTextEditor] = useState(true)
  const [isComposingReply, setIsComposingReply] = useState(false)
  const [replyingToEmail, setReplyingToEmail] = useState<EmailMessage | null>(null)

  const [composeData, setComposeData] = useState({
    to: '',
    cc: '',
    bcc: '',
    subject: '',
    body: '',
    attachments: [] as Attachment[],
    isDraft: true,
    threadId: null as string | null
  })

  const folders = [
    { id: 'inbox', label: 'Inbox', icon: Inbox, count: emails.filter(e => e.folder === 'inbox' && !e.isRead).length },
    { id: 'sent', label: 'Sent', icon: Send, count: 0 },
    { id: 'drafts', label: 'Drafts', icon: Edit, count: emails.filter(e => e.folder === 'drafts').length },
    { id: 'trash', label: 'Trash', icon: Trash2, count: 0 },
    { id: 'archive', label: 'Archive', icon: Archive, count: 0 }
  ]

  const filteredEmails = emails.filter(email => {
    const matchesFolder = email.folder === selectedFolder
    const matchesSearch = email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         email.body.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         email.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (email.fromName && email.fromName.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStarred = !showStarredOnly || email.isStarred
    const matchesLabels = selectedLabels.length === 0 || selectedLabels.some(label => email.labels.includes(label))

    // Advanced search filters
    let matchesDateRange = true
    if (searchFilters.dateRange !== 'all') {
      const emailDate = new Date(email.date)
      const now = new Date()
      switch (searchFilters.dateRange) {
        case 'today':
          matchesDateRange = emailDate.toDateString() === now.toDateString()
          break
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          matchesDateRange = emailDate >= weekAgo
          break
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          matchesDateRange = emailDate >= monthAgo
          break
        case 'year':
          const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
          matchesDateRange = emailDate >= yearAgo
          break
      }
    }

    const matchesAttachments = !searchFilters.hasAttachments || email.attachments.length > 0
    const matchesFromPerson = !searchFilters.fromPerson ||
      email.from.toLowerCase().includes(searchFilters.fromPerson.toLowerCase()) ||
      (email.fromName && email.fromName.toLowerCase().includes(searchFilters.fromPerson.toLowerCase()))
    const matchesPriority = searchFilters.priority === 'all' || email.priority === searchFilters.priority
    const matchesUnread = !searchFilters.isUnread || !email.isRead

    return matchesFolder && matchesSearch && matchesStarred && matchesLabels &&
           matchesDateRange && matchesAttachments && matchesFromPerson && matchesPriority && matchesUnread
  })

  // Auto-save draft functionality
  useEffect(() => {
    if (showCompose && (composeData.to || composeData.subject || composeData.body)) {
      if (autoSaveTimer) clearTimeout(autoSaveTimer)

      const timer = setTimeout(() => {
        handleAutoSaveDraft()
      }, 3000) // Auto-save after 3 seconds of inactivity

      setAutoSaveTimer(timer)
    }

    return () => {
      if (autoSaveTimer) clearTimeout(autoSaveTimer)
    }
  }, [composeData, showCompose])

  const handleAutoSaveDraft = () => {
    if (composeData.subject || composeData.body) {
      const draftEmail: EmailMessage = {
        id: Date.now(),
        from: 'me@example.com',
        fromName: 'Me',
        to: composeData.to ? composeData.to.split(',').map(email => email.trim()) : [],
        cc: composeData.cc ? composeData.cc.split(',').map(email => email.trim()) : [],
        bcc: composeData.bcc ? composeData.bcc.split(',').map(email => email.trim()) : [],
        subject: composeData.subject || 'No Subject',
        body: composeData.body,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().slice(0, 5),
        isRead: true,
        isStarred: false,
        isImportant: false,
        folder: 'drafts',
        labels: [],
        attachments: composeData.attachments,
        isDraft: true,
        priority: 'normal'
      }

      setEmails(prev => {
        const existingDraftIndex = prev.findIndex(e => e.id === draftEmail.id)
        if (existingDraftIndex >= 0) {
          const updated = [...prev]
          updated[existingDraftIndex] = draftEmail
          return updated
        }
        return [draftEmail, ...prev]
      })
    }
  }

  const handleCompose = () => {
    if (composeData.to && composeData.subject && composeData.body) {
      const newEmail: EmailMessage = {
        id: Date.now(),
        from: 'me@example.com',
        fromName: 'Me',
        to: composeData.to.split(',').map(email => email.trim()),
        cc: composeData.cc ? composeData.cc.split(',').map(email => email.trim()) : [],
        bcc: composeData.bcc ? composeData.bcc.split(',').map(email => email.trim()) : [],
        subject: composeData.subject,
        body: composeData.body,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().slice(0, 5),
        isRead: true,
        isStarred: false,
        isImportant: false,
        folder: showScheduleSend ? 'drafts' : 'sent',
        labels: [],
        attachments: composeData.attachments,
        isScheduled: showScheduleSend,
        scheduledDate: showScheduleSend ? scheduleDateTime : undefined,
        isDraft: false,
        priority: 'normal',
        threadId: composeData.threadId || undefined
      }

      setEmails([newEmail, ...emails])
      setComposeData({
        to: '',
        cc: '',
        bcc: '',
        subject: '',
        body: '',
        attachments: [],
        isDraft: true,
        threadId: null
      })
      setShowCompose(false)
      setShowScheduleSend(false)
      setScheduleDateTime('')
      setSelectedFolder('sent')
      setIsComposingReply(false)
      setReplyingToEmail(null)
    }
  }

  const handleReply = (replyAll = false) => {
    if (selectedEmail) {
      setIsComposingReply(true)
      setReplyingToEmail(selectedEmail)
      const allRecipients = [...selectedEmail.to, ...(selectedEmail.cc || [])]
      const uniqueRecipients = Array.from(new Set(allRecipients.filter(email => email !== 'me@example.com')))

      setComposeData({
        to: selectedEmail.from,
        cc: replyAll ? uniqueRecipients.join(', ') : '',
        bcc: '',
        subject: `Re: ${selectedEmail.subject}`,
        body: `\n\n---\nOn ${selectedEmail.date} at ${selectedEmail.time}, ${selectedEmail.fromName || selectedEmail.from} wrote:\n${selectedEmail.body}`,
        attachments: [],
        isDraft: true,
        threadId: selectedEmail.threadId
      })
      setShowCc(replyAll)
      setShowCompose(true)
    }
  }

  const handleForward = () => {
    if (selectedEmail) {
      setComposeData({
        to: '',
        cc: '',
        bcc: '',
        subject: `Fwd: ${selectedEmail.subject}`,
        body: `\n\n--- Forwarded message ---\nFrom: ${selectedEmail.fromName || selectedEmail.from}\nDate: ${selectedEmail.date} at ${selectedEmail.time}\nSubject: ${selectedEmail.subject}\nTo: ${selectedEmail.to.join(', ')}\n${selectedEmail.cc ? `Cc: ${selectedEmail.cc.join(', ')}\n` : ''}\n\n${selectedEmail.body}`,
        attachments: selectedEmail.attachments,
        isDraft: true,
        threadId: null
      })
      setShowCompose(true)
      setIsComposingReply(false)
      setReplyingToEmail(null)
    }
  }

  const handleApplyLabel = (emailId: number, labelId: string) => {
    setEmails(emails.map(email =>
      email.id === emailId
        ? { ...email, labels: email.labels.includes(labelId)
            ? email.labels.filter(l => l !== labelId)
            : [...email.labels, labelId]
          }
        : email
    ))
  }

  const handleBulkAction = (action: 'read' | 'unread' | 'star' | 'unstar' | 'archive' | 'delete' | 'markImportant') => {
    setEmails(emails.map(email => {
      if (selectedEmails.includes(email.id)) {
        switch (action) {
          case 'read':
            return { ...email, isRead: true }
          case 'unread':
            return { ...email, isRead: false }
          case 'star':
            return { ...email, isStarred: true }
          case 'unstar':
            return { ...email, isStarred: false }
          case 'archive':
            return { ...email, folder: 'archive' }
          case 'delete':
            return { ...email, folder: 'trash' }
          case 'markImportant':
            return { ...email, isImportant: true }
          default:
            return email
        }
      }
      return email
    }))
    setSelectedEmails([])
    setShowSelectAll(false)
  }

  const handleSelectAll = () => {
    if (showSelectAll) {
      setSelectedEmails([])
    } else {
      setSelectedEmails(filteredEmails.map(email => email.id))
    }
    setShowSelectAll(!showSelectAll)
  }

  const handleSelectEmail = (emailId: number) => {
    if (selectedEmails.includes(emailId)) {
      setSelectedEmails(selectedEmails.filter(id => id !== emailId))
    } else {
      setSelectedEmails([...selectedEmails, emailId])
    }
  }

  const handleApplyTemplate = (template: EmailTemplate) => {
    setComposeData({
      ...composeData,
      subject: template.subject.replace('{{subject}}', ''),
      body: template.body
        .replace('{{name}}', 'Recipient')
        .replace('{{topic}}', 'our discussion')
        .replace('{{reason}}', 'your help')
        .replace('{{signature}}', selectedSignature?.content || 'Best regards,\nMe')
    })
    setShowTemplates(false)
  }

  const getAnalytics = (): EmailAnalytics => {
    const sentEmails = emails.filter(e => e.folder === 'sent')
    const receivedEmails = emails.filter(e => e.folder === 'inbox')
    const repliedEmails = receivedEmails.filter(e => e.hasBeenRepliedTo)

    return {
      sentCount: sentEmails.length,
      receivedCount: receivedEmails.length,
      replyRate: receivedEmails.length > 0 ? (repliedEmails.length / receivedEmails.length) * 100 : 0,
      averageResponseTime: '2.5 hours',
      mostContacted: [
        { email: 'john.smith@example.com', count: 3 },
        { email: 'marketing@company.com', count: 2 },
        { email: 'hr@company.com', count: 1 }
      ]
    }
  }

  
  const handleDelete = (emailId: number) => {
    setEmails(emails.map(email =>
      email.id === emailId ? { ...email, folder: 'trash' } : email
    ))
    setSelectedEmail(null)
  }

  const handleStar = (emailId: number) => {
    setEmails(emails.map(email =>
      email.id === emailId ? { ...email, isStarred: !email.isStarred } : email
    ))
  }

  const handleMarkAsRead = (emailId: number) => {
    setEmails(emails.map(email =>
      email.id === emailId ? { ...email, isRead: true } : email
    ))
  }

  return (
    <div className="p-8 overflow-auto h-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Email</h1>
        <p className="text-gray-600 mt-2">Manage your emails and communications</p>
      </div>

      <div className="flex gap-6 h-full">
        {/* Sidebar */}
        <div className="w-64 bg-white rounded-xl shadow-sm border p-4">
          <button
            onClick={() => setShowCompose(true)}
            className="w-full bg-primary-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-600 transition-colors flex items-center justify-center mb-6"
          >
            <Plus className="w-5 h-5 mr-2" />
            Compose
          </button>

          <nav className="space-y-2">
            {folders.map(folder => {
              const Icon = folder.icon
              return (
                <button
                  key={folder.id}
                  onClick={() => setSelectedFolder(folder.id as any)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                    selectedFolder === folder.id
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center">
                    <Icon className="w-5 h-5 mr-3" />
                    <span className="font-medium">{folder.label}</span>
                  </div>
                  {folder.count > 0 && (
                    <span className="bg-primary-500 text-white text-xs px-2 py-1 rounded-full">
                      {folder.count}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>

          <div className="mt-6 pt-6 border-t">
            <button
              onClick={() => setShowStarredOnly(!showStarredOnly)}
              className={`w-full flex items-center px-3 py-2 rounded-lg transition-colors ${
                showStarredOnly
                  ? 'bg-yellow-50 text-yellow-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Star className="w-5 h-5 mr-3" />
              <span className="font-medium">Starred</span>
            </button>
          </div>

          {/* Labels Section */}
          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">Labels</h3>
              <button
                onClick={() => setSelectedLabels([])}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Clear all
              </button>
            </div>
            <div className="space-y-1">
              {availableLabels.map(label => {
                const labelCount = emails.filter(e => e.labels.includes(label.id)).length
                const isSelected = selectedLabels.includes(label.id)
                return (
                  <button
                    key={label.id}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedLabels(selectedLabels.filter(l => l !== label.id))
                      } else {
                        setSelectedLabels([...selectedLabels, label.id])
                      }
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                      isSelected
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full ${label.color} mr-3`} />
                      <span className="text-sm font-medium">{label.name}</span>
                    </div>
                    {labelCount > 0 && (
                      <span className="text-xs text-gray-500">{labelCount}</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Analytics Button */}
          <div className="mt-6 pt-6 border-t">
            <button
              onClick={() => setShowAnalytics(!showAnalytics)}
              className={`w-full flex items-center px-3 py-2 rounded-lg transition-colors ${
                showAnalytics
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-5 h-5 mr-3" />
              <span className="font-medium">Analytics</span>
            </button>
          </div>

          {/* Refresh Button */}
          <div className="mt-4">
            <button
              onClick={() => window.location.reload()}
              className="w-full flex items-center px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="w-5 h-5 mr-3" />
              <span className="font-medium">Refresh</span>
            </button>
          </div>
        </div>

        {/* Email List */}
        <div className="flex-1 flex">
          <div className="w-96 bg-white rounded-xl shadow-sm border mr-4">
            <div className="p-4 border-b">
              {/* Search and Filters */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search emails..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  onClick={() => setShowSearchFilters(!showSearchFilters)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <Filter className="w-5 h-5" />
                </button>
              </div>

              {/* Advanced Filters */}
              {showSearchFilters && (
                <div className="mb-3 p-3 bg-gray-50 rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-medium text-gray-600">Date:</label>
                    <select
                      value={searchFilters.dateRange}
                      onChange={(e) => setSearchFilters({ ...searchFilters, dateRange: e.target.value })}
                      className="text-xs px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                    >
                      <option value="all">All time</option>
                      <option value="today">Today</option>
                      <option value="week">This week</option>
                      <option value="month">This month</option>
                      <option value="year">This year</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-xs font-medium text-gray-600">From:</label>
                    <input
                      type="text"
                      placeholder="Person or email"
                      value={searchFilters.fromPerson}
                      onChange={(e) => setSearchFilters({ ...searchFilters, fromPerson: e.target.value })}
                      className="text-xs px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-primary-500 flex-1"
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="flex items-center text-xs">
                      <input
                        type="checkbox"
                        checked={searchFilters.hasAttachments}
                        onChange={(e) => setSearchFilters({ ...searchFilters, hasAttachments: e.target.checked })}
                        className="mr-1"
                      />
                      Has attachments
                    </label>
                    <label className="flex items-center text-xs">
                      <input
                        type="checkbox"
                        checked={searchFilters.isUnread}
                        onChange={(e) => setSearchFilters({ ...searchFilters, isUnread: e.target.checked })}
                        className="mr-1"
                      />
                      Unread only
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-xs font-medium text-gray-600">Priority:</label>
                    <select
                      value={searchFilters.priority}
                      onChange={(e) => setSearchFilters({ ...searchFilters, priority: e.target.value as any })}
                      className="text-xs px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                    >
                      <option value="all">All</option>
                      <option value="high">High</option>
                      <option value="normal">Normal</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Bulk Actions */}
              {selectedEmails.length > 0 && (
                <div className="mb-3 p-2 bg-blue-50 rounded-lg flex items-center justify-between">
                  <span className="text-sm text-blue-700">
                    {selectedEmails.length} selected
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleBulkAction('read')}
                      className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Mark read
                    </button>
                    <button
                      onClick={() => handleBulkAction('archive')}
                      className="text-xs px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                    >
                      Archive
                    </button>
                    <button
                      onClick={() => handleBulkAction('delete')}
                      className="text-xs px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => {
                        setSelectedEmails([])
                        setShowSelectAll(false)
                      }}
                      className="text-xs px-2 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Select All Checkbox */}
              <div className="flex items-center mb-2">
                <button
                  onClick={handleSelectAll}
                  className="flex items-center text-xs text-gray-600 hover:text-gray-800"
                >
                  {showSelectAll ? (
                    <CheckSquare className="w-4 h-4 mr-1" />
                  ) : (
                    <Square className="w-4 h-4 mr-1" />
                  )}
                  Select all
                </button>
              </div>
            </div>

            <div className="overflow-auto" style={{ maxHeight: '600px' }}>
              {filteredEmails.map(email => (
                <div
                  key={email.id}
                  className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedEmail?.id === email.id ? 'bg-blue-50' : ''
                  } ${!email.isRead ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    {/* Selection Checkbox */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSelectEmail(email.id)
                      }}
                      className="mt-1"
                    >
                      {selectedEmails.includes(email.id) ? (
                        <CheckSquare className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Square className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>

                    {/* Email Content */}
                    <div className="flex-1 min-w-0">
                      <div
                        onClick={() => {
                          setSelectedEmail(email)
                          handleMarkAsRead(email.id)
                        }}
                      >
                        <div className="flex items-start justify-between mb-1">
                          <div className="flex items-center gap-2 min-w-0">
                            {/* Priority Indicator */}
                            {email.priority === 'high' && (
                              <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0 mt-1" />
                            )}
                            <span className={`text-sm ${!email.isRead ? 'font-semibold' : ''} text-gray-800 truncate`}>
                              {email.folder === 'sent' ? `To: ${email.to.join(', ')}` : (email.fromName || email.from)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {/* Important Indicator */}
                            {email.isImportant && (
                              <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                            )}
                            {/* Scheduled Indicator */}
                            {email.isScheduled && (
                              <Clock className="w-3 h-3 text-blue-500" />
                            )}
                            {/* Thread Count */}
                            {email.threadCount && email.threadCount > 1 && (
                              <span className="text-xs bg-gray-200 px-1 py-0.5 rounded">
                                {email.threadCount}
                              </span>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleStar(email.id)
                              }}
                              className="text-gray-400 hover:text-yellow-500"
                            >
                              <Star className={`w-4 h-4 ${email.isStarred ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                            </button>
                          </div>
                        </div>

                        <h3 className={`text-sm ${!email.isRead ? 'font-semibold' : ''} text-gray-900 mb-1 truncate`}>
                          {email.subject}
                        </h3>

                        <p className="text-sm text-gray-600 truncate mb-2">{email.body}</p>

                        {/* Labels */}
                        {email.labels.length > 0 && (
                          <div className="flex gap-1 mb-2 flex-wrap">
                            {email.labels.map(labelId => {
                              const label = availableLabels.find(l => l.id === labelId)
                              if (!label) return null
                              return (
                                <span
                                  key={labelId}
                                  className={`text-xs px-1.5 py-0.5 rounded text-white ${label.color}`}
                                >
                                  {label.name}
                                </span>
                              )
                            })}
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">{email.date} at {email.time}</span>
                          <div className="flex items-center gap-2">
                            {/* CC/BCC Indicators */}
                            {(email.cc && email.cc.length > 0) && (
                              <span className="text-xs text-gray-400">CC</span>
                            )}
                            {(email.bcc && email.bcc.length > 0) && (
                              <span className="text-xs text-gray-400">BCC</span>
                            )}
                            {/* Attachments */}
                            {email.attachments && email.attachments.length > 0 && (
                              <div className="flex items-center gap-1">
                                <Paperclip className="w-3 h-3 text-gray-400" />
                                <span className="text-xs text-gray-500">{email.attachments.length}</span>
                              </div>
                            )}
                            {/* Draft indicator */}
                            {email.isDraft && (
                              <span className="text-xs text-gray-500 italic">Draft</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {filteredEmails.length === 0 && (
                <div className="text-center py-8">
                  <Mail className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No emails found</p>
                </div>
              )}
            </div>
          </div>

          {/* Email Content */}
          <div className="flex-1 bg-white rounded-xl shadow-sm border">
            {selectedEmail ? (
              <div className="h-full flex flex-col">
                <div className="p-6 border-b">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold text-gray-800 mb-2">{selectedEmail.subject}</h2>

                      {/* Email Labels */}
                      {selectedEmail.labels.length > 0 && (
                        <div className="flex gap-2 mb-2">
                          {selectedEmail.labels.map(labelId => {
                            const label = availableLabels.find(l => l.id === labelId)
                            if (!label) return null
                            return (
                              <span
                                key={labelId}
                                className={`text-xs px-2 py-1 rounded text-white ${label.color}`}
                              >
                                {label.name}
                              </span>
                            )
                          })}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {/* Archive button */}
                      <button
                        onClick={() => handleBulkAction('archive')}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                        title="Archive"
                      >
                        <Archive className="w-5 h-5" />
                      </button>

                      {/* Mark as important */}
                      <button
                        onClick={() => setEmails(emails.map(e =>
                          e.id === selectedEmail.id ? { ...e, isImportant: !e.isImportant } : e
                        ))}
                        className="p-2 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                        title="Mark as important"
                      >
                        <Star className={`w-5 h-5 ${selectedEmail.isImportant ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                      </button>

                      {/* Reply */}
                      <button
                        onClick={() => handleReply(false)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Reply"
                      >
                        <Reply className="w-5 h-5" />
                      </button>

                      {/* Reply All */}
                      <button
                        onClick={() => handleReply(true)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Reply All"
                      >
                        <ReplyAll className="w-5 h-5" />
                      </button>

                      {/* Forward */}
                      <button
                        onClick={handleForward}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Forward"
                      >
                        <Forward className="w-5 h-5" />
                      </button>

                      {/* More options */}
                      <div className="relative">
                        <button
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                          title="More options"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Email Metadata */}
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-2" />
                        <span className="font-medium">
                          {selectedEmail.folder === 'sent' ? 'From: me@example.com' : `From: ${selectedEmail.fromName || selectedEmail.from}`}
                        </span>
                        {selectedEmail.isImportant && (
                          <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Important</span>
                        )}
                        {selectedEmail.priority === 'high' && (
                          <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded">High Priority</span>
                        )}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>{selectedEmail.date} at {selectedEmail.time}</span>
                        {selectedEmail.isScheduled && (
                          <Clock className="w-4 h-4 ml-2 text-blue-500" title="Scheduled" />
                        )}
                      </div>
                    </div>

                    {selectedEmail.to.length > 0 && (
                      <div>
                        <span className="font-medium">To: </span>
                        {selectedEmail.to.join(', ')}
                      </div>
                    )}

                    {selectedEmail.cc && selectedEmail.cc.length > 0 && (
                      <div>
                        <span className="font-medium">CC: </span>
                        {selectedEmail.cc.join(', ')}
                      </div>
                    )}

                    {selectedEmail.bcc && selectedEmail.bcc.length > 0 && (
                      <div>
                        <span className="font-medium">BCC: </span>
                        {selectedEmail.bcc.join(', ')}
                      </div>
                    )}

                    {/* Thread Info */}
                    {selectedEmail.threadCount && selectedEmail.threadCount > 1 && (
                      <div className="text-xs text-blue-600">
                        {selectedEmail.threadCount} messages in this conversation
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex-1 p-6 overflow-auto">
                  <div className="whitespace-pre-wrap text-gray-700">{selectedEmail.body}</div>

                  {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Attachments ({selectedEmail.attachments.length})</h4>
                      <div className="space-y-2">
                        {selectedEmail.attachments.map((attachment) => (
                          <div key={attachment.id} className="flex items-center justify-between p-2 bg-white rounded border hover:bg-gray-50">
                            <div className="flex items-center gap-2">
                              <Paperclip className="w-4 h-4 text-gray-400" />
                              <div>
                                <span className="text-sm font-medium text-gray-700">{attachment.name}</span>
                                <span className="text-xs text-gray-500 ml-2">{attachment.size}</span>
                              </div>
                            </div>
                            <button
                              className="text-blue-500 hover:text-blue-700 text-sm"
                              title="Download attachment"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quick Reply Section */}
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-gray-700">Quick Reply</h4>
                      <button
                        onClick={() => setShowQuickReply(!showQuickReply)}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        {showQuickReply ? 'Hide' : 'Show'}
                      </button>
                    </div>

                    {showQuickReply && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex gap-2 mb-3">
                          <button className="text-xs px-2 py-1 bg-white border rounded hover:bg-gray-50">
                            Thanks!
                          </button>
                          <button className="text-xs px-2 py-1 bg-white border rounded hover:bg-gray-50">
                            Got it, thanks.
                          </button>
                          <button className="text-xs px-2 py-1 bg-white border rounded hover:bg-gray-50">
                            Sounds good!
                          </button>
                          <button className="text-xs px-2 py-1 bg-white border rounded hover:bg-gray-50">
                            I'll look into this.
                          </button>
                        </div>
                        <textarea
                          placeholder="Type your quick reply..."
                          className="w-full p-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                          rows={3}
                        />
                        <div className="flex justify-end gap-2 mt-2">
                          <button className="text-xs px-3 py-1 text-gray-600 hover:bg-gray-200 rounded">
                            Cancel
                          </button>
                          <button
                            onClick={() => {
                              handleReply(false)
                              setShowQuickReply(false)
                            }}
                            className="text-xs px-3 py-1 bg-primary-500 text-white rounded hover:bg-primary-600"
                          >
                            Send Reply
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Email Actions Bar */}
                <div className="p-4 border-t bg-gray-50">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleReply(false)}
                      className="flex-1 bg-primary-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-600 transition-colors flex items-center justify-center"
                    >
                      <Reply className="w-4 h-4 mr-2" />
                      Reply
                    </button>
                    <button
                      onClick={() => handleReply(true)}
                      className="flex-1 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center"
                    >
                      <ReplyAll className="w-4 h-4 mr-2" />
                      Reply All
                    </button>
                    <button
                      onClick={handleForward}
                      className="flex-1 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center"
                    >
                      <Forward className="w-4 h-4 mr-2" />
                      Forward
                    </button>
                  </div>
                </div>
              </div>
            ) : showAnalytics ? (
              /* Analytics Dashboard */
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-6">Email Analytics</h2>
                {(() => {
                  const analytics = getAnalytics()
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{analytics.sentCount}</div>
                        <div className="text-sm text-gray-600">Emails Sent</div>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{analytics.receivedCount}</div>
                        <div className="text-sm text-gray-600">Emails Received</div>
                      </div>
                      <div className="bg-yellow-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600">{analytics.replyRate.toFixed(1)}%</div>
                        <div className="text-sm text-gray-600">Reply Rate</div>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">{analytics.averageResponseTime}</div>
                        <div className="text-sm text-gray-600">Avg Response Time</div>
                      </div>
                    </div>
                  )
                })()}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Most Contacted</h3>
                  <div className="space-y-2">
                    {getAnalytics().mostContacted.map((contact, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{contact.email}</span>
                        <span className="text-sm font-medium text-gray-800">{contact.count} emails</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                  <Mail className="w-16 h-16 mx-auto mb-4" />
                  <p>Select an email to read</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Advanced Compose Modal */}
      {showCompose && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">
                {isComposingReply ? 'Reply to Email' : 'New Message'}
                {composeData.isDraft && <span className="text-sm text-gray-500 ml-2">(Draft)</span>}
              </h2>
              <div className="flex items-center gap-2">
                {/* Templates Button */}
                <button
                  onClick={() => setShowTemplates(!showTemplates)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
                  title="Use template"
                >
                  <Edit className="w-5 h-5" />
                </button>

                {/* Schedule Send Button */}
                <button
                  onClick={() => setShowScheduleSend(!showScheduleSend)}
                  className={`p-2 rounded-lg transition-colors ${
                    showScheduleSend ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-gray-600'
                  }`}
                  title="Schedule send"
                >
                  <Clock className="w-5 h-5" />
                </button>

                {/* Close Button */}
                <button
                  onClick={() => {
                    setShowCompose(false)
                    setShowCc(false)
                    setShowBcc(false)
                    setShowScheduleSend(false)
                    setIsComposingReply(false)
                    setReplyingToEmail(null)
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Templates Dropdown */}
            {showTemplates && (
              <div className="p-4 bg-gray-50 border-b">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Email Templates</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {emailTemplates.map(template => (
                    <button
                      key={template.id}
                      onClick={() => handleApplyTemplate(template)}
                      className="text-left p-2 bg-white border rounded hover:bg-gray-50 text-sm"
                    >
                      <div className="font-medium">{template.name}</div>
                      <div className="text-xs text-gray-500 truncate">{template.subject}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Schedule Send Options */}
            {showScheduleSend && (
              <div className="p-4 bg-blue-50 border-b">
                <h3 className="text-sm font-semibold text-blue-800 mb-2">Schedule Send</h3>
                <input
                  type="datetime-local"
                  value={scheduleDateTime}
                  onChange={(e) => setScheduleDateTime(e.target.value)}
                  className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>
            )}

            {/* Compose Form */}
            <div className="flex-1 overflow-auto p-6">
              <div className="space-y-4">
                {/* Recipients */}
                <div className="space-y-2">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Recipients (comma separated)..."
                      value={composeData.to}
                      onChange={(e) => setComposeData({ ...composeData, to: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 pr-20"
                    />
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
                      <button
                        onClick={() => setShowCc(!showCc)}
                        className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100"
                      >
                        CC
                      </button>
                      <button
                        onClick={() => setShowBcc(!showBcc)}
                        className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100"
                      >
                        BCC
                      </button>
                    </div>
                  </div>

                  {/* CC Field */}
                  {showCc && (
                    <input
                      type="text"
                      placeholder="CC recipients (comma separated)..."
                      value={composeData.cc}
                      onChange={(e) => setComposeData({ ...composeData, cc: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  )}

                  {/* BCC Field */}
                  {showBcc && (
                    <input
                      type="text"
                      placeholder="BCC recipients (comma separated)..."
                      value={composeData.bcc}
                      onChange={(e) => setComposeData({ ...composeData, bcc: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  )}
                </div>

                {/* Subject */}
                <input
                  type="text"
                  placeholder="Subject..."
                  value={composeData.subject}
                  onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />

                {/* Rich Text Editor Toolbar */}
                {showRichTextEditor && (
                  <div className="flex items-center gap-2 p-2 border rounded-t-lg bg-gray-50">
                    <button className="p-1 hover:bg-gray-200 rounded" title="Bold">
                      <Bold className="w-4 h-4" />
                    </button>
                    <button className="p-1 hover:bg-gray-200 rounded" title="Italic">
                      <Italic className="w-4 h-4" />
                    </button>
                    <div className="w-px h-4 bg-gray-300" />
                    <button className="p-1 hover:bg-gray-200 rounded" title="Bullet list">
                      <List className="w-4 h-4" />
                    </button>
                    <button className="p-1 hover:bg-gray-200 rounded" title="Numbered list">
                      <ListOrdered className="w-4 h-4" />
                    </button>
                    <div className="w-px h-4 bg-gray-300" />
                    <button className="p-1 hover:bg-gray-200 rounded" title="Insert link">
                      <Link className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setShowRichTextEditor(!showRichTextEditor)}
                      className="p-1 hover:bg-gray-200 rounded ml-auto"
                      title="Toggle rich text"
                    >
                      <EyeOff className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Message Body */}
                <div className={`${showRichTextEditor ? 'border rounded-t-lg' : 'border rounded-lg'}`}>
                  <textarea
                    placeholder={showRichTextEditor ? "Compose your message..." : "Write your message..."}
                    value={composeData.body}
                    onChange={(e) => setComposeData({ ...composeData, body: e.target.value })}
                    className={`w-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none ${
                      showRichTextEditor ? 'rounded-b-lg' : ''
                    }`}
                    style={{ height: '300px', borderTop: showRichTextEditor ? 'none' : '' }}
                  />
                </div>

                {/* Plain Text Mode Toggle */}
                {!showRichTextEditor && (
                  <button
                    onClick={() => setShowRichTextEditor(true)}
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3" />
                    Rich text editor
                  </button>
                )}

                {/* Attachments */}
                {composeData.attachments.length > 0 && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Attachments</h4>
                    <div className="space-y-1">
                      {composeData.attachments.map((attachment, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <Paperclip className="w-3 h-3 text-gray-400" />
                            <span>{attachment.name}</span>
                            <span className="text-xs text-gray-500">({attachment.size})</span>
                          </div>
                          <button className="text-red-500 hover:text-red-700">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Email Signature Selection */}
                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium text-gray-700">Signature:</label>
                  <select
                    value={selectedSignature?.id || ''}
                    onChange={(e) => {
                      const signature = emailSignatures.find(s => s.id === e.target.value)
                      setSelectedSignature(signature || null)
                      if (signature) {
                        setComposeData({
                          ...composeData,
                          body: composeData.body + '\n\n' + signature.content
                        })
                      }
                    }}
                    className="text-sm px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">No signature</option>
                    {emailSignatures.map(signature => (
                      <option key={signature.id} value={signature.id}>
                        {signature.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-between items-center p-6 border-t bg-gray-50">
              <div className="flex gap-2">
                {/* Attach File Button */}
                <button className="text-gray-600 hover:text-gray-800 flex items-center px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                  <Paperclip className="w-5 h-5 mr-2" />
                  Attach File
                </button>

                {/* Save Draft Button */}
                <button
                  onClick={handleAutoSaveDraft}
                  className="text-gray-600 hover:text-gray-800 flex items-center px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Save className="w-5 h-5 mr-2" />
                  Save Draft
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowCompose(false)
                    setShowCc(false)
                    setShowBcc(false)
                    setShowScheduleSend(false)
                    setIsComposingReply(false)
                    setReplyingToEmail(null)
                  }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCompose}
                  className="px-4 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 flex items-center"
                >
                  {showScheduleSend ? (
                    <>
                      <Clock className="w-4 h-4 mr-2" />
                      Schedule Send
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}