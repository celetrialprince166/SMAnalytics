import { NextRequest, NextResponse } from 'next/server';
import { successResponse } from '@/lib/api/utils/response';
import { withRequestLogging } from '@/lib/api/middleware/requestLogging';

export const GET = withRequestLogging(
  async (req: NextRequest, context: any) => {
    console.log('Simple handler called');
    return successResponse({ message: 'Simple test working' });
  }
);


