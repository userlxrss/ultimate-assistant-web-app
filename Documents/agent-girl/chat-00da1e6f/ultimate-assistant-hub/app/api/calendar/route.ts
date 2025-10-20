import { NextRequest } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { db } from '@/lib/db';
import { createSuccessResponse, handleApiError } from '@/utils/api-response';
import { validateQueryParams, validateRequest } from '@/utils/validation';
import { validationSchemas } from '@/validations';
import { paginationHelper } from '@/utils/pagination';

export const GET = withAuth(async (request: NextRequest, { user }) => {
  try {
    const { searchParams } = new URL(request.url);
    const { data: filters, error } = validateQueryParams(searchParams, validationSchemas.calendarFilters);

    if (error) {
      return error;
    }

    const {
      page,
      limit,
      sortBy = 'startTime',
      sortOrder = 'asc',
      search,
      dateFrom,
      dateTo,
      status,
      location
    } = filters;

    // Build where clause
    const where: any = { userId: user.id };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (dateFrom || dateTo) {
      where.startTime = {};
      if (dateFrom) where.startTime.gte = dateFrom;
      if (dateTo) where.startTime.lte = dateTo;
    }

    if (status) {
      where.status = status;
    }

    if (location) {
      where.location = { contains: location, mode: 'insensitive' };
    }

    // Get total count for pagination
    const total = await db.calendarEvent.count({ where });

    // Get paginated results
    const { skip, take, paginationMeta } = paginationHelper(page, limit, total);

    const events = await db.calendarEvent.findMany({
      where,
      skip,
      take,
      orderBy: { [sortBy]: sortOrder },
      select: {
        id: true,
        title: true,
        description: true,
        startTime: true,
        endTime: true,
        location: true,
        isAllDay: true,
        googleEventId: true,
        status: true,
        attendees: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return createSuccessResponse(events, paginationMeta);

  } catch (error) {
    return handleApiError(error);
  }
});

export const POST = withAuth(async (request: NextRequest, { user }) => {
  try {
    const { data, error } = await validateRequest(request, validationSchemas.createCalendarEvent);

    if (error) {
      return error;
    }

    const event = await db.calendarEvent.create({
      data: {
        ...data,
        userId: user.id
      },
      select: {
        id: true,
        title: true,
        description: true,
        startTime: true,
        endTime: true,
        location: true,
        isAllDay: true,
        googleEventId: true,
        status: true,
        attendees: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Sync with Google Calendar if credentials are available
    if (process.env.GOOGLE_CALENDAR_CLIENT_ID && process.env.GOOGLE_CALENDAR_CLIENT_SECRET) {
      try {
        const googleEventId = await syncWithGoogleCalendar(event, user.id);
        if (googleEventId) {
          await db.calendarEvent.update({
            where: { id: event.id },
            data: { googleEventId }
          });
          event.googleEventId = googleEventId;
        }
      } catch (googleError) {
        console.error('Failed to sync with Google Calendar:', googleError);
      }
    }

    return createSuccessResponse(event, undefined, 201);

  } catch (error) {
    return handleApiError(error);
  }
});

async function syncWithGoogleCalendar(event: any, userId: string): Promise<string | null> {
  try {
    // This is a simplified example - in production you'd need to:
    // 1. Get user's Google Calendar refresh token from database
    // 2. Exchange it for access token
    // 3. Make API calls to Google Calendar

    const googleEventData = {
      summary: event.title,
      description: event.description,
      start: {
        dateTime: event.startTime.toISOString(),
        timeZone: 'UTC'
      },
      end: {
        dateTime: event.endTime.toISOString(),
        timeZone: 'UTC'
      },
      location: event.location,
      attendees: event.attendees.map((email: string) => ({ email })),
      status: event.status
    };

    // For now, return a mock ID - in production this would be the actual Google Calendar event ID
    return `google_${Date.now()}`;
  } catch (error) {
    console.error('Google Calendar sync error:', error);
    return null;
  }
}