import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { withAuth } from '@/middleware/auth';
import { validateRequest } from '@/utils/validation';
import { createSuccessResponse, createUnauthorizedResponse, handleApiError } from '@/utils/api-response';
import { validationSchemas } from '@/validations';
import { generateAuthToken } from '@/middleware/auth';
import { HttpStatus } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { data, error } = await validateRequest(request, validationSchemas.login);

    if (error) {
      return error;
    }

    const { email, password } = data;

    // Find user in database
    const user = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        emailVerified: true,
        // Note: In a real app, you'd have a password field
        // This is a simplified example
      }
    });

    if (!user) {
      return createUnauthorizedResponse('Invalid credentials');
    }

    // Note: In a real implementation, you'd verify the password here
    // const isPasswordValid = await bcrypt.compare(password, user.password);
    // if (!isPasswordValid) {
    //   return createUnauthorizedResponse('Invalid credentials');
    // }

    // Generate JWT token
    const token = generateAuthToken(user);

    return createSuccessResponse({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        emailVerified: user.emailVerified
      },
      token
    }, undefined, HttpStatus.OK);

  } catch (error) {
    return handleApiError(error);
  }
}