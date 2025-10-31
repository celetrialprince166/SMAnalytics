/**
 * Sales Service
 * 
 * Business logic for sales transaction management with automatic accounting
 */

import {
  SalesEntry,
  CreateSalesEntryRequest,
  UpdateSalesEntryRequest,
  SalesFilters,
  SalesSummary,
} from '@/types';
import {
  salesEntryRepository,
  productRepository,
  transactionRepository,
  holderAccountRepository,
  inventoryMovementRepository,
} from '../repositories';

export class SalesService {
  private static instance: SalesService;

  private constructor() {}

  public static getInstance(): SalesService {
    if (!SalesService.instance) {
      SalesService.instance = new SalesService();
    }
    return SalesService.instance;
  }

  /**
   * Create a new sales entry with automatic transaction generation
   */
  async createSalesEntry(request: CreateSalesEntryRequest): Promise<SalesEntry> {
    // Validate sales data
    const validation = await this.validateSalesEntry(request);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    // Get product
    const product = await productRepository.findById(request.productId);
    if (!product) {
      throw new Error('Product not found');
    }

    // Validate customer account exists
    const customerAccount = await holderAccountRepository.findById(request.customerAccountId);
    if (!customerAccount) {
      throw new Error('Customer account not found');
    }

    // Calculate VAT if applicable
    let vatAmount = 0;
    let totalWithVat = request.salesValue;
    if (request.applyVat && request.vatRate) {
      vatAmount = (request.salesValue * request.vatRate) / 100;
      totalWithVat = request.salesValue + vatAmount;
    }

    // Generate sales code
    const salesCode = await salesEntryRepository.getNextSalesCode(request.date);

    // Create cost of sales transaction (Debit: Cost of Sales, Credit: Inventory)
    const costTransactionNumber = await transactionRepository.getNextTransactionNumber(
      request.date
    );
    await transactionRepository.create({
      date: request.date,
      number: costTransactionNumber,
      description: `Cost of Sales - ${request.description}`,
      amount: request.costValue,
      debitAccountId: product.costOfSalesAccountId,
      creditAccountId: product.inventoryAccountId,
      reconciled: false,
    });

    // Update balances for cost transaction
    await holderAccountRepository.updateBalance(product.costOfSalesAccountId, request.costValue, true);
    await holderAccountRepository.updateBalance(product.inventoryAccountId, request.costValue, false);

    // Create sales transaction (Debit: Customer, Credit: Sales)
    // Use totalWithVat if VAT is applied
    const salesTransactionNumber = await transactionRepository.getNextTransactionNumber(
      request.date
    );
    await transactionRepository.create({
      date: request.date,
      number: salesTransactionNumber,
      description: `Sales - ${request.description}${request.applyVat ? ' (incl. VAT)' : ''}`,
      amount: totalWithVat,
      debitAccountId: request.customerAccountId,
      creditAccountId: product.salesAccountId,
      reconciled: false,
    });

    // Update balances for sales transaction
    await holderAccountRepository.updateBalance(request.customerAccountId, totalWithVat, true);
    await holderAccountRepository.updateBalance(product.salesAccountId, request.salesValue, false);

    // If VAT is applied, create VAT liability transaction
    let vatTransactionNumber: string | undefined;
    if (request.applyVat && vatAmount > 0) {
      // Find or create VAT Payable account (liability account)
      // For now, we'll use the sales account - in production, you'd have a dedicated VAT account
      vatTransactionNumber = await transactionRepository.getNextTransactionNumber(request.date);
      await transactionRepository.create({
        date: request.date,
        number: vatTransactionNumber,
        description: `VAT Payable - ${request.description}`,
        amount: vatAmount,
        debitAccountId: product.salesAccountId, // Debit sales to separate VAT
        creditAccountId: product.salesAccountId, // Credit VAT Payable (would be separate account)
        reconciled: false,
        metadata: { isVatTransaction: true, vatRate: request.vatRate },
      });
    }

    // Create inventory movement
    const quantity = request.costValue / (request.costValue / 1); // Simplified - would need unit cost
    await inventoryMovementRepository.create({
      date: request.date,
      productId: request.productId,
      type: 'SALE',
      quantity: 1,
      unitCost: request.costValue,
      totalCost: request.costValue,
      referenceNumber: salesCode,
      description: request.description,
    });

    // Create sales entry
    const salesEntry = await salesEntryRepository.create({
      date: request.date,
      salesCode,
      productId: request.productId,
      description: request.description,
      salesValue: request.salesValue,
      costValue: request.costValue,
      customerAccountId: request.customerAccountId,
      costTransactionNumber,
      salesTransactionNumber,
      applyVat: request.applyVat,
      vatRate: request.vatRate,
      vatAmount,
      totalWithVat,
    });

    return salesEntry;
  }

  /**
   * Get sales entry by ID
   */
  async getSalesEntryById(salesEntryId: string): Promise<SalesEntry | null> {
    return await salesEntryRepository.findById(salesEntryId);
  }

  /**
   * Get all sales entries
   */
  async getSalesEntries(filters?: SalesFilters): Promise<SalesEntry[]> {
    const entries = await salesEntryRepository.findAll();
    if (!filters) return entries;
    return (salesEntryRepository as any).applyFilters(entries, filters);
  }

  /**
   * Get sales summaries for display
   */
  async getSalesSummaries(filters?: SalesFilters): Promise<SalesSummary[]> {
    const entries = await this.getSalesEntries(filters);
    const summaries: SalesSummary[] = [];

    for (const entry of entries) {
      const product = await productRepository.findById(entry.productId);
      const customer = await holderAccountRepository.findById(entry.customerAccountId);

      summaries.push({
        id: entry.id,
        date: entry.date,
        salesCode: entry.salesCode,
        productName: product?.name || 'Unknown',
        description: entry.description,
        salesValue: entry.salesValue,
        costValue: entry.costValue,
        customerAccount: customer?.name || 'Unknown',
      });
    }

    return summaries;
  }

  /**
   * Delete sales entry
   */
  async deleteSalesEntry(salesEntryId: string): Promise<void> {
    const entry = await salesEntryRepository.findById(salesEntryId);
    if (!entry) {
      throw new Error('Sales entry not found');
    }

    // Delete associated transactions
    const costTransaction = await transactionRepository.findAll();
    const costTrans = costTransaction.find((t) => t.number === entry.costTransactionNumber);
    const salesTrans = costTransaction.find((t) => t.number === entry.salesTransactionNumber);

    if (costTrans) {
      await holderAccountRepository.updateBalance(costTrans.debitAccountId, costTrans.amount, false);
      await holderAccountRepository.updateBalance(costTrans.creditAccountId, costTrans.amount, true);
      await transactionRepository.delete(costTrans.id);
    }

    if (salesTrans) {
      await holderAccountRepository.updateBalance(salesTrans.debitAccountId, salesTrans.amount, false);
      await holderAccountRepository.updateBalance(salesTrans.creditAccountId, salesTrans.amount, true);
      await transactionRepository.delete(salesTrans.id);
    }

    // Delete sales entry
    await salesEntryRepository.delete(salesEntryId);
  }

  /**
   * Validate sales entry data
   */
  async validateSalesEntry(data: CreateSalesEntryRequest): Promise<{
    isValid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    if (!data.productId) {
      errors.push('Product is required');
    }

    if (!data.description || data.description.trim().length === 0) {
      errors.push('Description is required');
    }

    if (data.salesValue <= 0) {
      errors.push('Sales value must be greater than zero');
    }

    if (data.costValue <= 0) {
      errors.push('Cost value must be greater than zero');
    }

    if (data.salesValue < data.costValue) {
      errors.push('Sales value must be greater than or equal to cost value');
    }

    if (!data.customerAccountId) {
      errors.push('Customer account is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

// Export singleton instance
export const salesService = SalesService.getInstance();
