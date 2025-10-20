import { NextRequest } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { db } from '@/lib/db';
import { createSuccessResponse, createNotFoundResponse, handleApiError, validateId } from '@/utils/api-response';
import { validateRequest } from '@/utils/validation';
import { validationSchemas } from '@/validations';

interface RouteParams {
  params: { id: string };
}

export const GET = withAuth(async (request: NextRequest, { user }: { user: any }) => {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];

    if (!validateId(id)) {
      return createNotFoundResponse('Journal entry');
    }

    const journalEntry = await db.journalEntry.findFirst({
      where: {
        id,
        userId: user.id
      },
      select: {
        id: true,
        title: true,
        content: true,
        mood: true,
        tags: true,
        isPrivate: true,
        aiReflection: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!journalEntry) {
      return createNotFoundResponse('Journal entry');
    }

    return createSuccessResponse(journalEntry);

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
      return createNotFoundResponse('Journal entry');
    }

    const { data, error } = await validateRequest(request, validationSchemas.updateJournalEntry);

    if (error) {
      return error;
    }

    // Check if entry exists and belongs to user
    const existingEntry = await db.journalEntry.findFirst({
      where: { id, userId: user.id }
    });

    if (!existingEntry) {
      return createNotFoundResponse('Journal entry');
    }

    const updatedEntry = await db.journalEntry.update({
      where: { id },
      data,
      select: {
        id: true,
        title: true,
        content: true,
        mood: true,
        tags: true,
        isPrivate: true,
        aiReflection: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return createSuccessResponse(updatedEntry);

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
      return createNotFoundResponse('Journal entry');
    }

    // Check if entry exists and belongs to user
    const existingEntry = await db.journalEntry.findFirst({
      where: { id, userId: user.id }
    });

    if (!existingEntry) {
      return createNotFoundResponse('Journal entry');
    }

    await db.journalEntry.delete({
      where: { id }
    });

    return createSuccessResponse({ deleted: true });

  } catch (error) {
    return handleApiError(error);
  }
});