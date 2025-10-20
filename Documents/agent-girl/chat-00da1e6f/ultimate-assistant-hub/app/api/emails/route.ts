import { NextRequest } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { db } from '@/lib/db';
import { createSuccessResponse, handleApiError } from '@/utils/api-response';
import { validateQueryParams } from '@/utils/validation';
import { validationSchemas } from '@/validations';
import { paginationHelper } from '@/utils/pagination';

export const GET = withAuth(async (request: NextRequest, { user }) => {
  try {
    const { searchParams } = new URL(request.url);
    const { data: filters, error } = validateQueryParams(searchParams, validationSchemas.emailFilters);

    if (error) {
      return error;
    }

    const {
      page,
      limit,
      sortBy = 'receivedAt',
      sortOrder = 'desc',
      search,
      isRead,
      isImportant,
      isDraft,
      labels,
      dateFrom,
      dateTo,
      from
    } = filters;

    // Build where clause
    const where: any = { userId: user.id };

    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { from: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (isRead !== undefined) {
      where.isRead = isRead;
    }

    if (isImportant !== undefined) {
      where.isImportant = isImportant;
    }

    if (isDraft !== undefined) {
      where.isDraft = isDraft;
    }

    if (labels && labels.length > 0) {
      where.labels = { hasSome: labels };
    }

    if (dateFrom || dateTo) {
      where.receivedAt = {};
      if (dateFrom) where.receivedAt.gte = dateFrom;
      if (dateTo) where.receivedAt.lte = dateTo;
    }

    if (from) {
      where.from = { contains: from, mode: 'insensitive' };
    }

    // Get total count for pagination
    const total = await db.email.count({ where });

    // Get paginated results
    const { skip, take, paginationMeta } = paginationHelper(page, limit, total);

    const emails = await db.email.findMany({
      where,
      skip,
      take,
      orderBy: { [sortBy]: sortOrder },
      select: {
        id: true,
        messageId: true,
        threadId: true,
        subject: true,
        from: true,
        to: true,
        cc: true,
        bcc: true,
        content: true,
        htmlContent: true,
        isRead: true,
        isImportant: true,
        isDraft: true,
        attachments: true,
        labels: true,
        receivedAt: true,
        sentAt: true,
        gmailId: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return createSuccessResponse(emails, paginationMeta);

  } catch (error) {
    return handleApiError(error);
  }
});