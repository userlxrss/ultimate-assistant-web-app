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
      return createNotFoundResponse('Contact');
    }

    const contact = await db.contact.findFirst({
      where: {
        id,
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

    if (!contact) {
      return createNotFoundResponse('Contact');
    }

    return createSuccessResponse(contact);

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
      return createNotFoundResponse('Contact');
    }

    const { data, error } = await validateRequest(request, validationSchemas.updateContact);

    if (error) {
      return error;
    }

    // Check if contact exists and belongs to user
    const existingContact = await db.contact.findFirst({
      where: { id, userId: user.id }
    });

    if (!existingContact) {
      return createNotFoundResponse('Contact');
    }

    const updatedContact = await db.contact.update({
      where: { id },
      data,
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

    // Sync with Google Contacts if there's a googleContactId
    if (updatedContact.googleContactId && process.env.GOOGLE_CONTACTS_API_KEY) {
      try {
        await updateGoogleContact(updatedContact);
      } catch (googleError) {
        console.error('Failed to update Google Contact:', googleError);
      }
    }

    return createSuccessResponse(updatedContact);

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
      return createNotFoundResponse('Contact');
    }

    // Check if contact exists and belongs to user
    const existingContact = await db.contact.findFirst({
      where: { id, userId: user.id },
      select: { googleContactId: true }
    });

    if (!existingContact) {
      return createNotFoundResponse('Contact');
    }

    // Delete from Google Contacts if there's a googleContactId
    if (existingContact.googleContactId && process.env.GOOGLE_CONTACTS_API_KEY) {
      try {
        await deleteGoogleContact(existingContact.googleContactId);
      } catch (googleError) {
        console.error('Failed to delete from Google Contacts:', googleError);
      }
    }

    await db.contact.delete({
      where: { id }
    });

    return createSuccessResponse({ deleted: true });

  } catch (error) {
    return handleApiError(error);
  }
});

async function updateGoogleContact(contact: any): Promise<void> {
  try {
    // This is a simplified example - in production you'd:
    // 1. Get user's Google Contacts OAuth tokens
    // 2. Use Google People API to update the contact
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

    console.log('Would update Google Contact:', googleContactData);
  } catch (error) {
    console.error('Google Contact update error:', error);
    throw error;
  }
}

async function deleteGoogleContact(googleContactId: string): Promise<void> {
  try {
    // This is a simplified example - in production you'd:
    // 1. Get user's Google Contacts OAuth tokens
    // 2. Use Google People API to delete the contact

    console.log('Would delete Google Contact:', googleContactId);
  } catch (error) {
    console.error('Google Contact delete error:', error);
    throw error;
  }
}