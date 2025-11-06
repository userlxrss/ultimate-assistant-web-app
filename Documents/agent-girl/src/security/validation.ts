import { z } from 'zod';
import Joi from 'joi';

// Secure URL validation using Zod (replaces vulnerable validator)
export const secureUrlSchema = z.string().url().refine(
  (url) => {
    try {
      const parsed = new URL(url);
      // Only allow http and https protocols
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  },
  {
    message: 'Invalid URL or unsupported protocol'
  }
);

// Email validation schema
export const emailSchema = z.string().email().max(254);

// Secure string validation for usernames, IDs, etc.
export const secureStringSchema = z.string()
  .min(1)
  .max(100)
  .regex(/^[a-zA-Z0-9_-]+$/, 'Only alphanumeric characters, underscores, and hyphens allowed');

// Sanitize HTML input (XSS prevention)
export const sanitizeHtml = (input: string): string => {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

// Joi schemas for Express middleware
export const JoiSchemas = {
  email: Joi.string().email().max(254),
  secureUrl: Joi.string().uri({
    scheme: ['http', 'https']
  }),
  secureString: Joi.string()
    .min(1)
    .max(100)
    .pattern(/^[a-zA-Z0-9_-]+$/),
  
  // Task validation
  task: Joi.object({
    title: Joi.string().min(1).max(200).required(),
    description: Joi.string().max(1000).optional(),
    priority: Joi.string().valid('low', 'medium', 'high').optional(),
    dueDate: Joi.date().optional(),
    status: Joi.string().valid('pending', 'in-progress', 'completed').optional()
  }),
  
  // Event validation
  event: Joi.object({
    title: Joi.string().min(1).max(200).required(),
    description: Joi.string().max(1000).optional(),
    startTime: Joi.date().required(),
    endTime: Joi.date().greater(Joi.ref('startTime')).required(),
    location: Joi.string().max(500).optional(),
    attendees: Joi.array().items(Joi.string().email()).optional()
  }),
  
  // Contact validation
  contact: Joi.object({
    name: Joi.string().min(1).max(100).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().pattern(/^[+]?[\d\s\-()]+$/).optional(),
    company: Joi.string().max(100).optional(),
    notes: Joi.string().max(1000).optional()
  })
};

// Express middleware for validation
export const validateJoi = (schema: Joi.ObjectSchema) => {
  return (req: any, res: any, next: any) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }
    next();
  };
};

// CSRF Protection configuration (replaces vulnerable csurf)
export const csrfConfig = {
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const
  },
  ignoreMethods: ['GET', 'HEAD', 'OPTIONS']
};
