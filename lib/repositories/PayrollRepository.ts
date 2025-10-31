/**
 * Payroll Repository
 * 
 * Data access layer for payroll, tax, pension, and salary management
 */
import {
  TaxConfiguration,
  PensionConfiguration,
  SalaryEntry,
  Commission,
} from '@/types';
import { BaseRepository } from './BaseRepository';

export class TaxConfigurationRepository extends BaseRepository<TaxConfiguration> {
  protected storageKey = 'taxConfigurations' as const;

  async findActive(): Promise<TaxConfiguration | null> {
    const configs = this.getAll();
    const activeConfigs = configs
      .filter(c => c.isActive)
      .sort((a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime());
    
    return activeConfigs.length > 0 ? activeConfigs[0] : null;
  }

  async findByEffectiveDate(date: Date): Promise<TaxConfiguration | null> {
    const configs = this.getAll();
    const targetDate = new Date(date).getTime();
    
    const validConfigs = configs
      .filter(c => new Date(c.effectiveDate).getTime() <= targetDate)
      .sort((a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime());
    
    return validConfigs.length > 0 ? validConfigs[0] : null;
  }

  async getHistory(): Promise<TaxConfiguration[]> {
    const configs = this.getAll();
    return configs.sort((a, b) => 
      new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime()
    );
  }
}

export class PensionConfigurationRepository extends BaseRepository<PensionConfiguration> {
  protected storageKey = 'pensionConfigurations' as const;

  async findActive(): Promise<PensionConfiguration | null> {
    const configs = this.getAll();
    const activeConfigs = configs
      .filter(c => c.isActive)
      .sort((a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime());
    
    return activeConfigs.length > 0 ? activeConfigs[0] : null;
  }

  async findByEffectiveDate(date: Date): Promise<PensionConfiguration | null> {
    const configs = this.getAll();
    const targetDate = new Date(date).getTime();
    
    const validConfigs = configs
      .filter(c => new Date(c.effectiveDate).getTime() <= targetDate)
      .sort((a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime());
    
    return validConfigs.length > 0 ? validConfigs[0] : null;
  }

  async getHistory(): Promise<PensionConfiguration[]> {
    const configs = this.getAll();
    return configs.sort((a, b) => 
      new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime()
    );
  }
}

export class SalaryEntryRepository extends BaseRepository<SalaryEntry> {
  protected storageKey = 'salaryEntries' as const;

  async findByEmployee(employeeId: string): Promise<SalaryEntry[]> {
    const entries = this.getAll();
    return entries
      .filter(e => e.employeeId === employeeId)
      .sort((a, b) => new Date(b.salaryDate).getTime() - new Date(a.salaryDate).getTime());
  }

  async findByPeriod(startDate: Date, endDate: Date): Promise<SalaryEntry[]> {
    const entries = this.getAll();
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    
    return entries.filter(e => {
      const entryDate = new Date(e.salaryDate).getTime();
      return entryDate >= start && entryDate <= end;
    });
  }

  async findByMonth(year: number, month: number): Promise<SalaryEntry[]> {
    const entries = this.getAll();
    return entries.filter(e => {
      const entryDate = new Date(e.salaryDate);
      // month parameter is 1-based (1=January), getMonth() returns 0-based (0=January)
      return entryDate.getFullYear() === year && entryDate.getMonth() === month - 1;
    });
  }

  async getLatestEntry(employeeId: string): Promise<SalaryEntry | null> {
    const entries = await this.findByEmployee(employeeId);
    return entries.length > 0 ? entries[0] : null;
  }

  async getTotalPayroll(startDate: Date, endDate: Date): Promise<number> {
    const entries = await this.findByPeriod(startDate, endDate);
    return entries.reduce((sum, entry) => sum + entry.netSalary, 0);
  }
}

export class CommissionRepository extends BaseRepository<Commission> {
  protected storageKey = 'commissions' as const;

  async findAll(): Promise<Commission[]> {
    return this.getAll();
  }

  async findByEmployee(employeeId: string): Promise<Commission[]> {
    const commissions = this.getAll();
    return commissions
      .filter(c => c.employeeId === employeeId)
      .sort((a, b) => new Date(b.commissionDate).getTime() - new Date(a.commissionDate).getTime());
  }

  async findUnpaid(employeeId?: string): Promise<Commission[]> {
    const commissions = this.getAll();
    let filtered = commissions.filter(c => !c.isPaid);
    
    if (employeeId) {
      filtered = filtered.filter(c => c.employeeId === employeeId);
    }
    
    return filtered.sort((a, b) => 
      new Date(a.commissionDate).getTime() - new Date(b.commissionDate).getTime()
    );
  }

  async findPaid(employeeId?: string): Promise<Commission[]> {
    const commissions = this.getAll();
    let filtered = commissions.filter(c => c.isPaid);
    
    if (employeeId) {
      filtered = filtered.filter(c => c.employeeId === employeeId);
    }
    
    return filtered.sort((a, b) => 
      new Date(b.paidDate!).getTime() - new Date(a.paidDate!).getTime()
    );
  }

  async getTotalUnpaidCommissions(employeeId?: string): Promise<number> {
    const unpaid = await this.findUnpaid(employeeId);
    return unpaid.reduce((sum, commission) => sum + commission.amount, 0);
  }
}

// Export singleton instances
export const taxConfigurationRepository = new TaxConfigurationRepository();
export const pensionConfigurationRepository = new PensionConfigurationRepository();
export const salaryEntryRepository = new SalaryEntryRepository();
export const commissionRepository = new CommissionRepository();
