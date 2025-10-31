import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

function successResponse(data: any, status = 200) {
  return Response.json({ success: true, data }, { status });
}

function errorResponse(error: string, status = 500) {
  return Response.json({ success: false, error }, { status });
}

export async function GET(
  req: NextRequest,
  { params }: { params: { salesEntryId: string } }
) {
  try {
    const reps = await prisma.salesRepresentative.findMany({
      where: { salesEntryId: params.salesEntryId },
    });

    const totalStake = reps.reduce((sum, rep) => sum + Number(rep.salesStake), 0);
    const errors: string[] = [];

    if (totalStake !== 100 && reps.length > 0) {
      errors.push(`Total must equal 100%. Current: ${totalStake}%`);
    }

    return successResponse({
      isValid: errors.length === 0,
      errors,
      totalStake,
      missingStake: 100 - totalStake,
    });
  } catch (error) {
    console.error('Error validating stakes:', error);
    return errorResponse('Failed to validate', 500);
  }
}
