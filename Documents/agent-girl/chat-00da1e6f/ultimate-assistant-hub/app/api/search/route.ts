import { NextRequest } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { db } from '@/lib/db';
import { createSuccessResponse, handleApiError } from '@/utils/api-response';
import { validateQueryParams } from '@/utils/validation';
import { validationSchemas } from '@/validations';

export const GET = withAuth(async (request: NextRequest, { user }) => {
  try {
    const { searchParams } = new URL(request.url);
    const { data: searchQuery, error } = validateQueryParams(searchParams, validationSchemas.search);

    if (error) {
      return error;
    }

    const { query, types, dateFrom, dateTo, limit = 20 } = searchQuery;

    const results = await performGlobalSearch(user.id, {
      query,
      types,
      dateFrom,
      dateTo,
      limit
    });

    return createSuccessResponse(results);

  } catch (error) {
    return handleApiError(error);
  }
});

async function performGlobalSearch(
  userId: string,
  options: {
    query: string;
    types: string[];
    dateFrom?: Date;
    dateTo?: Date;
    limit: number;
  }
) {
  const { query, types, dateFrom, dateTo, limit } = options;
  const results: any = {
    query,
    total: 0,
    results: {},
    summary: {}
  };

  // Build date filter
  const dateFilter: any = {};
  if (dateFrom || dateTo) {
    dateFilter.createdAt = {};
    if (dateFrom) dateFilter.createdAt.gte = dateFrom;
    if (dateTo) dateFilter.createdAt.lte = dateTo;
  }

  // Search in Journal Entries
  if (types.includes('journal')) {
    const journalResults = await db.journalEntry.findMany({
      where: {
        userId,
        ...dateFilter,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { content: { contains: query, mode: 'insensitive' } },
          { tags: { hasSome: [query] } }
        ]
      },
      select: {
        id: true,
        title: true,
        content: true,
        mood: true,
        tags: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { updatedAt: 'desc' },
      take: limit
    });

    results.results.journal = journalResults.map(entry => ({
      ...entry,
      type: 'journal',
      relevanceScore: calculateRelevanceScore(query, entry, ['title', 'content', 'tags']),
      excerpt: generateExcerpt(entry.content, query, 150)
    }));

    results.summary.journal = journalResults.length;
    results.total += journalResults.length;
  }

  // Search in Tasks
  if (types.includes('tasks')) {
    const taskResults = await db.task.findMany({
      where: {
        userId,
        ...dateFilter,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { tags: { hasSome: [query] } }
        ]
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        dueDate: true,
        tags: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { updatedAt: 'desc' },
      take: limit
    });

    results.results.tasks = taskResults.map(task => ({
      ...task,
      type: 'task',
      relevanceScore: calculateRelevanceScore(query, task, ['title', 'description', 'tags']),
      excerpt: generateExcerpt(task.description, query, 150)
    }));

    results.summary.tasks = taskResults.length;
    results.total += taskResults.length;
  }

  // Search in Calendar Events
  if (types.includes('calendar')) {
    const eventResults = await db.calendarEvent.findMany({
      where: {
        userId,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { location: { contains: query, mode: 'insensitive' } },
          { attendees: { hasSome: [query] } }
        ],
        ...(dateFrom && { startTime: { gte: dateFrom } }),
        ...(dateTo && { endTime: { lte: dateTo } })
      },
      select: {
        id: true,
        title: true,
        description: true,
        startTime: true,
        endTime: true,
        location: true,
        status: true,
        attendees: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { startTime: 'desc' },
      take: limit
    });

    results.results.calendar = eventResults.map(event => ({
      ...event,
      type: 'calendar',
      relevanceScore: calculateRelevanceScore(query, event, ['title', 'description', 'location', 'attendees']),
      excerpt: generateExcerpt(event.description, query, 150)
    }));

    results.summary.calendar = eventResults.length;
    results.total += eventResults.length;
  }

  // Search in Emails
  if (types.includes('emails')) {
    const emailResults = await db.email.findMany({
      where: {
        userId,
        OR: [
          { subject: { contains: query, mode: 'insensitive' } },
          { content: { contains: query, mode: 'insensitive' } },
          { from: { contains: query, mode: 'insensitive' } },
          { to: { hasSome: [query] } }
        ],
        ...(dateFrom && { receivedAt: { gte: dateFrom } }),
        ...(dateTo && { receivedAt: { lte: dateTo } })
      },
      select: {
        id: true,
        subject: true,
        from: true,
        to: true,
        content: true,
        isRead: true,
        isImportant: true,
        receivedAt: true,
        createdAt: true
      },
      orderBy: { receivedAt: 'desc' },
      take: limit
    });

    results.results.emails = emailResults.map(email => ({
      ...email,
      type: 'email',
      relevanceScore: calculateRelevanceScore(query, email, ['subject', 'content', 'from', 'to']),
      excerpt: generateExcerpt(email.content, query, 150)
    }));

    results.summary.emails = emailResults.length;
    results.total += emailResults.length;
  }

  // Search in Contacts
  if (types.includes('contacts')) {
    const contactResults = await db.contact.findMany({
      where: {
        userId,
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { company: { contains: query, mode: 'insensitive' } },
          { jobTitle: { contains: query, mode: 'insensitive' } },
          { notes: { contains: query, mode: 'insensitive' } },
          { tags: { hasSome: [query] } }
        ]
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        company: true,
        jobTitle: true,
        notes: true,
        tags: true,
        isFavorite: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { updatedAt: 'desc' },
      take: limit
    });

    results.results.contacts = contactResults.map(contact => ({
      ...contact,
      type: 'contact',
      relevanceScore: calculateRelevanceScore(query, contact, ['firstName', 'lastName', 'email', 'company', 'jobTitle', 'notes', 'tags']),
      excerpt: generateExcerpt(contact.notes, query, 150)
    }));

    results.summary.contacts = contactResults.length;
    results.total += contactResults.length;
  }

  // Sort all results by relevance score and limit total results
  const allResults = Object.values(results.results)
    .flat()
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, limit * 2); // Get more than needed for final filtering

  // Group by type again after sorting
  const finalResults: any = {};
  let currentTotal = 0;

  types.forEach(type => {
    const typeResults = allResults.filter(result => result.type === type);
    if (typeResults.length > 0) {
      finalResults[type] = typeResults.slice(0, Math.ceil(limit / types.length));
      currentTotal += finalResults[type].length;
    }
  });

  results.results = finalResults;
  results.total = currentTotal;

  return results;
}

function calculateRelevanceScore(query: string, item: any, searchFields: string[]): number {
  let score = 0;
  const queryLower = query.toLowerCase();

  searchFields.forEach(field => {
    const value = item[field];
    if (value) {
      if (typeof value === 'string') {
        // Exact match gets highest score
        if (value.toLowerCase() === queryLower) {
          score += 10;
        }
        // Starts with query gets high score
        else if (value.toLowerCase().startsWith(queryLower)) {
          score += 7;
        }
        // Contains query gets medium score
        else if (value.toLowerCase().includes(queryLower)) {
          score += 5;
        }

        // Bonus for word boundaries
        const words = value.toLowerCase().split(/\s+/);
        if (words.includes(queryLower)) {
          score += 3;
        }
      } else if (Array.isArray(value)) {
        // For arrays (like tags, attendees, to, etc.)
        value.forEach(arrayItem => {
          if (typeof arrayItem === 'string') {
            if (arrayItem.toLowerCase() === queryLower) {
              score += 8;
            } else if (arrayItem.toLowerCase().includes(queryLower)) {
              score += 4;
            }
          }
        });
      }
    }
  });

  // Bonus for recent items
  const itemDate = item.createdAt || item.receivedAt || item.startTime;
  if (itemDate) {
    const daysSince = (Date.now() - new Date(itemDate).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince < 1) {
      score += 2;
    } else if (daysSince < 7) {
      score += 1;
    }
  }

  // Bonus for important items
  if (item.isImportant || item.priority === 'HIGH' || item.priority === 'URGENT') {
    score += 2;
  }

  return score;
}

function generateExcerpt(content: string | null, query: string, maxLength: number): string {
  if (!content) return '';

  const queryLower = query.toLowerCase();
  const contentLower = content.toLowerCase();
  const queryIndex = contentLower.indexOf(queryLower);

  if (queryIndex === -1) {
    return content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
  }

  // Find the start and end of the excerpt
  const contextLength = Math.floor((maxLength - query.length) / 2);
  let startIndex = Math.max(0, queryIndex - contextLength);
  let endIndex = Math.min(content.length, queryIndex + query.length + contextLength);

  // Try to break at word boundaries
  if (startIndex > 0) {
    const prevSpace = content.lastIndexOf(' ', startIndex);
    if (prevSpace > startIndex - 20) {
      startIndex = prevSpace + 1;
    }
  }

  if (endIndex < content.length) {
    const nextSpace = content.indexOf(' ', endIndex);
    if (nextSpace > 0 && nextSpace - endIndex < 20) {
      endIndex = nextSpace;
    }
  }

  let excerpt = content.substring(startIndex, endIndex);

  // Add ellipsis if we've cut off content
  if (startIndex > 0) {
    excerpt = '...' + excerpt;
  }
  if (endIndex < content.length) {
    excerpt = excerpt + '...';
  }

  return excerpt;
}