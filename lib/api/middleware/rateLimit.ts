/**
 * Rate Limiting Middleware
 * 
 * Prevents abuse by limiting the number of requests per IP
 */

import { NextRequest, NextResponse } from 'next/server';
import { errorResponse } from '../utils/response';

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

interface RateLimitOptions {
  maxRequests?: number; // Max requests per window
  windowMs?: number; // Time window in milliseconds
}

/**
 * Middleware to apply rate limiting
 */
export function withRateLimit(
  options: RateLimitOptions = {}
) {
  const maxRequests = options.maxRequests || 100;
  const windowMs = options.windowMs || 60 * 1000; // 1 minute default

  return (handler: Function) => {
    return async (req: NextRequest, context: any = {}) => {
      try {
        // Get client IP
        const ip = req.headers.get('x-forwarded-for') || 
                   req.headers.get('x-real-ip') || 
                   'unknown';

        const now = Date.now();
        const key = `${ip}:${req.nextUrl.pathname}`;

        // Get or create rate limit entry
        let limitData = rateLimitMap.get(key);

        if (!limitData || now > limitData.resetAt) {
          // Reset window
          limitData = {
            count: 0,
            resetAt: now + windowMs,
          };
          rateLimitMap.set(key, limitData);
        }

        // Increment request count
        limitData.count++;

        // Check if limit exceeded
        if (limitData.count > maxRequests) {
          const resetIn = Math.ceil((limitData.resetAt - now) / 1000);
          return errorResponse(
            `Rate limit exceeded. Try again in ${resetIn} seconds.`,
            429,
            'RATE_LIMIT_EXCEEDED',
            { retryAfter: resetIn }
          );
        }

        // Call handler
        return handler(req, context);
      } catch (error: any) {
        console.error('Rate limit error:', error);
        // Don't block requests if rate limiting fails
        return handler(req, context);
      }
    };
  };
}

/**
 * Cleanup old entries periodically
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of rateLimitMap.entries()) {
    if (now > data.resetAt) {
      rateLimitMap.delete(key);
    }
  }
}, 60 * 1000); // Cleanup every minute



