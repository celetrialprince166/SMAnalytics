/**
 * Validation Middleware
 * 
 * Handles request validation using Zod schemas
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { validationErrorResponse } from '../utils/response';

export type ValidatedHandler<T = any> = (
  req: NextRequest,
  context: { params?: any; validated: T; [key: string]: any }
) => Promise<NextResponse>;

/**
 * Middleware to validate request body
 */
export function withValidation<T extends z.ZodType>(schema: T) {
  return (handler: ValidatedHandler<z.infer<T>>) => {
    return async (req: NextRequest, context: any = {}) => {
      try {
        // Parse request body
        const body = await req.json().catch(() => ({}));

        // Validate against schema
        const result = schema.safeParse(body);

        if (!result.success) {
          return validationErrorResponse(result.error.format());
        }

        // Call handler with validated data
        return handler(req, {
          ...context,
          validated: result.data,
        });
      } catch (error: any) {
        console.error('Validation error:', error);
        return validationErrorResponse({
          _errors: ['Invalid request format'],
        });
      }
    };
  };
}

/**
 * Middleware to validate query parameters
 */
export function withQueryValidation<T extends z.ZodType>(schema: T) {
  return (handler: ValidatedHandler<z.infer<T>>) => {
    return async (req: NextRequest, context: any = {}) => {
      try {
        // Get query parameters
        const { searchParams } = new URL(req.url);
        const query: Record<string, any> = {};

        searchParams.forEach((value, key) => {
          // Try to parse numbers
          if (!isNaN(Number(value))) {
            query[key] = Number(value);
          } else if (value === 'true') {
            query[key] = true;
          } else if (value === 'false') {
            query[key] = false;
          } else {
            query[key] = value;
          }
        });

        // Validate against schema
        const result = schema.safeParse(query);

        if (!result.success) {
          return validationErrorResponse(result.error.format());
        }

        // Call handler with validated data
        return handler(req, {
          ...context,
          validated: result.data,
        });
      } catch (error: any) {
        console.error('Query validation error:', error);
        return validationErrorResponse({
          _errors: ['Invalid query parameters'],
        });
      }
    };
  };
}



