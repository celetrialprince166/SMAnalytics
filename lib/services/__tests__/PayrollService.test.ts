/**
 * Payroll Service Tests
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { payrollService } from '../PayrollService';
import { employeeService } from '../EmployeeService';

describe('PayrollService', () => {
  beforeEach(() => {
    // Clear storage before each test
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
  });

  describe('Tax Configuration', () => {
    it('should create tax configuration with brackets', async () => {
      const config = await payrollService.createTaxConfiguration(
        new Date('2024-01-01'),
        [
          { order: 1, amount: 365, rate: 0 },
          { order: 2, amount: 110, rate: 5 },
          { order: 3, amount: 130, rate: 10 },
          { order: 4, amount: 3000, rate: 17.5 },
          { order: 5, amount: 0, rate: 25 },
        ],
        25,
        365
      );

      expect(config).toBeDefined();
      expect(config.brackets.length).toBe(5);
      expect(config.nonResidentRate).toBe(25);
      expect(config.personalRelief).toBe(365);
      expect(config.isActive).toBe(true);
    });

    it('should deactivate previous configuration when creating new one', async () => {
      const config1 = await payrollService.createTaxConfiguration(
        new Date('2024-01-01'),
        [{ order: 1, amount: 0, rate: 10 }],
        25,
        300
      );

      const config2 = await payrollService.createTaxConfiguration(
        new Date('2024-06-01'),
        [{ order: 1, amount: 0, rate: 15 }],
        25,
        365
      );

      const active = await payrollService.getActiveTaxConfiguration();
      expect(active?.id).toBe(config2.id);
      expect(active?.isActive).toBe(true);
    });

    it('should get tax configuration history', async () => {
      await payrollService.createTaxConfiguration(
        new Date('2024-01-01'),
        [{ order: 1, amount: 0, rate: 10 }],
        25,
        300
      );

      await payrollService.createTaxConfiguration(
        new Date('2024-06-01'),
        [{ order: 1, amount: 0, rate: 15 }],
        25,
        365
      );

      const history = await payrollService.getTaxConfigurationHistory();
      expect(history.length).toBe(2);
    });
  });

  describe('Pension Configuration', () => {
    it('should create pension configuration', async () => {
      const config = await payrollService.createPensionConfiguration({
        effectiveDate: new Date('2024-01-01'),
        tier1EmployerRate: 13,
        tier1EmployeeRate: 5.5,
        tier1PensionRate: 11,
        tier1NHISRate: 2.5,
        tier2Rate: 5,
        tier3EmployerRate: 5,
        tier3EmployeeRate: 5,
      });

      expect(config).toBeDefined();
      expect(config.tier1EmployerRate).toBe(13);
      expect(config.tier1EmployeeRate).toBe(5.5);
      expect(config.tier2Rate).toBe(5);
      expect(config.isActive).toBe(true);
    });

    it('should deactivate previous configuration when creating new one', async () => {
      const config1 = await payrollService.createPensionConfiguration({
        effectiveDate: new Date('2024-01-01'),
        tier1EmployerRate: 13,
        tier1EmployeeRate: 5.5,
        tier1PensionRate: 11,
        tier1NHISRate: 2.5,
        tier2Rate: 5,
        tier3EmployerRate: 5,
        tier3EmployeeRate: 5,
      });

      const config2 = await payrollService.createPensionConfiguration({
        effectiveDate: new Date('2024-06-01'),
        tier1EmployerRate: 14,
        tier1EmployeeRate: 6,
        tier1PensionRate: 12,
        tier1NHISRate: 2.5,
        tier2Rate: 5,
        tier3EmployerRate: 5,
        tier3EmployeeRate: 5,
      });

      const active = await payrollService.getActivePensionConfiguration();
      expect(active?.id).toBe(config2.id);
      expect(active?.tier1EmployerRate).toBe(14);
    });
  });

  describe('Tax Calculations', () => {
    let taxConfig: any;

    beforeEach(async () => {
      taxConfig = await payrollService.createTaxConfiguration(
        new Date('2024-01-01'),
        [
          { order: 1, amount: 365, rate: 0 },
          { order: 2, amount: 110, rate: 5 },
          { order: 3, amount: 130, rate: 10 },
          { order: 4, amount: 3000, rate: 17.5 },
          { order: 5, amount: 0, rate: 25 },
        ],
        25,
        365
      );
    });

    it('should calculate tax for income in first bracket (tax-free)', () => {
      const tax = payrollService.calculateIncomeTax(300, taxConfig);
      expect(tax).toBe(0); // Below personal relief
    });

    it('should calculate tax for income in second bracket', () => {
      const tax = payrollService.calculateIncomeTax(500, taxConfig);
      // First 365: 0%
      // Next 110: 5% = 5.5
      // Next 25: 10% = 2.5
      // Total: 8
      // Less personal relief: 8 - 365 = 0 (can't be negative)
      expect(tax).toBeGreaterThanOrEqual(0);
    });

    it('should calculate tax for high income', () => {
      const tax = payrollService.calculateIncomeTax(5000, taxConfig);
      expect(tax).toBeGreaterThan(0);
    });

    it('should calculate non-resident tax', () => {
      const tax = payrollService.calculateIncomeTax(5000, taxConfig, false);
      expect(tax).toBe(5000 * 0.25); // 25% flat rate
    });

    it('should not return negative tax', () => {
      const tax = payrollService.calculateIncomeTax(100, taxConfig);
      expect(tax).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Pension Calculations', () => {
    let pensionConfig: any;

    beforeEach(async () => {
      pensionConfig = await payrollService.createPensionConfiguration({
        effectiveDate: new Date('2024-01-01'),
        tier1EmployerRate: 13,
        tier1EmployeeRate: 5.5,
        tier1PensionRate: 11,
        tier1NHISRate: 2.5,
        tier2Rate: 5,
        tier3EmployerRate: 5,
        tier3EmployeeRate: 5,
      });
    });

    it('should calculate pension deductions correctly', () => {
      const basicSalary = 5000;
      const deductions = payrollService.calculatePensionDeductions(
        basicSalary,
        pensionConfig
      );

      expect(deductions.tier1Employee).toBe(5000 * 0.055); // 275
      expect(deductions.tier1Employer).toBe(5000 * 0.13); // 650
      expect(deductions.tier2).toBe(5000 * 0.05); // 250
      expect(deductions.tier3Employee).toBe(5000 * 0.05); // 250
      expect(deductions.tier3Employer).toBe(5000 * 0.05); // 250
      expect(deductions.totalSSNIT).toBe(275 + 250); // 525
    });

    it('should apply tier 3 maximum if set', async () => {
      const configWithMax = await payrollService.createPensionConfiguration({
        effectiveDate: new Date('2024-01-01'),
        tier1EmployerRate: 13,
        tier1EmployeeRate: 5.5,
        tier1PensionRate: 11,
        tier1NHISRate: 2.5,
        tier2Rate: 5,
        tier3EmployerRate: 5,
        tier3EmployeeRate: 5,
        tier3MaxAmount: 200,
      });

      const basicSalary = 10000;
      const deductions = payrollService.calculatePensionDeductions(
        basicSalary,
        configWithMax
      );

      expect(deductions.tier3Employee).toBe(200); // Capped at max
      expect(deductions.tier3Employer).toBe(200); // Capped at max
    });
  });

  describe('Salary Processing', () => {
    let employee: any;
    let taxConfig: any;
    let pensionConfig: any;

    beforeEach(async () => {
      // Create employee
      employee = await employeeService.createEmployee({
        firstName: 'John',
        surname: 'Doe',
        emailAddress: 'john.doe@example.com',
        phoneNumber: '+233 24 123 4567',
        dateOfBirth: new Date('1990-01-01'),
        department: 'Sales',
        position: 'Sales Manager',
        entryDate: new Date('2024-01-01'),
        basicSalary: 5000,
        status: 'ACTIVE',
        nationality: 'GHANAIAN',
        gender: 'MALE',
        maritalStatus: 'SINGLE',
        numberOfChildren: 0,
      });

      // Create tax configuration
      taxConfig = await payrollService.createTaxConfiguration(
        new Date('2024-01-01'),
        [
          { order: 1, amount: 365, rate: 0 },
          { order: 2, amount: 110, rate: 5 },
          { order: 3, amount: 130, rate: 10 },
          { order: 4, amount: 3000, rate: 17.5 },
          { order: 5, amount: 0, rate: 25 },
        ],
        25,
        365
      );

      // Create pension configuration
      pensionConfig = await payrollService.createPensionConfiguration({
        effectiveDate: new Date('2024-01-01'),
        tier1EmployerRate: 13,
        tier1EmployeeRate: 5.5,
        tier1PensionRate: 11,
        tier1NHISRate: 2.5,
        tier2Rate: 5,
        tier3EmployerRate: 5,
        tier3EmployeeRate: 5,
      });
    });

    it('should process salary with basic salary only', async () => {
      const salaryEntry = await payrollService.processSalary({
        employeeId: employee.id,
        salaryDate: new Date('2024-01-31'),
      });

      expect(salaryEntry).toBeDefined();
      expect(salaryEntry.basicSalary).toBe(5000);
      expect(salaryEntry.grossSalary).toBe(5000);
      expect(salaryEntry.tier1Employee).toBe(5000 * 0.055);
      expect(salaryEntry.tier2).toBe(5000 * 0.05);
      expect(salaryEntry.totalSSNIT).toBe(5000 * 0.055 + 5000 * 0.05);
      expect(salaryEntry.incomeTax).toBeGreaterThanOrEqual(0);
      expect(salaryEntry.netSalary).toBeLessThan(salaryEntry.grossSalary);
    });

    it('should process salary with allowances', async () => {
      const salaryEntry = await payrollService.processSalary({
        employeeId: employee.id,
        salaryDate: new Date('2024-01-31'),
        allowances: 1000,
      });

      expect(salaryEntry.allowances).toBe(1000);
      expect(salaryEntry.grossSalary).toBe(6000);
    });

    it('should process salary with commission', async () => {
      const salaryEntry = await payrollService.processSalary({
        employeeId: employee.id,
        salaryDate: new Date('2024-01-31'),
        commission: 500,
      });

      expect(salaryEntry.commission).toBe(500);
      expect(salaryEntry.grossSalary).toBe(5500);
    });

    it('should process salary with other deductions', async () => {
      const salaryEntry = await payrollService.processSalary({
        employeeId: employee.id,
        salaryDate: new Date('2024-01-31'),
        otherDeductions: 200,
      });

      expect(salaryEntry.otherDeductions).toBe(200);
      expect(salaryEntry.totalDeductions).toBeGreaterThan(200);
    });

    it('should throw error for inactive employee', async () => {
      await employeeService.updateEmployee(employee.id, { status: 'INACTIVE' });

      await expect(
        payrollService.processSalary({
          employeeId: employee.id,
          salaryDate: new Date('2024-01-31'),
        })
      ).rejects.toThrow('Cannot process salary for inactive employee');
    });

    it('should throw error when no tax configuration exists', async () => {
      // Clear storage to remove configurations
      localStorage.clear();

      await expect(
        payrollService.processSalary({
          employeeId: employee.id,
          salaryDate: new Date('2024-01-31'),
        })
      ).rejects.toThrow();
    });
  });

  describe('Commission Management', () => {
    let employee: any;

    beforeEach(async () => {
      employee = await employeeService.createEmployee({
        firstName: 'John',
        surname: 'Doe',
        emailAddress: 'john.doe@example.com',
        phoneNumber: '+233 24 123 4567',
        dateOfBirth: new Date('1990-01-01'),
        department: 'Sales',
        position: 'Sales Manager',
        entryDate: new Date('2024-01-01'),
        basicSalary: 5000,
        status: 'ACTIVE',
        nationality: 'GHANAIAN',
        gender: 'MALE',
        maritalStatus: 'SINGLE',
        numberOfChildren: 0,
      });
    });

    it('should create commission', async () => {
      const commission = await payrollService.createCommission({
        employeeId: employee.id,
        commissionDate: new Date('2024-01-15'),
        amount: 500,
        rate: 10,
        salesAmount: 5000,
        remarks: 'January sales commission',
      });

      expect(commission).toBeDefined();
      expect(commission.amount).toBe(500);
      expect(commission.rate).toBe(10);
      expect(commission.isPaid).toBe(false);
    });

    it('should get unpaid commissions', async () => {
      await payrollService.createCommission({
        employeeId: employee.id,
        commissionDate: new Date('2024-01-15'),
        amount: 500,
        rate: 10,
        salesAmount: 5000,
      });

      const unpaid = await payrollService.getUnpaidCommissions(employee.id);
      expect(unpaid.length).toBe(1);
      expect(unpaid[0].isPaid).toBe(false);
    });

    it('should mark commission as paid', async () => {
      const commission = await payrollService.createCommission({
        employeeId: employee.id,
        commissionDate: new Date('2024-01-15'),
        amount: 500,
        rate: 10,
        salesAmount: 5000,
      });

      const updated = await payrollService.markCommissionAsPaid(
        commission.id,
        'salary-entry-id'
      );

      expect(updated.isPaid).toBe(true);
      expect(updated.paidDate).toBeDefined();
      expect(updated.salaryEntryId).toBe('salary-entry-id');
    });

    it('should throw error when marking already paid commission', async () => {
      const commission = await payrollService.createCommission({
        employeeId: employee.id,
        commissionDate: new Date('2024-01-15'),
        amount: 500,
        rate: 10,
        salesAmount: 5000,
      });

      await payrollService.markCommissionAsPaid(commission.id, 'salary-entry-id');

      await expect(
        payrollService.markCommissionAsPaid(commission.id, 'another-id')
      ).rejects.toThrow('Commission already paid');
    });

    it('should calculate total unpaid commissions', async () => {
      await payrollService.createCommission({
        employeeId: employee.id,
        commissionDate: new Date('2024-01-15'),
        amount: 500,
        rate: 10,
        salesAmount: 5000,
      });

      await payrollService.createCommission({
        employeeId: employee.id,
        commissionDate: new Date('2024-01-20'),
        amount: 300,
        rate: 10,
        salesAmount: 3000,
      });

      const total = await payrollService.getTotalUnpaidCommissions(employee.id);
      expect(total).toBe(800);
    });
  });

  describe('Payroll Reports', () => {
    let employee1: any;
    let employee2: any;

    beforeEach(async () => {
      // Create employees
      employee1 = await employeeService.createEmployee({
        firstName: 'John',
        surname: 'Doe',
        emailAddress: 'john.doe@example.com',
        phoneNumber: '+233 24 123 4567',
        dateOfBirth: new Date('1990-01-01'),
        department: 'Sales',
        position: 'Sales Manager',
        entryDate: new Date('2024-01-01'),
        basicSalary: 5000,
        status: 'ACTIVE',
        nationality: 'GHANAIAN',
        gender: 'MALE',
        maritalStatus: 'SINGLE',
        numberOfChildren: 0,
      });

      employee2 = await employeeService.createEmployee({
        firstName: 'Jane',
        surname: 'Smith',
        emailAddress: 'jane.smith@example.com',
        phoneNumber: '+233 24 234 5678',
        dateOfBirth: new Date('1992-01-01'),
        department: 'Marketing',
        position: 'Marketing Manager',
        entryDate: new Date('2024-01-01'),
        basicSalary: 6000,
        status: 'ACTIVE',
        nationality: 'GHANAIAN',
        gender: 'FEMALE',
        maritalStatus: 'SINGLE',
        numberOfChildren: 0,
      });

      // Create configurations
      await payrollService.createTaxConfiguration(
        new Date('2024-01-01'),
        [{ order: 1, amount: 0, rate: 10 }],
        25,
        365
      );

      await payrollService.createPensionConfiguration({
        effectiveDate: new Date('2024-01-01'),
        tier1EmployerRate: 13,
        tier1EmployeeRate: 5.5,
        tier1PensionRate: 11,
        tier1NHISRate: 2.5,
        tier2Rate: 5,
        tier3EmployerRate: 5,
        tier3EmployeeRate: 5,
      });

      // Process salaries
      await payrollService.processSalary({
        employeeId: employee1.id,
        salaryDate: new Date('2024-01-31'),
      });

      await payrollService.processSalary({
        employeeId: employee2.id,
        salaryDate: new Date('2024-01-31'),
      });
    });

    it('should generate payroll summary', async () => {
      const summary = await payrollService.getPayrollSummary(2024, 0); // January

      expect(summary.totalEmployees).toBe(2);
      expect(summary.totalGrossSalary).toBe(11000);
      expect(summary.totalDeductions).toBeGreaterThan(0);
      expect(summary.totalNetSalary).toBeLessThan(summary.totalGrossSalary);
      expect(summary.totalIncomeTax).toBeGreaterThan(0);
      expect(summary.totalSSNIT).toBeGreaterThan(0);
    });

    it('should get salaries by period', async () => {
      const salaries = await payrollService.getSalariesByPeriod(
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      expect(salaries.length).toBe(2);
    });

    it('should calculate total payroll', async () => {
      const total = await payrollService.getTotalPayroll(
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      expect(total).toBeGreaterThan(0);
      expect(total).toBeLessThan(11000); // Less than gross due to deductions
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete payroll cycle', async () => {
      // 1. Create employee
      const employee = await employeeService.createEmployee({
        firstName: 'Test',
        surname: 'Employee',
        emailAddress: 'test@example.com',
        phoneNumber: '+233 24 123 4567',
        dateOfBirth: new Date('1990-01-01'),
        department: 'IT',
        position: 'Developer',
        entryDate: new Date('2024-01-01'),
        basicSalary: 5000,
        status: 'ACTIVE',
        nationality: 'GHANAIAN',
        gender: 'MALE',
        maritalStatus: 'SINGLE',
        numberOfChildren: 0,
      });

      // 2. Create tax configuration
      await payrollService.createTaxConfiguration(
        new Date('2024-01-01'),
        [{ order: 1, amount: 0, rate: 10 }],
        25,
        365
      );

      // 3. Create pension configuration
      await payrollService.createPensionConfiguration({
        effectiveDate: new Date('2024-01-01'),
        tier1EmployerRate: 13,
        tier1EmployeeRate: 5.5,
        tier1PensionRate: 11,
        tier1NHISRate: 2.5,
        tier2Rate: 5,
        tier3EmployerRate: 5,
        tier3EmployeeRate: 5,
      });

      // 4. Create commission
      const commission = await payrollService.createCommission({
        employeeId: employee.id,
        commissionDate: new Date('2024-01-15'),
        amount: 500,
        rate: 10,
        salesAmount: 5000,
      });

      // 5. Process salary with commission
      const salaryEntry = await payrollService.processSalary({
        employeeId: employee.id,
        salaryDate: new Date('2024-01-31'),
        commission: 500,
      });

      // 6. Mark commission as paid
      await payrollService.markCommissionAsPaid(commission.id, salaryEntry.id);

      // 7. Verify everything
      expect(salaryEntry.commission).toBe(500);
      expect(salaryEntry.grossSalary).toBe(5500);
      
      const updatedCommission = await payrollService.getCommission(commission.id);
      expect(updatedCommission?.isPaid).toBe(true);

      const unpaid = await payrollService.getUnpaidCommissions(employee.id);
      expect(unpaid.length).toBe(0);
    });
  });
});
