import { NextRequest } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { db } from '@/lib/db';
import { createSuccessResponse, handleApiError } from '@/utils/api-response';
import { generateAuthToken } from '@/middleware/auth';
import { HttpStatus } from '@/types';

export const POST = withAuth(async (request: NextRequest, { user }) => {
  try {
    // Get fresh user data
    const freshUser = await db.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        emailVerified: true
      }
    });

    if (!freshUser) {
      throw new Error('User not found');
    }

    // Generate new token
    const token = generateAuthToken(freshUser);

    return createSuccessResponse({
      user: freshUser,
      token
    });

  } catch (error) {
    return handleApiError(error);
  }
});