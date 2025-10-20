import { NextResponse } from 'next/server';
import { ApiResponse, PaginationMeta, HttpStatus, ErrorCodes } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export class ApiError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: any;

  constructor(code: string, message: string, statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export const createSuccessResponse = <T>(
  data: T,
  pagination?: PaginationMeta,
  statusCode: number = HttpStatus.OK
): NextResponse<ApiResponse<T>> => {
  const response: ApiResponse<T> = {
    success: true,
    data,
    meta: {
      pagination,
      timestamp: new Date().toISOString(),
      requestId: uuidv4()
    }
  };

  return NextResponse.json(response, { status: statusCode });
};

export const createErrorResponse = (
  code: string,
  message: string,
  statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR,
  details?: any
): NextResponse<ApiResponse> => {
  const response: ApiResponse = {
    success: false,
    error: {
      code,
      message,
      details
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: uuidv4()
    }
  };

  return NextResponse.json(response, { status: statusCode });
};

export const createValidationError = (
  errors: Record<string, string[]> | string
): NextResponse<ApiResponse> => {
  const details = typeof errors === 'string' ? { general: [errors] } : { validation: errors };

  return createErrorResponse(
    ErrorCodes.VALIDATION_ERROR,
    'Validation failed',
    HttpStatus.BAD_REQUEST,
    details
  );
};

export const createNotFoundResponse = (
  resource: string = 'Resource'
): NextResponse<ApiResponse> => {
  return createErrorResponse(
    ErrorCodes.NOT_FOUND,
    `${resource} not found`,
    HttpStatus.NOT_FOUND
  );
};

export const createUnauthorizedResponse = (
  message: string = 'Unauthorized access'
): NextResponse<ApiResponse> => {
  return createErrorResponse(
    ErrorCodes.UNAUTHORIZED,
    message,
    HttpStatus.UNAUTHORIZED
  );
};

export const createForbiddenResponse = (
  message: string = 'Access forbidden'
): NextResponse<ApiResponse> => {
  return createErrorResponse(
    ErrorCodes.FORBIDDEN,
    message,
    HttpStatus.FORBIDDEN
  );
};

export const createConflictResponse = (
  message: string = 'Resource conflict'
): NextResponse<ApiResponse> => {
  return createErrorResponse(
    ErrorCodes.CONFLICT,
    message,
    HttpStatus.CONFLICT
  );
};

export const createRateLimitResponse = (
  resetTime?: number
): NextResponse<ApiResponse> => {
  return createErrorResponse(
    ErrorCodes.RATE_LIMIT_EXCEEDED,
    'Rate limit exceeded. Please try again later.',
    HttpStatus.TOO_MANY_REQUESTS,
    { resetTime }
  );
};

export const createInternalServerErrorResponse = (
  error?: Error | unknown
): NextResponse<ApiResponse> => {
  console.error('Internal server error:', error);

  const details = process.env.NODE_ENV === 'development' && error instanceof Error
    ? {
        message: error.message,
        stack: error.stack
      }
    : undefined;

  return createErrorResponse(
    ErrorCodes.INTERNAL_ERROR,
    'An internal server error occurred',
    HttpStatus.INTERNAL_SERVER_ERROR,
    details
  );
};

export const handleApiError = (error: unknown): NextResponse<ApiResponse> => {
  if (error instanceof ApiError) {
    return createErrorResponse(error.code, error.message, error.statusCode, error.details);
  }

  // Handle Prisma errors
  if (error && typeof error === 'object' && 'code' in error) {
    const prismaError = error as { code: string; message: string };

    switch (prismaError.code) {
      case 'P2002':
        return createConflictResponse('Resource already exists');
      case 'P2025':
        return createNotFoundResponse('Resource');
      case 'P2003':
        return createErrorResponse(
          ErrorCodes.VALIDATION_ERROR,
          'Foreign key constraint violation',
          HttpStatus.BAD_REQUEST
        );
      default:
        return createInternalServerErrorResponse(error);
    }
  }

  // Handle validation errors (Zod)
  if (error && typeof error === 'object' && 'issues' in error) {
    const zodError = error as { issues: Array<{ path: string[]; message: string }> };
    const validationErrors: Record<string, string[]> = {};

    zodError.issues.forEach(issue => {
      const path = issue.path.join('.');
      if (!validationErrors[path]) {
        validationErrors[path] = [];
      }
      validationErrors[path].push(issue.message);
    });

    return createValidationError(validationErrors);
  }

  // Generic error
  return createInternalServerErrorResponse(error);
};

export const createPaginationMeta = (
  page: number,
  limit: number,
  total: number
): PaginationMeta => {
  const totalPages = Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1
  };
};

// Response helper for common operations
export const responseHelpers = {
  success: createSuccessResponse,
  error: createErrorResponse,
  validationError: createValidationError,
  notFound: createNotFoundResponse,
  unauthorized: createUnauthorizedResponse,
  forbidden: createForbiddenResponse,
  conflict: createConflictResponse,
  rateLimit: createRateLimitResponse,
  internalError: createInternalServerErrorResponse,
  handle: handleApiError,
  pagination: createPaginationMeta
} as const;