import { NextRequest } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { db } from '@/lib/db';
import { createSuccessResponse, createNotFoundResponse, handleApiError, validateId } from '@/utils/api-response';
import { validateRequest } from '@/utils/validation';
import { validationSchemas } from '@/validations';

export const GET = withAuth(async (request: NextRequest, { user }: { user: any }) => {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];

    if (!validateId(id)) {
      return createNotFoundResponse('Calendar event');
    }

    const event = await db.calendarEvent.findFirst({
      where: {
        id,
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

    if (!event) {
      return createNotFoundResponse('Calendar event');
    }

    return createSuccessResponse(event);

  } catch (error) {
    return handleApiError(error);
  }
});

export const PUT = withAuth(async (request: NextRequest, { user }: { user: any }) => {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];

    if (!validateId(id)) {
      return createNotFoundResponse('Calendar event');
    }

    const { data, error } = await validateRequest(request, validationSchemas.updateCalendarEvent);

    if (error) {
      return error;
    }

    // Check if event exists and belongs to user
    const existingEvent = await db.calendarEvent.findFirst({
      where: { id, userId: user.id }
    });

    if (!existingEvent) {
      return createNotFoundResponse('Calendar event');
    }

    const updatedEvent = await db.calendarEvent.update({
      where: { id },
      data,
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

    // Sync with Google Calendar if there's a googleEventId
    if (updatedEvent.googleEventId && process.env.GOOGLE_CALENDAR_CLIENT_ID) {
      try {
        await updateGoogleCalendarEvent(updatedEvent);
      } catch (googleError) {
        console.error('Failed to update Google Calendar event:', googleError);
      }
    }

    return createSuccessResponse(updatedEvent);

  } catch (error) {
    return handleApiError(error);
  }
});

export const DELETE = withAuth(async (request: NextRequest, { user }: { user: any }) => {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];

    if (!validateId(id)) {
      return createNotFoundResponse('Calendar event');
    }

    // Check if event exists and belongs to user
    const existingEvent = await db.calendarEvent.findFirst({
      where: { id, userId: user.id },
      select: { googleEventId: true }
    });

    if (!existingEvent) {
      return createNotFoundResponse('Calendar event');
    }

    // Delete from Google Calendar if there's a googleEventId
    if (existingEvent.googleEventId && process.env.GOOGLE_CALENDAR_CLIENT_ID) {
      try {
        await deleteGoogleCalendarEvent(existingEvent.googleEventId);
      } catch (googleError) {
        console.error('Failed to delete from Google Calendar:', googleError);
      }
    }

    await db.calendarEvent.delete({
      where: { id }
    });

    return createSuccessResponse({ deleted: true });

  } catch (error) {
    return handleApiError(error);
  }
});

async function updateGoogleCalendarEvent(event: any): Promise<void> {
  try {
    // This is a simplified example - in production you'd:
    // 1. Get user's Google Calendar access token
    // 2. Make API call to update the event

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

    console.log('Would update Google Calendar event:', googleEventData);
  } catch (error) {
    console.error('Google Calendar update error:', error);
    throw error;
  }
}

async function deleteGoogleCalendarEvent(googleEventId: string): Promise<void> {
  try {
    // This is a simplified example - in production you'd:
    // 1. Get user's Google Calendar access token
    // 2. Make API call to delete the event

    console.log('Would delete Google Calendar event:', googleEventId);
  } catch (error) {
    console.error('Google Calendar delete error:', error);
    throw error;
  }
}