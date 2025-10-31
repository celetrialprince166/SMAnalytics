/**
 * Report Service - Payroll Reports Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { reportService } from '../ReportService';
import { employeeRepository } from '../../repositories/EmployeeRepository';
import { salaryEntryRepository, commissionRepository } from '../../repositories/PayrollRepository';

describe('ReportService - Payroll Reports', () => {
  let emp1Id: string;
  let emp2Id: string;

  beforeEach(async () => {
    // Create test employees
    const emp1 = await employeeRepository.create({
      employeeId: 'EMP001',
      firstName: 'John',
      surname: 'Doe',
      dateOfBirth: new Date('1990-01-15'),
      gender: 'MALE',
      nationality: 'GHANAIAN',
      maritalStatus: 'SINGLE',
      numberOfChildren: 0,
      emailAddress: 'john.doe@example.com',
      phoneNumber: '0241234567',
      position: 'Senior Analyst',
      department: 'Finance',
      entryDate: new Date('2020-01-01'),
      basicSalary: 5000,
      status: 'ACTIVE',
      entryLevel: 'Analyst',
      currentLevel: 'Senior Analyst',
      entryBasicSalary: 3000,
      holdingBank: 'GCB Bank',
      bankBranch: 'Accra Main',
      bankAccountNo: '1234567890',
      ssnitNumber: 'C123456789',
      taxNumber: 'TIN001',
      isActive: true,
    });

    const emp2 = await employeeRepository.create({
      employeeId: 'EMP002',
      firstName: 'Jane',
      surname: 'Smith',
      dateOfBirth: new Date('1992-05-20'),
      gender: 'FEMALE',
      nationality: 'GHANAIAN',
      maritalStatus: 'MARRIED',
      numberOfChildren: 2,
      emailAddress: 'jane.smith@example.com',
      phoneNumber: '0249876543',
      position: 'Manager',
      department: 'Operations',
      entryDate: new Date('2019-06-01'),
      basicSalary: 7000,
      status: 'ACTIVE',
      entryLevel: 'Officer',
      currentLevel: 'Manager',
      entryBasicSalary: 4000,
      holdingBank: 'Ecobank',
      bankBranch: 'Tema',
      bankAccountNo: '9876543210',
      ssnitNumber: 'C987654321',
      taxNumber: 'TIN002',
      isActive: true,
    });

    emp1Id = emp1.id;
    emp2Id = emp2.id;

    // Create salary entries
    await salaryEntryRepository.create({
      employeeId: emp1Id,
      salaryDate: new Date('2024-01-31'),
      processedDate: new Date('2024-01-31'),
      basicSalary: 5000,
      allowances: 2000,
      commission: 500,
      grossSalary: 7500,
      incomeTax: 750,
      tier1Employee: 275,
      tier2: 250,
      tier3Employee: 0,
      totalSSNIT: 525,
      otherDeductions: 0,
      totalDeductions: 1275,
      netSalary: 6225,
    });

    await salaryEntryRepository.create({
      employeeId: emp2Id,
      salaryDate: new Date('2024-01-31'),
      processedDate: new Date('2024-01-31'),
      basicSalary: 7000,
      allowances: 2800,
      commission: 1000,
      grossSalary: 10800,
      incomeTax: 1080,
      tier1Employee: 385,
      tier2: 350,
      tier3Employee: 0,
      totalSSNIT: 735,
      otherDeductions: 0,
      totalDeductions: 1815,
      netSalary: 8985,
    });

    // Create commissions
    await commissionRepository.create({
      employeeId: emp1Id,
      commissionDate: new Date('2024-01-31'),
      salesAmount: 50000,
      rate: 0.01,
      amount: 500,
      isPaid: true,
    });

    await commissionRepository.create({
      employeeId: emp2Id,
      commissionDate: new Date('2024-01-31'),
      salesAmount: 100000,
      rate: 0.01,
      amount: 1000,
      isPaid: false,
    });
  });

  describe('generateEmployeeSalariesReport', () => {
    it('should generate employee salaries report', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const report = await reportService.generateEmployeeSalariesReport(startDate, endDate);

      expect(report.title).toBe('Employee Salaries Report: Earnings');
      expect(report.employees.length).toBeGreaterThanOrEqual(2);
      
      // Find our test employees
      const emp1 = report.employees.find(e => e.employeeId === 'EMP001');
      const emp2 = report.employees.find(e => e.employeeId === 'EMP002');
      
      expect(emp1).toBeDefined();
      expect(emp1?.basicSalary).toBe(5000);
      expect(emp1?.netSalary).toBe(6225);
      
      expect(emp2).toBeDefined();
      expect(emp2?.basicSalary).toBe(7000);
      expect(emp2?.netSalary).toBe(8985);
    });
  });

  describe('generateEmployeesRegisterReport', () => {
    it('should generate employees register', async () => {
      const report = await reportService.generateEmployeesRegisterReport();

      expect(report.title).toBe('Employees Register - Official');
      expect(report.employees.length).toBeGreaterThanOrEqual(2);
      
      // Find our test employees
      const emp1 = report.employees.find(e => e.employeeId === 'EMP001');
      const emp2 = report.employees.find(e => e.employeeId === 'EMP002');
      
      expect(emp1).toBeDefined();
      expect(emp1?.employeeName).toBe('John Doe');
      expect(emp1?.currentLevel).toBe('Senior Analyst');
      
      expect(emp2).toBeDefined();
      expect(emp2?.employeeName).toBe('Jane Smith');
      expect(emp2?.currentLevel).toBe('Manager');
    });
  });

  describe('generateResourceCommissionsReport', () => {
    it('should generate commissions report', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const report = await reportService.generateResourceCommissionsReport(startDate, endDate);

      expect(report.title).toBe('Resource Commissions Report: Comprehensive');
      expect(report.commissions.length).toBeGreaterThanOrEqual(2);
      
      // Find our test commissions
      const comm1 = report.commissions.find(c => c.employeeId === 'EMP001');
      const comm2 = report.commissions.find(c => c.employeeId === 'EMP002');
      
      expect(comm1).toBeDefined();
      expect(comm1?.totalExpectedCommission).toBe(500);
      expect(comm1?.commissionPaid).toBe(475); // 500 - 5% WHT
      expect(comm1?.commissionsOutstanding).toBe(0);
      
      expect(comm2).toBeDefined();
      expect(comm2?.totalExpectedCommission).toBe(1000);
      expect(comm2?.commissionPaid).toBe(0);
      expect(comm2?.commissionsOutstanding).toBe(950); // 1000 - 5% WHT
    });
  });

  describe('generatePayslipReport', () => {
    it('should generate payslip for employee', async () => {
      // The method expects the internal employee ID, not employeeId
      // Month is 1-based in the API (1 = January), but internally uses 0-based (0 = January)
      // Our test data has salaryDate '2024-01-31' which is January
      const report = await reportService.generatePayslipReport(emp1Id, 2024, 1);

      expect(report.employeeName).toBe('John Doe');
      expect(report.employeeId).toBe('EMP001');
      expect(report.currentLevel).toBe('Senior Analyst');
      expect(report.payPeriod).toBe('Jan 2024');
      expect(report.totalPayment).toBe(6225);
      expect(report.earnings.basicSalary).toBe(5000);
      expect(report.earnings.grossSalary).toBe(7500);
      expect(report.deductions.netSalary).toBe(6225);
    });
  });

  describe('generateSalariesRegisterReport', () => {
    it('should generate salaries register', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const report = await reportService.generateSalariesRegisterReport(startDate, endDate);

      expect(report.title).toBe('Salaries Register Report: Basic');
      expect(report.entries.length).toBeGreaterThanOrEqual(2);
      
      // Find our test entries
      const entry1 = report.entries.find(e => e.employeeId === 'EMP001');
      const entry2 = report.entries.find(e => e.employeeId === 'EMP002');
      
      expect(entry1).toBeDefined();
      expect(entry1?.basicSalary).toBe(5000);
      expect(entry1?.netSalary).toBe(6225);
      
      expect(entry2).toBeDefined();
      expect(entry2?.basicSalary).toBe(7000);
      expect(entry2?.netSalary).toBe(8985);
    });
  });
});
