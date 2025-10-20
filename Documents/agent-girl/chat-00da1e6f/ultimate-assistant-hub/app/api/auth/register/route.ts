import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { validateRequest } from '@/utils/validation';
import { createSuccessResponse, createConflictResponse, handleApiError } from '@/utils/api-response';
import { validationSchemas } from '@/validations';
import { generateAuthToken } from '@/middleware/auth';
import { HttpStatus, ErrorCodes } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { data, error } = await validateRequest(request, validationSchemas.register);

    if (error) {
      return error;
    }

    const { email, name, password } = data;

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return createConflictResponse('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user (Note: This is a simplified example)
    // In a real implementation, you'd store the hashed password
    const user = await db.user.create({
      data: {
        email,
        name,
        // password: hashedPassword, // You'd add this field to your schema
        emailVerified: new Date() // Auto-verify for this example
      },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        emailVerified: true
      }
    });

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
    }, undefined, HttpStatus.CREATED);

  } catch (error) {
    return handleApiError(error);
  }
}