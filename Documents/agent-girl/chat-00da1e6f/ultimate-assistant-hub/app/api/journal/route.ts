import { NextRequest } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { db } from '@/lib/db';
import { createSuccessResponse, createNotFoundResponse, handleApiError } from '@/utils/api-response';
import { validateQueryParams } from '@/utils/validation';
import { validationSchemas } from '@/validations';
import { paginationHelper } from '@/utils/pagination';

export const GET = withAuth(async (request: NextRequest, { user }) => {
  try {
    const { searchParams } = new URL(request.url);
    const { data: filters, error } = validateQueryParams(searchParams, validationSchemas.journalFilters);

    if (error) {
      return error;
    }

    const {
      page,
      limit,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search,
      mood,
      tags,
      dateFrom,
      dateTo
    } = filters;

    // Build where clause
    const where: any = { userId: user.id };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (mood) {
      where.mood = mood;
    }

    if (tags && tags.length > 0) {
      where.tags = { hasSome: tags };
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = dateFrom;
      if (dateTo) where.createdAt.lte = dateTo;
    }

    // Get total count for pagination
    const total = await db.journalEntry.count({ where });

    // Get paginated results
    const { skip, take, paginationMeta } = paginationHelper(page, limit, total);

    const journalEntries = await db.journalEntry.findMany({
      where,
      skip,
      take,
      orderBy: { [sortBy]: sortOrder },
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

    return createSuccessResponse(journalEntries, paginationMeta);

  } catch (error) {
    return handleApiError(error);
  }
});

export const POST = withAuth(async (request: NextRequest, { user }) => {
  try {
    const { data, error } = await validateRequest(request, validationSchemas.createJournalEntry);

    if (error) {
      return error;
    }

    const journalEntry = await db.journalEntry.create({
      data: {
        ...data,
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

    return createSuccessResponse(journalEntry, undefined, 201);

  } catch (error) {
    return handleApiError(error);
  }
});