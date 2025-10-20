import { ZodSchema, ZodError } from 'zod';
import { NextRequest } from 'next/server';
import { createValidationError } from './api-response';

export async function validateRequest<T>(
  request: NextRequest,
  schema: ZodSchema<T>,
  source: 'body' | 'query' | 'params' = 'body'
): Promise<{ data: T; error?: Response }> {
  try {
    let rawData: unknown;

    switch (source) {
      case 'body':
        rawData = await request.json().catch(() => null);
        if (rawData === null) {
          return {
            data: {} as T,
            error: createValidationError('Invalid JSON in request body')
          };
        }
        break;

      case 'query':
        const { searchParams } = new URL(request.url);
        const queryObject: Record<string, string> = {};
        searchParams.forEach((value, key) => {
          queryObject[key] = value;
        });
        rawData = queryObject;
        break;

      case 'params':
        // For route params, we'll extract from the URL pattern
        // This is typically handled at the route level
        rawData = {};
        break;

      default:
        return {
          data: {} as T,
          error: createValidationError('Invalid validation source')
        };
    }

    const validatedData = await schema.parseAsync(rawData);
    return { data: validatedData };
  } catch (error) {
    if (error instanceof ZodError) {
      const validationErrors: Record<string, string[]> = {};
      error.issues.forEach(issue => {
        const path = issue.path.join('.');
        if (!validationErrors[path]) {
          validationErrors[path] = [];
        }
        validationErrors[path].push(issue.message);
      });

      return {
        data: {} as T,
        error: createValidationError(validationErrors)
      };
    }

    return {
      data: {} as T,
      error: createValidationError('Validation failed')
    };
  }
}

export function validateQueryParams<T>(
  searchParams: URLSearchParams,
  schema: ZodSchema<T>
): { data: T; error?: Response } {
  try {
    const queryObject: Record<string, string | string[]> = {};

    searchParams.forEach((value, key) => {
      // Handle array parameters (those ending with '[]')
      if (key.endsWith('[]')) {
        const arrayKey = key.slice(0, -2);
        if (!queryObject[arrayKey]) {
          queryObject[arrayKey] = [];
        }
        (queryObject[arrayKey] as string[]).push(value);
      } else {
        queryObject[key] = value;
      }
    });

    const validatedData = schema.parse(queryObject);
    return { data: validatedData };
  } catch (error) {
    if (error instanceof ZodError) {
      const validationErrors: Record<string, string[]> = {};
      error.issues.forEach(issue => {
        const path = issue.path.join('.');
        if (!validationErrors[path]) {
          validationErrors[path] = [];
        }
        validationErrors[path].push(issue.message);
      });

      return {
        data: {} as T,
        error: createValidationError(validationErrors)
      };
    }

    return {
      data: {} as T,
      error: createValidationError('Query parameter validation failed')
    };
  }
}

export function extractRouteParams(request: NextRequest, pattern: string): Record<string, string> {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const patternParts = pattern.split('/').filter(part => part && !part.startsWith('['));
  const pathParts = pathname.split('/').filter(part => part);

  const params: Record<string, string> = {};

  patternParts.forEach((part, index) => {
    if (part.startsWith('[') && part.endsWith(']')) {
      const paramName = part.slice(1, -1);
      if (pathParts[index]) {
        params[paramName] = decodeURIComponent(pathParts[index]);
      }
    }
  });

  return params;
}

export function sanitizeInput(input: unknown): unknown {
  if (typeof input === 'string') {
    // Basic XSS prevention
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }

  if (input && typeof input === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }

  return input;
}

export function validateId(id: string): boolean {
  // Basic validation for cuid format
  return /^[a-z0-9][a-z0-9-_]{24}$/.test(id);
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePhone(phone: string): boolean {
  // Basic international phone number validation
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
}

export function validateDate(date: string | Date): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj instanceof Date && !isNaN(dateObj.getTime());
}

export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Validation middleware factory
export function withValidation<T>(
  schema: ZodSchema<T>,
  source: 'body' | 'query' = 'body'
) {
  return async (
    request: NextRequest,
    handler: (req: NextRequest, data: T) => Promise<Response>
  ): Promise<Response> => {
    const { data, error } = await validateRequest(request, schema, source);

    if (error) {
      return error;
    }

    return handler(request, data);
  };
}