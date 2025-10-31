/**
 * Request Logging Middleware
 * 
 * Logs API requests for debugging and monitoring
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware to log API requests
 */
export function withRequestLogging(handler: Function) {
  return async (req: NextRequest, context: any = {}) => {
    const startTime = Date.now();
    const { method, url, headers } = req;

    // Log request
    console.log(`[API] ${method} ${url}`);

    try {
      // Call handler
      const response = await handler(req, context);

      // Log response
      const duration = Date.now() - startTime;
      console.log(
        `[API] ${method} ${url} - ${response.status} (${duration}ms)`
      );

      return response;
    } catch (error: any) {
      // Log error
      const duration = Date.now() - startTime;
      console.error(
        `[API] ${method} ${url} - ERROR (${duration}ms)`,
        error
      );
      throw error;
    }
  };
}

/**
 * Simple request logger without middleware wrapping
 */
export function logRequest(req: NextRequest, message?: string) {
  const { method, url } = req;
  console.log(`[API] ${method} ${url}${message ? ` - ${message}` : ''}`);
}

/**
 * Log API errors
 */
export function logError(req: NextRequest, error: any) {
  const { method, url } = req;
  console.error(`[API ERROR] ${method} ${url}`, {
    message: error.message,
    stack: error.stack,
  });
}



