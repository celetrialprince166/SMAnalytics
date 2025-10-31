/**
 * Report Service Tests - Sales Reports
 * 
 * Tests for Sales Levels and Sales Movement Reports
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ReportService } from '../ReportService';
import { SalesService } from '../SalesService';
import { ProductService } from '../ProductService';
import { setupAccountHierarchy } from './helpers/accountSetup';

describe('ReportService - Sales Reports', () => {
  let reportService: ReportService;
  let salesService: SalesService;
  let productService: ProductService;
  let testProduct: any;

  beforeEach(async () => {
    // Clear localStorage
    localStorage.clear();

    reportService = ReportService.getInstance();
    salesService = SalesService.getInstance();
    productService = ProductService.getInstance();

    // Setup test accounts
    const testAccounts = await setupAccountHierarchy();

    // Create test product
    testProduct = await productService.createProduct({
      name: 'Test Service',
      description: 'Test service for sales reports',
      unitPrice: 1000,
      costPrice: 500,
    });

    // Create sample sales entries
    await salesService.createSalesEntry({
      date: new Date('2024-01-15'),
      productId: testProduct.id,
      description: 'Q1 Sale 1',
      salesValue: 10000,
      costValue: 5000,
      customerAccountId: testAccounts.holder.customers.id,
      invoiceNumber: 'INV-Q1-001',
      applyVat: true,
      vatRate: 15,
    });

    await salesService.createSalesEntry({
      date: new Date('2024-02-15'),
      productId: testProduct.id,
      description: 'Q1 Sale 2',
      salesValue: 15000,
      costValue: 7500,
      customerAccountId: testAccounts.holder.customers.id,
      invoiceNumber: 'INV-Q1-002',
      applyVat: true,
      vatRate: 15,
    });

    await salesService.createSalesEntry({
      date: new Date('2024-04-15'),
      productId: testProduct.id,
      description: 'Q2 Sale 1',
      salesValue: 20000,
      costValue: 10000,
      customerAccountId: testAccounts.holder.customers.id,
      invoiceNumber: 'INV-Q2-001',
      applyVat: true,
      vatRate: 15,
    });
  });

  describe('generateSalesLevelsReport', () => {
    it('should generate a sales levels report', async () => {
      const startDate = new Date('2024-01-01');
      const numberOfPeriods = 2;
      const periodType = 'QUARTERLY';

      const report = await reportService.generateSalesLevelsReport(
        'P_LEVELS',
        'SERVICES',
        startDate,
        numberOfPeriods,
        periodType
      );

      expect(report).toBeDefined();
      expect(report.reportType).toBe('P_LEVELS');
      expect(report.mode).toBe('SERVICES');
      expect(report.periodType).toBe('QUARTERLY');
      expect(report.periods).toHaveLength(numberOfPeriods);
      expect(Array.isArray(report.items)).toBe(true);
      expect(Array.isArray(report.totals)).toBe(true);
      expect(report.totals).toHaveLength(numberOfPeriods);
      expect(report.generatedAt).toBeInstanceOf(Date);
    });

    it('should have correct period structure', async () => {
      const startDate = new Date('2024-01-01');
      const numberOfPeriods = 2;
      const periodType = 'QUARTERLY';

      const report = await reportService.generateSalesLevelsReport(
        'P_LEVELS',
        'SERVICES',
        startDate,
        numberOfPeriods,
        periodType
      );

      report.periods.forEach((period) => {
        expect(period).toHaveProperty('startDate');
        expect(period).toHaveProperty('endDate');
        expect(period.startDate).toBeInstanceOf(Date);
        expect(period.endDate).toBeInstanceOf(Date);
        expect(period.endDate.getTime()).toBeGreaterThan(period.startDate.getTime());
      });
    });

    it('should have correct item structure', async () => {
      const startDate = new Date('2024-01-01');
      const numberOfPeriods = 2;
      const periodType = 'QUARTERLY';

      const report = await reportService.generateSalesLevelsReport(
        'P_LEVELS',
        'SERVICES',
        startDate,
        numberOfPeriods,
        periodType
      );

      report.items.forEach((item) => {
        expect(item).toHaveProperty('name');
        expect(item).toHaveProperty('values');
        expect(Array.isArray(item.values)).toBe(true);
        expect(item.values).toHaveLength(numberOfPeriods);
        item.values.forEach((value) => {
          expect(typeof value).toBe('number');
          expect(value).toBeGreaterThanOrEqual(0);
        });
      });
    });

    it('should calculate totals correctly', async () => {
      const startDate = new Date('2024-01-01');
      const numberOfPeriods = 2;
      const periodType = 'QUARTERLY';

      const report = await reportService.generateSalesLevelsReport(
        'P_LEVELS',
        'SERVICES',
        startDate,
        numberOfPeriods,
        periodType
      );

      report.totals.forEach((total, periodIndex) => {
        const calculatedTotal = report.items.reduce(
          (sum, item) => sum + item.values[periodIndex],
          0
        );
        expect(Math.abs(total - calculatedTotal)).toBeLessThan(0.01);
      });
    });

    it('should support different period types', async () => {
      const startDate = new Date('2024-01-01');
      const numberOfPeriods = 2;

      const periodTypes: Array<'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUALLY' | 'ANNUALLY'> = [
        'MONTHLY',
        'QUARTERLY',
        'SEMI_ANNUALLY',
        'ANNUALLY',
      ];

      for (const periodType of periodTypes) {
        const report = await reportService.generateSalesLevelsReport(
          'P_LEVELS',
          'SERVICES',
          startDate,
          numberOfPeriods,
          periodType
        );

        expect(report.periodType).toBe(periodType);
        expect(report.periods).toHaveLength(numberOfPeriods);
      }
    });

    it('should support different report types', async () => {
      const startDate = new Date('2024-01-01');
      const numberOfPeriods = 2;
      const periodType = 'QUARTERLY';

      const reportTypes: Array<'P_LEVELS' | 'G_LEVELS'> = ['P_LEVELS', 'G_LEVELS'];

      for (const reportType of reportTypes) {
        const report = await reportService.generateSalesLevelsReport(
          reportType,
          'SERVICES',
          startDate,
          numberOfPeriods,
          periodType
        );

        expect(report.reportType).toBe(reportType);
      }
    });

    it('should support different modes', async () => {
      const startDate = new Date('2024-01-01');
      const numberOfPeriods = 2;
      const periodType = 'QUARTERLY';

      const modes: Array<'SERVICE_MODE' | 'SERVICE_LINES' | 'SERVICES'> = [
        'SERVICE_MODE',
        'SERVICE_LINES',
        'SERVICES',
      ];

      for (const mode of modes) {
        const report = await reportService.generateSalesLevelsReport(
          'P_LEVELS',
          mode,
          startDate,
          numberOfPeriods,
          periodType
        );

        expect(report.mode).toBe(mode);
      }
    });
  });

  describe('generateSalesMovementReport', () => {
    it('should generate a sales movement report', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      const report = await reportService.generateSalesMovementReport(
        startDate,
        endDate,
        'PERIODIC'
      );

      expect(report).toBeDefined();
      expect(report.period.startDate).toEqual(startDate);
      expect(report.period.endDate).toEqual(endDate);
      expect(report.dateMode).toBe('PERIODIC');
      expect(Array.isArray(report.movements)).toBe(true);
      expect(report.movements.length).toBeGreaterThan(0);
      expect(typeof report.totalQuantity).toBe('number');
      expect(typeof report.totalValue).toBe('number');
      expect(report.generatedAt).toBeInstanceOf(Date);
    });

    it('should have correct movement structure', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      const report = await reportService.generateSalesMovementReport(
        startDate,
        endDate,
        'PERIODIC'
      );

      report.movements.forEach((movement) => {
        expect(movement).toHaveProperty('date');
        expect(movement).toHaveProperty('description');
        expect(movement).toHaveProperty('quantity');
        expect(movement).toHaveProperty('value');
        expect(movement.date).toBeInstanceOf(Date);
        expect(typeof movement.quantity).toBe('number');
        expect(typeof movement.value).toBe('number');
      });
    });

    it('should filter by product', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      const report = await reportService.generateSalesMovementReport(
        startDate,
        endDate,
        'PERIODIC',
        testProduct.id
      );

      expect(report.movements.length).toBeGreaterThan(0);
      // All movements should be for the test product
      // Verify all movements are for the same product
      expect(report.movements.length).toBe(3); // We created 3 sales for this product
    });

    it('should calculate totals correctly', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      const report = await reportService.generateSalesMovementReport(
        startDate,
        endDate,
        'PERIODIC'
      );

      const calculatedQuantity = report.movements.reduce((sum, m) => sum + m.quantity, 0);
      const calculatedValue = report.movements.reduce((sum, m) => sum + m.value, 0);

      expect(Math.abs(report.totalQuantity - calculatedQuantity)).toBeLessThan(0.01);
      expect(Math.abs(report.totalValue - calculatedValue)).toBeLessThan(0.01);
    });

    it('should support different date modes', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      const dateModes: Array<'PERIODIC' | 'ON' | 'AS_AT'> = ['PERIODIC', 'ON', 'AS_AT'];

      for (const dateMode of dateModes) {
        const report = await reportService.generateSalesMovementReport(
          startDate,
          endDate,
          dateMode
        );

        expect(report.dateMode).toBe(dateMode);
      }
    });

    it('should sort movements by date', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      const report = await reportService.generateSalesMovementReport(
        startDate,
        endDate,
        'PERIODIC'
      );

      for (let i = 1; i < report.movements.length; i++) {
        expect(report.movements[i].date.getTime()).toBeGreaterThanOrEqual(
          report.movements[i - 1].date.getTime()
        );
      }
    });
  });
});
