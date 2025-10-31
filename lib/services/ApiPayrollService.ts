/**
 * API Payroll Service
 * 
 * Service layer for payroll operations using API backend
 * Replaces local storage PayrollService with API-based implementation
 */
import {
  TaxConfiguration,
  PensionConfiguration,
  SalaryEntry,
  Commission,
  CreateSalaryEntryRequest,
  CreateCommissionRequest,
} from '@/types';

export class ApiPayrollService {
  private static instance: ApiPayrollService;
  private baseUrl = '/api/payroll';

  private constructor() {}

  public static getInstance(): ApiPayrollService {
    if (!ApiPayrollService.instance) {
      ApiPayrollService.instance = new ApiPayrollService();
    }
    return ApiPayrollService.instance;
  }

  // ==================== Tax Configuration ====================

  async getTaxConfigurations(): Promise<TaxConfiguration[]> {
    try {
      const response = await fetch(`${this.baseUrl}/tax-configurations`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch tax configurations: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching tax configurations:', error);
      throw error;
    }
  }

  async getActiveTaxConfiguration(): Promise<TaxConfiguration | null> {
    try {
      const response = await fetch(`${this.baseUrl}/tax-configurations/active`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Failed to fetch active tax configuration: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || null;
    } catch (error) {
      console.error('Error fetching active tax configuration:', error);
      throw error;
    }
  }

  async createTaxConfiguration(
    effectiveDate: Date,
    brackets: Array<{ order: number; amount: number; rate: number }>,
    nonResidentRate: number,
    personalRelief: number
  ): Promise<TaxConfiguration> {
    try {
      const response = await fetch(`${this.baseUrl}/tax-configurations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          effectiveDate: effectiveDate.toISOString(),
          brackets,
          nonResidentRate,
          personalRelief,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `Failed to create tax configuration: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error creating tax configuration:', error);
      throw error;
    }
  }

  async updateTaxConfiguration(id: string, updates: Partial<TaxConfiguration>): Promise<TaxConfiguration> {
    try {
      const response = await fetch(`${this.baseUrl}/tax-configurations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `Failed to update tax configuration: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error updating tax configuration:', error);
      throw error;
    }
  }

  async deleteTaxConfiguration(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/tax-configurations/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `Failed to delete tax configuration: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting tax configuration:', error);
      throw error;
    }
  }

  // ==================== Pension Configuration ====================

  async getPensionConfigurations(): Promise<PensionConfiguration[]> {
    try {
      const response = await fetch(`${this.baseUrl}/pension-configurations`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch pension configurations: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching pension configurations:', error);
      throw error;
    }
  }

  async getActivePensionConfiguration(): Promise<PensionConfiguration | null> {
    try {
      const response = await fetch(`${this.baseUrl}/pension-configurations/active`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Failed to fetch active pension configuration: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || null;
    } catch (error) {
      console.error('Error fetching active pension configuration:', error);
      throw error;
    }
  }

  async createPensionConfiguration(
    effectiveDate: Date,
    tier1EmployerRate: number,
    tier1EmployeeRate: number,
    tier1PensionRate: number,
    tier1NHISRate: number,
    tier2Rate: number,
    tier3EmployerRate: number,
    tier3EmployeeRate: number,
    tier3MaxAmount?: number
  ): Promise<PensionConfiguration> {
    try {
      const response = await fetch(`${this.baseUrl}/pension-configurations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          effectiveDate: effectiveDate.toISOString(),
          tier1EmployerRate,
          tier1EmployeeRate,
          tier1PensionRate,
          tier1NHISRate,
          tier2Rate,
          tier3EmployerRate,
          tier3EmployeeRate,
          tier3MaxAmount,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `Failed to create pension configuration: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error creating pension configuration:', error);
      throw error;
    }
  }

  async updatePensionConfiguration(id: string, updates: Partial<PensionConfiguration>): Promise<PensionConfiguration> {
    try {
      const response = await fetch(`${this.baseUrl}/pension-configurations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `Failed to update pension configuration: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error updating pension configuration:', error);
      throw error;
    }
  }

  async deletePensionConfiguration(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/pension-configurations/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `Failed to delete pension configuration: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting pension configuration:', error);
      throw error;
    }
  }

  // ==================== Tax Calculations ====================

  calculateIncomeTax(
    taxableIncome: number,
    taxConfig: TaxConfiguration,
    isGhanaian: boolean = true
  ): number {
    if (isGhanaian) {
      // Progressive tax calculation for Ghanaians
      let tax = 0;
      let remainingIncome = taxableIncome;

      // Sort brackets by order
      const sortedBrackets = [...taxConfig.brackets].sort((a, b) => a.order - b.order);

      for (const bracket of sortedBrackets) {
        if (remainingIncome <= 0) break;

        let bracketAmount = bracket.amount;
        
        // For the last bracket (remainder), use all remaining income
        if (bracket.order === sortedBrackets.length - 1) {
          bracketAmount = remainingIncome;
        } else {
          bracketAmount = Math.min(bracketAmount, remainingIncome);
        }

        tax += bracketAmount * (bracket.rate / 100);
        remainingIncome -= bracketAmount;
      }

      // Apply personal relief
      tax = Math.max(0, tax - taxConfig.personalRelief);
      
      return tax;
    } else {
      // Flat rate for non-residents
      return taxableIncome * (taxConfig.nonResidentRate / 100);
    }
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
    const tier1Employer = basicSalary * (pensionConfig.tier1EmployerRate / 100);
    const tier1Employee = basicSalary * (pensionConfig.tier1EmployeeRate / 100);

    // Tier 2 calculation
    const tier2 = basicSalary * (pensionConfig.tier2Rate / 100);

    // Tier 3 calculations (with optional maximum)
    let tier3Employee = basicSalary * (pensionConfig.tier3EmployeeRate / 100);
    let tier3Employer = basicSalary * (pensionConfig.tier3EmployerRate / 100);

    if (pensionConfig.tier3MaxAmount) {
      tier3Employee = Math.min(tier3Employee, pensionConfig.tier3MaxAmount);
      tier3Employer = Math.min(tier3Employer, pensionConfig.tier3MaxAmount);
    }

    // Total SSNIT (employee contributions only)
    const totalSSNIT = tier1Employee + tier2 + tier3Employee;

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
    try {
      const response = await fetch(`${this.baseUrl}/salaries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `Failed to process salary: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error processing salary:', error);
      throw error;
    }
  }

  async calculateSalary(request: CreateSalaryEntryRequest): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/salaries/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `Failed to calculate salary: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error calculating salary:', error);
      throw error;
    }
  }

  async getSalaryEntry(id: string): Promise<SalaryEntry | null> {
    try {
      const response = await fetch(`${this.baseUrl}/salaries/${id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Failed to fetch salary entry: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching salary entry:', error);
      throw error;
    }
  }

  async getSalaryEntries(filters?: {
    employeeId?: string;
    year?: number;
    month?: number;
    page?: number;
    limit?: number;
  }): Promise<{ salaries: SalaryEntry[]; pagination: any }> {
    try {
      const params = new URLSearchParams();
      if (filters?.employeeId) params.append('employeeId', filters.employeeId);
      if (filters?.year) params.append('year', filters.year.toString());
      if (filters?.month) params.append('month', filters.month.toString());
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const response = await fetch(`${this.baseUrl}/salaries?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch salary entries: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching salary entries:', error);
      throw error;
    }
  }

  // ==================== Commission Management ====================

  async getCommissions(filters?: {
    employeeId?: string;
    isPaid?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ commissions: Commission[]; pagination: any }> {
    try {
      const params = new URLSearchParams();
      if (filters?.employeeId) params.append('employeeId', filters.employeeId);
      if (filters?.isPaid !== undefined) params.append('isPaid', filters.isPaid.toString());
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const response = await fetch(`${this.baseUrl}/commissions?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch commissions: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching commissions:', error);
      throw error;
    }
  }

  async getUnpaidCommissions(employeeId?: string): Promise<{ commissions: Commission[]; summary: any }> {
    try {
      const params = new URLSearchParams();
      if (employeeId) params.append('employeeId', employeeId);

      const response = await fetch(`${this.baseUrl}/commissions/unpaid?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch unpaid commissions: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching unpaid commissions:', error);
      throw error;
    }
  }

  async getTotalUnpaidCommissions(employeeId?: string): Promise<number> {
    try {
      const result = await this.getUnpaidCommissions(employeeId);
      return result.summary.totalAmount;
    } catch (error) {
      console.error('Error fetching total unpaid commissions:', error);
      throw error;
    }
  }

  async createCommission(request: CreateCommissionRequest): Promise<Commission> {
    try {
      const response = await fetch(`${this.baseUrl}/commissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `Failed to create commission: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error creating commission:', error);
      throw error;
    }
  }

  async markCommissionAsPaid(commissionId: string, salaryEntryId?: string): Promise<Commission> {
    try {
      const response = await fetch(`${this.baseUrl}/commissions/${commissionId}/pay`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ salaryEntryId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `Failed to mark commission as paid: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error marking commission as paid:', error);
      throw error;
    }
  }

  // ==================== Salary Payments ====================

  /**
   * Get unpaid salary entries
   */
  async getUnpaidSalaries(employeeId?: string): Promise<SalaryEntry[]> {
    try {
      const url = employeeId 
        ? `${this.baseUrl}/salaries/unpaid?employeeId=${employeeId}`
        : `${this.baseUrl}/salaries/unpaid`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch unpaid salaries: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching unpaid salaries:', error);
      throw error;
    }
  }

  /**
   * Mark salary as paid
   */
  async paySalary(
    salaryId: string,
    paymentMethod: string = 'BANK_TRANSFER',
    paymentReference?: string
  ): Promise<SalaryEntry> {
    try {
      const response = await fetch(`${this.baseUrl}/salaries/${salaryId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethod,
          paymentReference,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `Failed to pay salary: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error paying salary:', error);
      throw error;
    }
  }

  /**
   * Pay multiple salaries at once
   */
  async payMultipleSalaries(
    salaryIds: string[],
    paymentMethod: string = 'BANK_TRANSFER',
    paymentReference?: string
  ): Promise<{ success: number; failed: number; errors: any[] }> {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as any[],
    };

    for (const salaryId of salaryIds) {
      try {
        await this.paySalary(salaryId, paymentMethod, paymentReference);
        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push({
          salaryId,
          error: error.message,
        });
      }
    }

    return results;
  }
}

// Export singleton instance
export const apiPayrollService = ApiPayrollService.getInstance();
