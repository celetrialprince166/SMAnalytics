/**
 * Sales Service Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { salesService } from '../SalesService';
import { productService } from '../ProductService';
import { accountService } from '../AccountService';
import { transactionRepository } from '../../repositories/TransactionRepository';
import { setupAccountHierarchy } from './helpers/accountSetup';

describe('SalesService', () => {
  let testProduct: any;
  let testCustomer: any;

  beforeEach(async () => {
    // Clear storage before each test
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }

    // Set up account hierarchy for tests
    const accounts = await setupAccountHierarchy();

    // Create test product
    testProduct = await productService.createProduct({
      name: 'Test Product',
      unitPrice: 100,
      costPrice: 60,
      quantityOnHand: 100,
    });

    // Create test customer account
    testCustomer = await accountService.createHolderAccount({
      name: 'Test Customer',
      secondaryAccountId: accounts.secondary.customers.id,
    });
  });

  describe('Sales Entry Creation', () => {
    it('should create a sales entry with automatic transactions', async () => {
      const salesData = {
        date: new Date(),
        productId: testProduct.id,
        description: 'Test Sale',
        salesValue: 100,
        costValue: 60,
        customerAccountId: testCustomer.id,
      };

      const salesEntry = await salesService.createSalesEntry(salesData);

      expect(salesEntry).toBeDefined();
      expect(salesEntry.salesCode).toMatch(/SALES-\d{6}-\d{4}/);
      expect(salesEntry.salesValue).toBe(100);
      expect(salesEntry.costValue).toBe(60);
      expect(salesEntry.costTransactionNumber).toBeDefined();
      expect(salesEntry.salesTransactionNumber).toBeDefined();
    });

    it('should create two transactions for each sale', async () => {
      const salesData = {
        date: new Date(),
        productId: testProduct.id,
        description: 'Test Sale',
        salesValue: 100,
        costValue: 60,
        customerAccountId: testCustomer.id,
      };

      await salesService.createSalesEntry(salesData);

      const transactions = await transactionRepository.findAll();
      expect(transactions.length).toBe(2);

      // Check cost transaction
      const costTrans = transactions.find(t => 
        t.debitAccountId === testProduct.costOfSalesAccountId
      );
      expect(costTrans).toBeDefined();
      expect(costTrans?.amount).toBe(60);

      // Check sales transaction
      const salesTrans = transactions.find(t => 
        t.debitAccountId === testCustomer.id
      );
      expect(salesTrans).toBeDefined();
      expect(salesTrans?.amount).toBe(100);
    });

    it('should validate sales data', async () => {
      const invalidData = {
        date: new Date(),
        productId: testProduct.id,
        description: '',
        salesValue: -100,
        costValue: 60,
        customerAccountId: testCustomer.id,
      };

      await expect(
        salesService.createSalesEntry(invalidData)
      ).rejects.toThrow();
    });

    it('should prevent sales value less than cost value', async () => {
      const invalidData = {
        date: new Date(),
        productId: testProduct.id,
        description: 'Test Sale',
        salesValue: 50,
        costValue: 100,
        customerAccountId: testCustomer.id,
      };

      await expect(
        salesService.createSalesEntry(invalidData)
      ).rejects.toThrow('Sales value must be greater than or equal to cost value');
    });

    it('should require valid product', async () => {
      const invalidData = {
        date: new Date(),
        productId: 'invalid-id',
        description: 'Test Sale',
        salesValue: 100,
        costValue: 60,
        customerAccountId: testCustomer.id,
      };

      await expect(
        salesService.createSalesEntry(invalidData)
      ).rejects.toThrow('Product not found');
    });

    it('should require valid customer account', async () => {
      const invalidData = {
        date: new Date(),
        productId: testProduct.id,
        description: 'Test Sale',
        salesValue: 100,
        costValue: 60,
        customerAccountId: 'invalid-id',
      };

      await expect(
        salesService.createSalesEntry(invalidData)
      ).rejects.toThrow('Customer account not found');
    });
  });

  describe('Sales Entry Retrieval', () => {
    it('should retrieve sales entry by ID', async () => {
      const salesData = {
        date: new Date(),
        productId: testProduct.id,
        description: 'Test Sale',
        salesValue: 100,
        costValue: 60,
        customerAccountId: testCustomer.id,
      };

      const created = await salesService.createSalesEntry(salesData);
      const retrieved = await salesService.getSalesEntryById(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
    });

    it('should get all sales entries', async () => {
      await salesService.createSalesEntry({
        date: new Date(),
        productId: testProduct.id,
        description: 'Sale 1',
        salesValue: 100,
        costValue: 60,
        customerAccountId: testCustomer.id,
      });

      await salesService.createSalesEntry({
        date: new Date(),
        productId: testProduct.id,
        description: 'Sale 2',
        salesValue: 200,
        costValue: 120,
        customerAccountId: testCustomer.id,
      });

      const entries = await salesService.getSalesEntries();
      expect(entries.length).toBe(2);
    });

    it('should get sales summaries', async () => {
      await salesService.createSalesEntry({
        date: new Date(),
        productId: testProduct.id,
        description: 'Test Sale',
        salesValue: 100,
        costValue: 60,
        customerAccountId: testCustomer.id,
      });

      const summaries = await salesService.getSalesSummaries();
      expect(summaries.length).toBe(1);
      expect(summaries[0].productName).toBe('Test Product');
      expect(summaries[0].customerAccount).toBe('Test Customer');
    });
  });

  describe('Sales Entry Deletion', () => {
    it('should delete sales entry and reverse transactions', async () => {
      const salesData = {
        date: new Date(),
        productId: testProduct.id,
        description: 'Test Sale',
        salesValue: 100,
        costValue: 60,
        customerAccountId: testCustomer.id,
      };

      const salesEntry = await salesService.createSalesEntry(salesData);
      
      // Verify transactions exist
      let transactions = await transactionRepository.findAll();
      expect(transactions.length).toBe(2);

      // Delete sales entry
      await salesService.deleteSalesEntry(salesEntry.id);

      // Verify transactions are deleted
      transactions = await transactionRepository.findAll();
      expect(transactions.length).toBe(0);

      // Verify sales entry is deleted
      const retrieved = await salesService.getSalesEntryById(salesEntry.id);
      expect(retrieved).toBeNull();
    });
  });

  describe('Sales Filtering', () => {
    beforeEach(async () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      await salesService.createSalesEntry({
        date: today,
        productId: testProduct.id,
        description: 'Today Sale',
        salesValue: 100,
        costValue: 60,
        customerAccountId: testCustomer.id,
      });

      await salesService.createSalesEntry({
        date: yesterday,
        productId: testProduct.id,
        description: 'Yesterday Sale',
        salesValue: 200,
        costValue: 120,
        customerAccountId: testCustomer.id,
      });
    });

    it('should filter by date range', async () => {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const entries = await salesService.getSalesEntries({
        startDate: today,
        endDate: tomorrow,
      });

      // Should include today's sale
      expect(entries.length).toBeGreaterThanOrEqual(1);
      const todaySale = entries.find(e => e.description === 'Today Sale');
      expect(todaySale).toBeDefined();
    });

    it('should filter by product', async () => {
      const entries = await salesService.getSalesEntries({
        productId: testProduct.id,
      });

      expect(entries.length).toBe(2);
    });

    it('should filter by customer', async () => {
      const entries = await salesService.getSalesEntries({
        customerAccountId: testCustomer.id,
      });

      expect(entries.length).toBe(2);
    });
  });

  describe('Sales Code Generation', () => {
    it('should generate unique sales codes', async () => {
      const sale1 = await salesService.createSalesEntry({
        date: new Date(),
        productId: testProduct.id,
        description: 'Sale 1',
        salesValue: 100,
        costValue: 60,
        customerAccountId: testCustomer.id,
      });

      const sale2 = await salesService.createSalesEntry({
        date: new Date(),
        productId: testProduct.id,
        description: 'Sale 2',
        salesValue: 100,
        costValue: 60,
        customerAccountId: testCustomer.id,
      });

      expect(sale1.salesCode).not.toBe(sale2.salesCode);
    });

    it('should format sales codes correctly', async () => {
      const sale = await salesService.createSalesEntry({
        date: new Date(),
        productId: testProduct.id,
        description: 'Test Sale',
        salesValue: 100,
        costValue: 60,
        customerAccountId: testCustomer.id,
      });

      expect(sale.salesCode).toMatch(/SALES-\d{6}-\d{4}/);
    });
  });
});
