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
    const { data: filters, error } = validateQueryParams(searchParams, validationSchemas.contactFilters);

    if (error) {
      return error;
    }

    const {
      page,
      limit,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search,
      company,
      tags,
      isFavorite
    } = filters;

    // Build where clause
    const where: any = { userId: user.id };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
        { jobTitle: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (company) {
      where.company = { contains: company, mode: 'insensitive' };
    }

    if (tags && tags.length > 0) {
      where.tags = { hasSome: tags };
    }

    if (isFavorite !== undefined) {
      where.isFavorite = isFavorite;
    }

    // Get total count for pagination
    const total = await db.contact.count({ where });

    // Get paginated results
    const { skip, take, paginationMeta } = paginationHelper(page, limit, total);

    const contacts = await db.contact.findMany({
      where,
      skip,
      take,
      orderBy: { [sortBy]: sortOrder },
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
        googleContactId: true,
        isFavorite: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return createSuccessResponse(contacts, paginationMeta);

  } catch (error) {
    return handleApiError(error);
  }
});

export const POST = withAuth(async (request: NextRequest, { user }) => {
  try {
    const { data, error } = await validateRequest(request, validationSchemas.createContact);

    if (error) {
      return error;
    }

    const contact = await db.contact.create({
      data: {
        ...data,
        userId: user.id
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
        googleContactId: true,
        isFavorite: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Sync with Google Contacts if API is available
    if (process.env.GOOGLE_CONTACTS_API_KEY && contact.email) {
      try {
        const googleContactId = await syncWithGoogleContacts(contact);
        if (googleContactId) {
          await db.contact.update({
            where: { id: contact.id },
            data: { googleContactId }
          });
          contact.googleContactId = googleContactId;
        }
      } catch (googleError) {
        console.error('Failed to sync with Google Contacts:', googleError);
      }
    }

    return createSuccessResponse(contact, undefined, 201);

  } catch (error) {
    return handleApiError(error);
  }
});

async function syncWithGoogleContacts(contact: any): Promise<string | null> {
  try {
    // This is a simplified example - in production you'd need to:
    // 1. Get user's Google Contacts OAuth tokens
    // 2. Use Google People API to create/update contacts
    // 3. Handle proper contact resource representation

    const googleContactData = {
      names: [{
        givenName: contact.firstName,
        familyName: contact.lastName
      }],
      emailAddresses: contact.email ? [{
        value: contact.email,
        type: 'main'
      }] : [],
      phoneNumbers: contact.phone ? [{
        value: contact.phone,
        type: 'mobile'
      }] : [],
      organizations: contact.company ? [{
        name: contact.company,
        title: contact.jobTitle
      }] : [],
      biographies: contact.notes ? [{
        value: contact.notes,
        contentType: 'TEXT_PLAIN'
      }] : []
    };

    // For now, return a mock ID - in production this would be the actual Google Contact resource name
    return `google_contact_${Date.now()}`;
  } catch (error) {
    console.error('Google Contacts sync error:', error);
    return null;
  }
}