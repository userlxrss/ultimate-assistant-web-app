import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from '@/lib/db';
import { AuthUser, ApiResponse, HttpStatus, ErrorCodes } from '@/types';

interface JWTPayload {
  userId: string;
  email: string;
  name?: string;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends NextRequest {
  user?: AuthUser;
}

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
const RATE_LIMIT_WINDOW = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'); // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100');

// In-memory rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export async function authenticate(request: NextRequest): Promise<{ user?: AuthUser; error?: ApiResponse }> {
  try {
    // Extract token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        error: {
          success: false,
          error: {
            code: ErrorCodes.UNAUTHORIZED,
            message: 'Missing or invalid authorization header'
          }
        }
      };
    }

    const token = authHeader.substring(7);

    // Verify JWT token
    let decoded: JWTPayload;
    try {
      decoded = jwt.verify(token, JWT_SECRET!) as JWTPayload;
    } catch (jwtError) {
      return {
        error: {
          success: false,
          error: {
            code: ErrorCodes.INVALID_TOKEN,
            message: 'Invalid or expired token'
          }
        }
      };
    }

    // Get user from database
    const user = await db.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        emailVerified: true
      }
    });

    if (!user) {
      return {
        error: {
          success: false,
          error: {
            code: ErrorCodes.UNAUTHORIZED,
            message: 'User not found'
          }
        }
      };
    }

    return { user };
  } catch (error) {
    console.error('Authentication error:', error);
    return {
      error: {
        success: false,
        error: {
          code: ErrorCodes.INTERNAL_ERROR,
          message: 'Authentication failed'
        }
      }
    };
  }
}

export async function rateLimit(clientId: string): Promise<{ allowed: boolean; resetTime?: number }> {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;

  // Clean up old entries
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }

  const clientData = rateLimitStore.get(clientId);

  if (!clientData || clientData.resetTime < now) {
    // First request or window reset
    rateLimitStore.set(clientId, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    });
    return { allowed: true };
  }

  if (clientData.count >= RATE_LIMIT_MAX_REQUESTS) {
    return {
      allowed: false,
      resetTime: clientData.resetTime
    };
  }

  clientData.count++;
  return { allowed: true };
}

export function getClientId(request: NextRequest): string {
  // Try to get user ID from token first, fallback to IP
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      const decoded = jwt.decode(token) as JWTPayload;
      if (decoded?.userId) {
        return `user:${decoded.userId}`;
      }
    } catch {
      // Fall through to IP-based limiting
    }
  }

  // Use IP as fallback
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : request.ip || 'unknown';
  return `ip:${ip}`;
}

export async function withAuth(
  handler: (req: NextRequest, context: { user: AuthUser }) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Rate limiting
    const clientId = getClientId(request);
    const rateLimitResult = await rateLimit(clientId);

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCodes.RATE_LIMIT_EXCEEDED,
            message: 'Rate limit exceeded',
            details: {
              resetTime: rateLimitResult.resetTime
            }
          }
        },
        {
          status: HttpStatus.TOO_MANY_REQUESTS,
          headers: {
            'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.resetTime?.toString() || ''
          }
        }
      );
    }

    // Authentication
    const authResult = await authenticate(request);

    if (authResult.error) {
      return NextResponse.json(authResult.error, {
        status: authResult.error.error?.code === ErrorCodes.INVALID_TOKEN ?
          HttpStatus.UNAUTHORIZED : HttpStatus.FORBIDDEN
      });
    }

    if (!authResult.user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCodes.UNAUTHORIZED,
            message: 'Authentication failed'
          }
        },
        { status: HttpStatus.UNAUTHORIZED }
      );
    }

    // Add rate limit headers
    const response = await handler(request, { user: authResult.user });

    const remaining = RATE_LIMIT_MAX_REQUESTS -
      (rateLimitStore.get(clientId)?.count || RATE_LIMIT_MAX_REQUESTS);

    response.headers.set('X-RateLimit-Limit', RATE_LIMIT_MAX_REQUESTS.toString());
    response.headers.set('X-RateLimit-Remaining', Math.max(0, remaining).toString());
    response.headers.set('X-RateLimit-Reset', rateLimitStore.get(clientId)?.resetTime?.toString() || '');

    return response;
  };
}

export function generateAuthToken(user: { id: string; email: string; name?: string }): string {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      name: user.name
    },
    JWT_SECRET!,
    { expiresIn: '7d' }
  );
}

export function verifyAuthToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET!) as JWTPayload;
  } catch {
    return null;
  }
}