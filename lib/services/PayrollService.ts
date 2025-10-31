/**
 * Payroll Service
 * 
 * Business logic for payroll processing, tax calculations, and pension deductions
 */
import {
  TaxConfiguration,
  PensionConfiguration,
  SalaryEntry,
  Commission,
  CreateSalaryEntryRequest,
  CreateCommissionRequest,
  Employee,
} from '@/types';
import {
  taxConfigurationRepository,
  pensionConfigurationRepository,
  salaryEntryRepository,
  commissionRepository,
} from '../repositories/PayrollRepository';
import { employeeRepository } from '../repositories/EmployeeRepository';

export class PayrollService {
  private static instance: PayrollService;

  private constructor() {}

  public static getInstance(): PayrollService {
    if (!PayrollService.instance) {
      PayrollService.instance = new PayrollService();
    }
    return PayrollService.instance;
  }

  // ==================== Tax Configuration ====================

  async createTaxConfiguration(
    effectiveDate: Date,
    brackets: Array<{ order: number; amount: number; rate: number }>,
    nonResidentRate: number,
    personalRelief: number
  ): Promise<TaxConfiguration> {
    // Deactivate existing active configurations
    const existing = await taxConfigurationRepository.findActive();
    if (existing) {
      await taxConfigurationRepository.update(existing.id, { isActive: false });
    }

    const config = await taxConfigurationRepository.create({
      effectiveDate,
      brackets: brackets.map(b => ({
        id: `bracket-${Date.now()}-${b.order}`,
        ...b,
      })),
      nonResidentRate,
      personalRelief,
      isActive: true,
    });

    return config;
  }

  async getActiveTaxConfiguration(): Promise<TaxConfiguration | null> {
    return await taxConfigurationRepository.findActive();
  }

  async getTaxConfigurationHistory(): Promise<TaxConfiguration[]> {
    return await taxConfigurationRepository.getHistory();
  }

  // ==================== Pension Configuration ====================

  async createPensionConfiguration(data: {
    effectiveDate: Date;
    tier1EmployerRate: number;
    tier1EmployeeRate: number;
    tier1PensionRate: number;
    tier1NHISRate: number;
    tier2Rate: number;
    tier3EmployerRate: number;
    tier3EmployeeRate: number;
    tier3MaxAmount?: number;
  }): Promise<PensionConfiguration> {
    // Deactivate existing active configurations
    const existing = await pensionConfigurationRepository.findActive();
    if (existing) {
      await pensionConfigurationRepository.update(existing.id, { isActive: false });
    }

    const config = await pensionConfigurationRepository.create({
      ...data,
      isActive: true,
    });

    return config;
  }

  async getActivePensionConfiguration(): Promise<PensionConfiguration | null> {
    return await pensionConfigurationRepository.findActive();
  }

  async getPensionConfigurationHistory(): Promise<PensionConfiguration[]> {
    return await pensionConfigurationRepository.getHistory();
  }

  // ==================== Tax Calculations ====================

  calculateIncomeTax(
    grossSalary: number,
    taxConfig: TaxConfiguration,
    isResident: boolean = true
  ): number {
    if (!isResident) {
      return grossSalary * (taxConfig.nonResidentRate / 100);
    }

    let tax = 0;
    let remainingIncome = grossSalary;

    // Sort brackets by order
    const sortedBrackets = [...taxConfig.brackets].sort((a, b) => a.order - b.order);

    for (const bracket of sortedBrackets) {
      if (bracket.amount === 0) {
        // Last bracket - tax all remaining income
        tax += remainingIncome * (bracket.rate / 100);
        break;
      } else {
        // Tax up to bracket amount
        const taxableAmount = Math.min(remainingIncome, bracket.amount);
        tax += taxableAmount * (bracket.rate / 100);
        remainingIncome -= taxableAmount;

        if (remainingIncome <= 0) break;
      }
    }

    // Apply personal relief
    tax = Math.max(0, tax - taxConfig.personalRelief);

    return tax;
  }

  // ==================== Pension Calculations ====================

  calculatePensionDeductions(
    basicSalary: number,
    pensionConfig: PensionConfiguration
  ): {
    tier1Employee: number;
    tier1Employer: number;
    tier2: number;
    tier3Employee: number;
    tier3Employer: number;
    totalSSNIT: number;
  } {
    // Tier 1 calculations
    const tier1Employee = basicSalary * (pensionConfig.tier1EmployeeRate / 100);
    const tier1Employer = basicSalary * (pensionConfig.tier1EmployerRate / 100);

    // Tier 2 calculations
    const tier2 = basicSalary * (pensionConfig.tier2Rate / 100);

    // Tier 3 calculations
    let tier3Employee = basicSalary * (pensionConfig.tier3EmployeeRate / 100);
    let tier3Employer = basicSalary * (pensionConfig.tier3EmployerRate / 100);

    // Apply Tier 3 maximum if set
    if (pensionConfig.tier3MaxAmount) {
      tier3Employee = Math.min(tier3Employee, pensionConfig.tier3MaxAmount);
      tier3Employer = Math.min(tier3Employer, pensionConfig.tier3MaxAmount);
    }

    // Total SSNIT (Tier 1 + Tier 2)
    const totalSSNIT = tier1Employee + tier2;

    return {
      tier1Employee,
      tier1Employer,
      tier2,
      tier3Employee,
      tier3Employer,
      totalSSNIT,
    };
  }

  // ==================== Salary Processing ====================

  async processSalary(request: CreateSalaryEntryRequest): Promise<SalaryEntry> {
    // Get employee
    const employee = await employeeRepository.findById(request.employeeId);
    if (!employee) {
      throw new Error('Employee not found');
    }

    if (employee.status !== 'ACTIVE') {
      throw new Error('Cannot process salary for inactive employee');
    }

    // Get configurations
    const taxConfig = await this.getActiveTaxConfiguration();
    const pensionConfig = await this.getActivePensionConfiguration();

    if (!taxConfig) {
      throw new Error('No active tax configuration found');
    }

    if (!pensionConfig) {
      throw new Error('No active pension configuration found');
    }

    // Calculate earnings
    const basicSalary = employee.basicSalary;
    const allowances = request.allowances || 0;
    const commission = request.commission || 0;
    const grossSalary = basicSalary + allowances + commission;

    // Calculate pension deductions
    const pension = this.calculatePensionDeductions(basicSalary, pensionConfig);

    // Calculate income tax (on gross minus SSNIT)
    const taxableIncome = grossSalary - pension.totalSSNIT;
    const incomeTax = this.calculateIncomeTax(taxableIncome, taxConfig);

    // Calculate total deductions
    const otherDeductions = request.otherDeductions || 0;
    const totalDeductions =
      incomeTax +
      pension.tier1Employee +
      pension.tier2 +
      pension.tier3Employee +
      otherDeductions;

    // Calculate net salary
    const netSalary = grossSalary - totalDeductions;

    // Create salary entry
    const salaryEntry = await salaryEntryRepository.create({
      employeeId: request.employeeId,
      salaryDate: request.salaryDate,
      processedDate: new Date(),
      basicSalary,
      allowances,
      commission,
      grossSalary,
      incomeTax,
      tier1Employee: pension.tier1Employee,
      tier2: pension.tier2,
      tier3Employee: pension.tier3Employee,
      totalSSNIT: pension.totalSSNIT,
      otherDeductions,
      totalDeductions,
      netSalary,
      taxConfigId: taxConfig.id,
      pensionConfigId: pensionConfig.id,
      remarks: request.remarks,
    });

    return salaryEntry;
  }

  async getSalaryEntry(id: string): Promise<SalaryEntry | null> {
    return await salaryEntryRepository.findById(id);
  }

  async getEmployeeSalaryHistory(employeeId: string): Promise<SalaryEntry[]> {
    return await salaryEntryRepository.findByEmployee(employeeId);
  }

  async getSalariesByPeriod(startDate: Date, endDate: Date): Promise<SalaryEntry[]> {
    return await salaryEntryRepository.findByPeriod(startDate, endDate);
  }

  async getSalariesByMonth(year: number, month: number): Promise<SalaryEntry[]> {
    return await salaryEntryRepository.findByMonth(year, month);
  }

  async getTotalPayroll(startDate: Date, endDate: Date): Promise<number> {
    return await salaryEntryRepository.getTotalPayroll(startDate, endDate);
  }

  // ==================== Commission Management ====================

  async createCommission(request: CreateCommissionRequest): Promise<Commission> {
    const employee = await employeeRepository.findById(request.employeeId);
    if (!employee) {
      throw new Error('Employee not found');
    }

    const commission = await commissionRepository.create({
      ...request,
      isPaid: false,
    });

    return commission;
  }

  async getCommission(id: string): Promise<Commission | null> {
    return await commissionRepository.findById(id);
  }

  async getEmployeeCommissions(employeeId: string): Promise<Commission[]> {
    return await commissionRepository.findByEmployee(employeeId);
  }

  async getUnpaidCommissions(employeeId?: string): Promise<Commission[]> {
    return await commissionRepository.findUnpaid(employeeId);
  }

  async getPaidCommissions(employeeId?: string): Promise<Commission[]> {
    return await commissionRepository.findPaid(employeeId);
  }

  async getTotalUnpaidCommissions(employeeId?: string): Promise<number> {
    return await commissionRepository.getTotalUnpaidCommissions(employeeId);
  }

  async markCommissionAsPaid(
    commissionId: string,
    salaryEntryId: string
  ): Promise<Commission> {
    const commission = await commissionRepository.findById(commissionId);
    if (!commission) {
      throw new Error('Commission not found');
    }

    if (commission.isPaid) {
      throw new Error('Commission already paid');
    }

    return await commissionRepository.update(commissionId, {
      isPaid: true,
      paidDate: new Date(),
      salaryEntryId,
    });
  }

  // ==================== Payroll Reports ====================

  async getPayrollSummary(year: number, month: number): Promise<{
    totalEmployees: number;
    totalGrossSalary: number;
    totalDeductions: number;
    totalNetSalary: number;
    totalIncomeTax: number;
    totalSSNIT: number;
  }> {
    const salaries = await this.getSalariesByMonth(year, month);

    return {
      totalEmployees: salaries.length,
      totalGrossSalary: salaries.reduce((sum, s) => sum + s.grossSalary, 0),
      totalDeductions: salaries.reduce((sum, s) => sum + s.totalDeductions, 0),
      totalNetSalary: salaries.reduce((sum, s) => sum + s.netSalary, 0),
      totalIncomeTax: salaries.reduce((sum, s) => sum + s.incomeTax, 0),
      totalSSNIT: salaries.reduce((sum, s) => sum + s.totalSSNIT, 0),
    };
  }
}

// Export singleton instance
export const payrollService = PayrollService.getInstance();
