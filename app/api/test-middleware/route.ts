import { NextRequest, NextResponse } from 'next/server';
import { successResponse } from '@/lib/api/utils/response';
import { withAuth } from '@/lib/api/middleware/auth';
import { withQueryValidation } from '@/lib/api/middleware/validation';
import { withRateLimit } from '@/lib/api/middleware/rateLimit';
import { withRequestLogging } from '@/lib/api/middleware/requestLogging';
import { z } from 'zod';

const testSchema = z.object({
  test: z.string().optional(),
});

export const GET = withRequestLogging(
  withRateLimit()(
    withAuth(
      withQueryValidation(testSchema)(
        async (req: NextRequest, context: { validated: any }) => {
          const validatedData = context.validated;
          console.log('Handler called with:', validatedData);
          return successResponse({ message: 'Middleware test working', data: validatedData });
        }
      )
    )
  )
);


