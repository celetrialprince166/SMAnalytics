/**
 * Company Settings Service Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { companySettingsService } from '../CompanySettingsService';

describe('CompanySettingsService', () => {
  beforeEach(async () => {
    // Clear localStorage before each test
    if (typeof window !== 'undefined') {
      window.localStorage.clear();
    }
  });

  describe('Settings Management', () => {
    it('should initialize default settings', async () => {
      const settings = await companySettingsService.getSettings();

      expect(settings).toBeDefined();
      expect(settings.companyName).toBe('SNM Analytics');
      expect(settings.vatRate).toBe(15);
      expect(settings.baseCurrency).toBe('GHS');
      expect(settings.invoicePrefix).toBe('INV');
    });

    it('should update company settings', async () => {
      await companySettingsService.getSettings(); // Initialize

      const updated = await companySettingsService.updateSettings({
        companyName: 'Test Company',
        vatRate: 12.5,
        address: '123 Test Street',
      });

      expect(updated.companyName).toBe('Test Company');
      expect(updated.vatRate).toBe(12.5);
      expect(updated.address).toBe('123 Test Street');
    });

    it('should get VAT rate', async () => {
      await companySettingsService.getSettings(); // Initialize
      const vatRate = await companySettingsService.getVatRate();

      expect(vatRate).toBe(15);
    });

    it('should get invoice settings', async () => {
      await companySettingsService.getSettings(); // Initialize
      const invoiceSettings = await companySettingsService.getInvoiceSettings();

      expect(invoiceSettings.prefix).toBe('INV');
      expect(invoiceSettings.format).toBe('INV-YYYYMM-####');
      expect(invoiceSettings.termsDays).toBe(30);
      expect(invoiceSettings.footerText).toBe('Thank you for your business!');
    });

    it('should get bank details', async () => {
      await companySettingsService.updateSettings({
        bankName: 'Test Bank',
        bankAccountNumber: '1234567890',
        bankSortCode: '123456',
      });

      const bankDetails = await companySettingsService.getBankDetails();

      expect(bankDetails.bankName).toBe('Test Bank');
      expect(bankDetails.accountNumber).toBe('1234567890');
      expect(bankDetails.sortCode).toBe('123456');
    });
  });

  describe('VAT Calculations', () => {
    it('should calculate VAT correctly', () => {
      const vat = companySettingsService.calculateVat(1000, 15);
      expect(vat).toBe(150);
    });

    it('should calculate VAT with different rates', () => {
      expect(companySettingsService.calculateVat(1000, 10)).toBe(100);
      expect(companySettingsService.calculateVat(1000, 20)).toBe(200);
      expect(companySettingsService.calculateVat(500, 15)).toBe(75);
    });

    it('should calculate VAT with decimal rates', () => {
      const vat = companySettingsService.calculateVat(1000, 12.5);
      expect(vat).toBe(125);
    });

    it('should calculate total with VAT', () => {
      const total = companySettingsService.calculateTotalWithVat(1000, 15);
      expect(total).toBe(1150);
    });

    it('should handle zero amount', () => {
      const vat = companySettingsService.calculateVat(0, 15);
      expect(vat).toBe(0);
    });

    it('should handle zero VAT rate', () => {
      const vat = companySettingsService.calculateVat(1000, 0);
      expect(vat).toBe(0);
    });
  });

  describe('Invoice Number Generation', () => {
    it('should generate invoice number with correct format', async () => {
      await companySettingsService.getSettings(); // Initialize
      
      const date = new Date('2025-01-07');
      const invoiceNumber = await companySettingsService.generateInvoiceNumber(date);

      expect(invoiceNumber).toMatch(/^INV-202501-\d{4}$/);
    });

    it('should generate sequential invoice numbers', async () => {
      await companySettingsService.getSettings(); // Initialize
      
      const date = new Date('2025-01-07');
      const inv1 = await companySettingsService.generateInvoiceNumber(date);
      const inv2 = await companySettingsService.generateInvoiceNumber(date);
      const inv3 = await companySettingsService.generateInvoiceNumber(date);

      expect(inv1).toMatch(/INV-202501-0001/);
      expect(inv2).toMatch(/INV-202501-0002/);
      expect(inv3).toMatch(/INV-202501-0003/);
    });

    it('should use correct year and month', async () => {
      await companySettingsService.getSettings(); // Initialize
      
      const date1 = new Date('2025-01-15');
      const date2 = new Date('2025-12-25');

      const inv1 = await companySettingsService.generateInvoiceNumber(date1);
      const inv2 = await companySettingsService.generateInvoiceNumber(date2);

      expect(inv1).toContain('202501');
      expect(inv2).toContain('202512');
    });
  });

  describe('Due Date Calculation', () => {
    it('should calculate due date based on terms', async () => {
      await companySettingsService.getSettings(); // Initialize
      
      const invoiceDate = new Date('2025-01-07');
      const dueDate = await companySettingsService.calculateDueDate(invoiceDate);

      const expectedDueDate = new Date('2025-02-06'); // 30 days later
      expect(dueDate.toDateString()).toBe(expectedDueDate.toDateString());
    });

    it('should calculate due date with custom terms', async () => {
      await companySettingsService.updateSettings({
        invoiceTermsDays: 14,
      });

      const invoiceDate = new Date('2025-01-07');
      const dueDate = await companySettingsService.calculateDueDate(invoiceDate);

      const expectedDueDate = new Date('2025-01-21'); // 14 days later
      expect(dueDate.toDateString()).toBe(expectedDueDate.toDateString());
    });

    it('should handle month boundaries', async () => {
      await companySettingsService.getSettings(); // Initialize
      
      const invoiceDate = new Date('2025-01-31');
      const dueDate = await companySettingsService.calculateDueDate(invoiceDate);

      // 30 days from Jan 31 should be Mar 2 (or Mar 3 depending on leap year)
      expect(dueDate.getMonth()).toBe(2); // March (0-indexed)
    });
  });
});
