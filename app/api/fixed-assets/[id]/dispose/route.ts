/**
 * Fixed Asset Disposal API Endpoint
 * 
 * Handles asset disposal with full accounting integration
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  errorResponse,
  validationErrorResponse
} from '@/lib/api/utils/response';

// No helper function needed - we'll generate numbers inline

// POST /api/fixed-assets/[id]/dispose - Record asset disposal
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json();
    const organizationId = '7224ab64-5bd7-4382-839d-6c415d872ba7';

    // Validate required fields
    if (!body.disposalDate || body.disposalValue === undefined || !body.bankAccountId) {
      return validationErrorResponse([{
        field: 'general',
        message: 'Disposal date, disposal value, and bank account are required',
        code: 'REQUIRED',
      }]);
    }

    // Get existing asset
    const asset = await prisma.fixedAsset.findUnique({
      where: { id },
    });

    if (!asset || asset.organizationId !== organizationId) {
      return errorResponse('Fixed asset not found', 404);
    }

    if (!asset.isActive || asset.status === 'DISPOSED') {
      return validationErrorResponse([{
        field: 'assetId',
        message: 'Asset is not active or already disposed',
        code: 'INVALID_STATUS',
      }]);
    }

    // Verify bank account exists
    const bankAccount = await prisma.holderAccount.findUnique({
      where: { id: body.bankAccountId },
    });

    if (!bankAccount || !bankAccount.isActive) {
      return validationErrorResponse([{
        field: 'bankAccountId',
        message: 'Bank account not found or inactive',
        code: 'NOT_FOUND',
      }]);
    }

    // Validate disposal date
    const disposalDate = new Date(body.disposalDate);
    const acquisitionDate = new Date(asset.acquisitionDate);
    if (disposalDate < acquisitionDate) {
      return validationErrorResponse([{
        field: 'disposalDate',
        message: 'Disposal date cannot be before acquisition date',
        code: 'INVALID_DATE',
      }]);
    }

    // Calculate gain/loss
    const disposalValue = Number(body.disposalValue);
    const netBookValue = Number(asset.netBookValue);
    const gainLoss = disposalValue - netBookValue;

    // Get account IDs for accounting entries
    const accumulatedDepreciationAccountId = '0bfaa2bc-971b-4caa-b4b8-d4f893aa0950'; // 01-01-005
    const gainOnDisposalAccountId = '784fa4d5-5a3b-433e-a391-cd2bffc8c32a'; // 01-01-006
    const lossOnDisposalAccountId = 'a8ae2991-e067-4ee3-96c1-164505ebcd60'; // 01-01-007

    // Generate transaction numbers upfront (outside the Prisma transaction)
    // Get ALL transactions for this organization to find the max base number
    const existingTransactions = await prisma.transaction.findMany({
      where: {
        organizationId,
      },
      select: {
        number: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 1000, // Limit to last 1000 transactions for performance
    });

    // Parse max base number from existing transactions
    let maxBase = 0;
    for (const transaction of existingTransactions) {
      try {
        const num = parseFloat(transaction.number);
        if (!isNaN(num) && isFinite(num)) {
          const base = Math.floor(num);
          maxBase = Math.max(maxBase, base);
        }
      } catch (error) {
        // Skip non-numeric transaction numbers
      }
    }

    // Generate 3 sequential transaction numbers for disposal
    const transactionNumber1 = `${maxBase + 1}.00`;
    const transactionNumber2 = `${maxBase + 2}.00`;
    const transactionNumber3 = `${maxBase + 3}.00`;

    // Perform disposal in a transaction with increased timeout
    const result = await prisma.$transaction(async (tx) => {
      const transactions = [];
      const balanceUpdates: Record<string, number> = {};

      // Helper to track balance changes
      const updateBalance = (accountId: string, amount: number) => {
        balanceUpdates[accountId] = (balanceUpdates[accountId] || 0) + amount;
      };

      // 1. Record cash received (DR: Bank, CR: Asset)
      if (disposalValue > 0 && asset.holderAccountId) {
        transactions.push(tx.transaction.create({
          data: {
            organizationId,
            date: disposalDate,
            number: transactionNumber1,
            description: `Cash received from disposal of ${asset.description}`,
            amount: disposalValue,
            debitAccountId: body.bankAccountId,
            creditAccountId: asset.holderAccountId,
            reconciled: false,
          },
        }));

        updateBalance(body.bankAccountId, disposalValue);
        updateBalance(asset.holderAccountId, -disposalValue);
      }

      // 2. Clear accumulated depreciation (DR: Acc Depr, CR: Asset)
      if (Number(asset.accumulatedDepreciation) > 0 && asset.holderAccountId) {
        const accDeprAmount = Number(asset.accumulatedDepreciation);

        transactions.push(tx.transaction.create({
          data: {
            organizationId,
            date: disposalDate,
            number: transactionNumber2,
            description: `Clear accumulated depreciation for ${asset.description}`,
            amount: accDeprAmount,
            debitAccountId: accumulatedDepreciationAccountId,
            creditAccountId: asset.holderAccountId,
            reconciled: false,
          },
        }));

        updateBalance(accumulatedDepreciationAccountId, accDeprAmount);
        updateBalance(asset.holderAccountId, -accDeprAmount);
      }

      // 3. Record gain or loss on disposal
      if (gainLoss !== 0 && asset.holderAccountId) {
        const absGainLoss = Math.abs(gainLoss);

        if (gainLoss > 0) {
          // Gain: DR: Asset, CR: Gain on Disposal
          transactions.push(tx.transaction.create({
            data: {
              organizationId,
              date: disposalDate,
              number: transactionNumber3,
              description: `Gain on disposal of ${asset.description}`,
              amount: absGainLoss,
              debitAccountId: asset.holderAccountId,
              creditAccountId: gainOnDisposalAccountId,
              reconciled: false,
            },
          }));

          updateBalance(asset.holderAccountId, absGainLoss);
          updateBalance(gainOnDisposalAccountId, absGainLoss);
        } else {
          // Loss: DR: Loss on Disposal, CR: Asset
          transactions.push(tx.transaction.create({
            data: {
              organizationId,
              date: disposalDate,
              number: transactionNumber3,
              description: `Loss on disposal of ${asset.description}`,
              amount: absGainLoss,
              debitAccountId: lossOnDisposalAccountId,
              creditAccountId: asset.holderAccountId,
              reconciled: false,
            },
          }));

          updateBalance(lossOnDisposalAccountId, absGainLoss);
          updateBalance(asset.holderAccountId, -absGainLoss);
        }
      }

      // Execute all transaction creates in parallel
      await Promise.all(transactions);

      // Update all account balances in parallel
      const balanceUpdatePromises = Object.entries(balanceUpdates).map(([accountId, amount]) =>
        tx.holderAccount.update({
          where: { id: accountId },
          data: { balance: { increment: amount } },
        })
      );
      await Promise.all(balanceUpdatePromises);

      // Update asset status
      const updatedAsset = await tx.fixedAsset.update({
        where: { id },
        data: {
          status: 'DISPOSED',
          isActive: false,
        },
      });

      return {
        asset: updatedAsset,
        disposalValue,
        netBookValue,
        gainLoss,
        disposalDate,
        bankAccountId: body.bankAccountId,
        remarks: body.remarks || null,
        transactionsCreated: 3,
      };
    }, {
      maxWait: 10000, // 10 seconds
      timeout: 20000, // 20 seconds
    });

    return successResponse(result, 201);
  } catch (error: any) {
    console.error('Error recording asset disposal:', error);
    return errorResponse('Failed to record asset disposal: ' + error.message, 500);
  }
}
