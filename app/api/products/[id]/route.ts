/**
 * Product by ID API Endpoints
 * 
 * Handles individual product operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { updateProductSchema, UpdateProductInput } from '@/lib/validation/schemas';
import { 
  successResponse, 
  errorResponse, 
  validationErrorResponse,
  notFoundResponse 
} from '@/lib/api/utils/response';
import { withAuth } from '@/lib/api/middleware/auth';
import { withValidation } from '@/lib/api/middleware/validation';
import { withRateLimit } from '@/lib/api/middleware/rateLimit';
import { withRequestLogging } from '@/lib/api/middleware/requestLogging';

// GET /api/products/[id] - Get product by ID
export const GET = withRequestLogging(
  withRateLimit()(
    withAuth(
      async (req: NextRequest, context: { params?: { id: string } }) => {
        try {
          const { id } = context.params || { id: '' };

          const product = await prisma.product.findUnique({
            where: { id },
            include: {
              salesEntries: {
                select: {
                  id: true,
                  date: true,
                  salesValue: true,
                  totalWithVat: true,
                },
              },
            },
          });

          if (!product) {
            return notFoundResponse('Product not found');
          }

          return successResponse(product);
        } catch (error) {
          console.error('Error fetching product:', error);
          return errorResponse('Failed to fetch product', 500);
        }
      }
    )
  )
);

// PUT /api/products/[id] - Update product
export const PUT = withRequestLogging(
  withRateLimit()(
    withAuth(
      withValidation(updateProductSchema)(
        async (req: NextRequest, context: { params?: { id: string }; validated: UpdateProductInput }) => {
          try {
            const { id } = context.params || { id: '' };
            const validatedData = context.validated;

            // Check if product exists
            const existingProduct = await prisma.product.findUnique({
              where: { id },
            });

            if (!existingProduct) {
              return notFoundResponse('Product not found');
            }

            // Check if code already exists for this organization (if code is being updated)
            if (validatedData.sku && validatedData.sku !== existingProduct.code) {
              const duplicateProduct = await prisma.product.findFirst({
                where: {
                  code: validatedData.sku,
                  organizationId: existingProduct.organizationId,
                  id: { not: id },
                },
              });

              if (duplicateProduct) {
                return validationErrorResponse([{
                  field: 'sku',
                  message: 'Product code already exists',
                  code: 'DUPLICATE',
                }]);
              }
            }

            // Update product
            // Map sku to code if provided
            const updateData: any = { ...validatedData };
            if (updateData.sku !== undefined) {
              updateData.code = updateData.sku;
              delete updateData.sku;
            }
            // Map unitCost to costPrice if provided
            if (updateData.unitCost !== undefined) {
              updateData.costPrice = updateData.unitCost;
              delete updateData.unitCost;
            }
            
            const updatedProduct = await prisma.product.update({
              where: { id },
              data: updateData,
              include: {
                salesEntries: {
                  select: {
                    id: true,
                    date: true,
                    salesValue: true,
                    totalWithVat: true,
                  },
                },
              },
            });

            return successResponse(updatedProduct);
          } catch (error) {
            console.error('Error updating product:', error);
            return errorResponse('Failed to update product', 500);
          }
        }
      )
    )
  )
);

// DELETE /api/products/[id] - Delete product
export const DELETE = withRequestLogging(
  withRateLimit()(
    withAuth(
      async (req: NextRequest, context: { params?: { id: string } }) => {
        try {
          const { id } = context.params || { id: '' };

          // Check if product exists
          const existingProduct = await prisma.product.findUnique({
            where: { id },
            include: {
              salesEntries: {
                select: { id: true },
              },
            },
          });

          if (!existingProduct) {
            return notFoundResponse('Product not found');
          }

          // Check if product has sales entries
          if (existingProduct.salesEntries.length > 0) {
            return validationErrorResponse([{
              field: 'id',
              message: 'Cannot delete product with existing sales entries',
              code: 'HAS_DEPENDENCIES',
            }]);
          }

          // Delete product
          await prisma.product.delete({
            where: { id },
          });

          return successResponse({ message: 'Product deleted successfully' });
        } catch (error) {
          console.error('Error deleting product:', error);
          return errorResponse('Failed to delete product', 500);
        }
      }
    )
  )
);















