import { NextRequest, NextResponse } from 'next/server';
import { successResponse } from '@/lib/api/utils/response';
import { withQueryValidation } from '@/lib/api/middleware/validation';
import { withRateLimit } from '@/lib/api/middleware/rateLimit';
import { withRequestLogging } from '@/lib/api/middleware/requestLogging';
import { z } from 'zod';

const testSchema = z.object({
  test: z.string().optional(),
});

export const GET = withRequestLogging(
  withRateLimit()(
    withQueryValidation(testSchema)(
      async (req: NextRequest, context: { validated: any }) => {
        const validatedData = context.validated;
        console.log('Handler called with:', validatedData);
        return successResponse({ message: 'No auth test working', data: validatedData });
      }
    )
  )
);


