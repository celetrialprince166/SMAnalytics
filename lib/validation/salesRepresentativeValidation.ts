import { z } from 'zod';

export const createSalesRepresentativeSchema = z.object({
  salesEntryId: z.string().uuid('Invalid sales entry ID'),
  employeeId: z.string().uuid('Invalid employee ID'),
  resourceType: z.enum(['SALES', 'SUPPORT'], {
    errorMap: () => ({ message: 'Resource type must be SALES or SUPPORT' }),
  }),
  salesStake: z.number()
    .min(0, 'Sales stake must be at least 0%')
    .max(100, 'Sales stake cannot exceed 100%'),
  salesTarget: z.number()
    .min(0, 'Sales target must be positive'),
  commissionRate: z.number()
    .min(0, 'Commission rate must be at least 0%')
    .max(100, 'Commission rate cannot exceed 100%'),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export const updateSalesRepresentativeSchema = z.object({
  resourceType: z.enum(['SALES', 'SUPPORT']).optional(),
  salesStake: z.number().min(0).max(100).optional(),
  salesTarget: z.number().min(0).optional(),
  commissionRate: z.number().min(0).max(100).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export type CreateSalesRepresentativeInput = z.infer<typeof createSalesRepresentativeSchema>;
export type UpdateSalesRepresentativeInput = z.infer<typeof updateSalesRepresentativeSchema>;

// Business rule validations
export const businessRulesSchema = z.object({
  representatives: z.array(createSalesRepresentativeSchema)
    .refine(
      (reps) => {
        const totalStake = reps.reduce((sum, rep) => sum + rep.salesStake, 0);
        return Math.abs(totalStake - 100) < 0.01; // Allow for floating point precision
      },
      { message: 'Total sales stakes must equal 100%' }
    )
    .refine(
      (reps) => {
        const employeeIds = reps.map(rep => rep.employeeId);
        return new Set(employeeIds).size === employeeIds.length;
      },
      { message: 'Each employee can only be assigned once per sales entry' }
    ),
});

// Commission rate limits by resource type
export const getCommissionRateLimits = (resourceType: 'SALES' | 'SUPPORT') => {
  switch (resourceType) {
    case 'SALES':
      return { min: 1, max: 15, default: 5 };
    case 'SUPPORT':
      return { min: 0.5, max: 8, default: 2 };
    default:
      return { min: 0, max: 100, default: 5 };
  }
};
