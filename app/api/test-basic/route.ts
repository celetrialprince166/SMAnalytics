import { NextRequest, NextResponse } from 'next/server';
import { successResponse } from '@/lib/api/utils/response';

export async function GET(req: NextRequest) {
  console.log('Basic handler called');
  return successResponse({ message: 'Basic test working' });
}


