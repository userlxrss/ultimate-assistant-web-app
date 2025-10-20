import { z } from 'zod';

// Common validation schemas
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional()
});

export const idSchema = z.string().cuid();

// Journal validation schemas
export const createJournalEntrySchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(10000),
  mood: z.enum(['happy', 'sad', 'neutral', 'excited', 'anxious', 'angry', 'calm', 'frustrated']).optional(),
  tags: z.array(z.string().max(50)).max(10).default([]),
  isPrivate: z.boolean().default(true)
});

export const updateJournalEntrySchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).max(10000).optional(),
  mood: z.enum(['happy', 'sad', 'neutral', 'excited', 'anxious', 'angry', 'calm', 'frustrated']).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  isPrivate: z.boolean().optional()
});

export const journalFiltersSchema = z.object({
  mood: z.enum(['happy', 'sad', 'neutral', 'excited', 'anxious', 'angry', 'calm', 'frustrated']).optional(),
  tags: z.array(z.string()).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  search: z.string().optional()
}).merge(paginationSchema);

// Tasks validation schemas
export const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  dueDate: z.coerce.date().optional(),
  estimatedTime: z.number().int().min(1).max(480).optional(), // max 8 hours
  tags: z.array(z.string().max(50)).max(10).default([])
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  dueDate: z.coerce.date().optional(),
  estimatedTime: z.number().int().min(1).max(480).optional(),
  actualTime: z.number().int().min(1).max(480).optional(),
  tags: z.array(z.string().max(50)).max(10).optional()
});

export const taskFiltersSchema = z.object({
  status: z.enum(['TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  dueDateFrom: z.coerce.date().optional(),
  dueDateTo: z.coerce.date().optional(),
  tags: z.array(z.string()).optional(),
  search: z.string().optional()
}).merge(paginationSchema);

// Calendar validation schemas
export const createCalendarEventSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  location: z.string().max(200).optional(),
  isAllDay: z.boolean().default(false),
  attendees: z.array(z.string().email()).max(50).default([])
}).refine((data) => {
  if (data.isAllDay) {
    return true;
  }
  return data.endTime > data.startTime;
}, {
  message: "End time must be after start time",
  path: ["endTime"]
});

export const updateCalendarEventSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  startTime: z.coerce.date().optional(),
  endTime: z.coerce.date().optional(),
  location: z.string().max(200).optional(),
  isAllDay: z.boolean().optional(),
  status: z.string().max(50).optional(),
  attendees: z.array(z.string().email()).max(50).optional()
}).refine((data) => {
  if (data.startTime && data.endTime) {
    if (data.isAllDay !== undefined && data.isAllDay) {
      return true;
    }
    return data.endTime > data.startTime;
  }
  return true;
}, {
  message: "End time must be after start time",
  path: ["endTime"]
});

export const calendarFiltersSchema = z.object({
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  status: z.string().optional(),
  location: z.string().optional(),
  search: z.string().optional()
}).merge(paginationSchema);

// Email validation schemas
export const sendEmailSchema = z.object({
  to: z.array(z.string().email()).min(1).max(50),
  cc: z.array(z.string().email()).max(50).default([]),
  bcc: z.array(z.string().email()).max(50).default([]),
  subject: z.string().min(1).max(200),
  content: z.string().min(1).max(10000),
  htmlContent: z.string().max(50000).optional(),
  attachments: z.array(z.string()).max(10).default([])
});

export const emailFiltersSchema = z.object({
  isRead: z.coerce.boolean().optional(),
  isImportant: z.coerce.boolean().optional(),
  isDraft: z.coerce.boolean().optional(),
  labels: z.array(z.string()).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  from: z.string().email().optional(),
  search: z.string().optional()
}).merge(paginationSchema);

// Contacts validation schemas
export const createContactSchema = z.object({
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(20).optional(),
  company: z.string().max(100).optional(),
  jobTitle: z.string().max(100).optional(),
  notes: z.string().max(2000).optional(),
  tags: z.array(z.string().max(50)).max(10).default([]),
  isFavorite: z.boolean().default(false)
}).refine((data) => data.firstName || data.lastName || data.email || data.phone, {
  message: "At least one of firstName, lastName, email, or phone must be provided"
});

export const updateContactSchema = z.object({
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(20).optional(),
  company: z.string().max(100).optional(),
  jobTitle: z.string().max(100).optional(),
  notes: z.string().max(2000).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  isFavorite: z.boolean().optional()
});

export const contactFiltersSchema = z.object({
  company: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isFavorite: z.coerce.boolean().optional(),
  search: z.string().optional()
}).merge(paginationSchema);

// Analytics validation schemas
export const analyticsQuerySchema = z.object({
  metricTypes: z.array(z.string()).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  granularity: z.enum(['day', 'week', 'month']).default('day')
});

// Auth validation schemas
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100),
  password: z.string().min(8).max(100)
});

// API key validation schema
export const apiKeySchema = z.object({
  key: z.string().min(1),
  permissions: z.array(z.string()).optional()
});

// Bulk operations schema
export const bulkOperationSchema = z.object({
  ids: z.array(z.string().cuid()).min(1).max(100),
  operation: z.enum(['delete', 'update', 'archive'])
});

// Search schema
export const searchSchema = z.object({
  query: z.string().min(1).max(200),
  types: z.array(z.enum(['journal', 'tasks', 'calendar', 'emails', 'contacts'])).default(['journal', 'tasks', 'calendar', 'emails', 'contacts']),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20)
});

// Export all validation schemas
export const validationSchemas = {
  pagination: paginationSchema,
  id: idSchema,

  // Journal
  createJournalEntry: createJournalEntrySchema,
  updateJournalEntry: updateJournalEntrySchema,
  journalFilters: journalFiltersSchema,

  // Tasks
  createTask: createTaskSchema,
  updateTask: updateTaskSchema,
  taskFilters: taskFiltersSchema,

  // Calendar
  createCalendarEvent: createCalendarEventSchema,
  updateCalendarEvent: updateCalendarEventSchema,
  calendarFilters: calendarFiltersSchema,

  // Email
  sendEmail: sendEmailSchema,
  emailFilters: emailFiltersSchema,

  // Contacts
  createContact: createContactSchema,
  updateContact: updateContactSchema,
  contactFilters: contactFiltersSchema,

  // Analytics
  analyticsQuery: analyticsQuerySchema,

  // Auth
  login: loginSchema,
  register: registerSchema,

  // Utilities
  apiKey: apiKeySchema,
  bulkOperation: bulkOperationSchema,
  search: searchSchema
};

export type ValidationSchemas = typeof validationSchemas;