export interface EmailAddress {
  email: string;
  name?: string;
}

export interface EmailAttachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  url?: string;
}

export interface Email {
  id: string;
  threadId: string;
  subject: string;
  snippet: string;
  body: string;
  from: EmailAddress;
  to: EmailAddress[];
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
  date: Date;
  isRead: boolean;
  isStarred: boolean;
  isImportant: boolean;
  labels: string[];
  attachments: EmailAttachment[];
  hasAttachments: boolean;
  folder: 'inbox' | 'sent' | 'drafts' | 'spam' | 'trash' | 'important';
  isDraft?: boolean;
}

export interface EmailThread {
  id: string;
  messages: Email[];
  subject: string;
  participants: EmailAddress[];
  lastMessage: Date;
  messageCount: number;
  isRead: boolean;
  hasAttachments: boolean;
  snippet: string;
}

export interface EmailFolder {
  id: string;
  name: string;
  count: number;
  unreadCount: number;
  type: 'system' | 'custom';
}

export interface EmailFilter {
  query?: string;
  from?: string;
  to?: string;
  subject?: string;
  hasAttachments?: boolean;
  isUnread?: boolean;
  isStarred?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  labels?: string[];
}

export interface ComposeEmailData {
  to: EmailAddress[];
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
  subject: string;
  body: string;
  attachments?: File[];
  isDraft?: boolean;
  replyTo?: string;
  forwardOf?: string;
}

export interface GmailAPIConfig {
  apiKey: string;
  clientId: string;
  accessToken?: string;
  refreshToken?: string;
}

export interface GmailSyncResult {
  success: boolean;
  message: string;
  emailsSynced?: number;
  error?: string;
}