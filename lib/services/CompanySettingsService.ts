/**
 * Company Settings Service
 * 
 * Business logic for managing company settings
 */

import { companySettingsRepository } from '@/lib/repositories';
import { CompanySettings, UpdateCompanySettingsRequest } from '@/types';

class CompanySettingsService {
  /**
   * Get company settings
   */
  async getSettings(): Promise<CompanySettings> {
    let settings = await companySettingsRepository.getSettings();
    
    if (!settings) {
      settings = await companySettingsRepository.initializeSettings();
    }
    
    return settings;
  }

  /**
   * Update company settings
   */
  async updateSettings(updates: UpdateCompanySettingsRequest): Promise<CompanySettings> {
    return await companySettingsRepository.updateSettings(updates);
  }

  /**
   * Get VAT rate
   */
  async getVatRate(): Promise<number> {
    return await companySettingsRepository.getVatRate();
  }

  /**
   * Get invoice settings
   */
  async getInvoiceSettings() {
    return await companySettingsRepository.getInvoiceSettings();
  }

  /**
   * Get bank details
   */
  async getBankDetails() {
    return await companySettingsRepository.getBankDetails();
  }

  /**
   * Calculate VAT amount
   */
  calculateVat(amount: number, vatRate?: number): number {
    const rate = vatRate !== undefined ? vatRate : 15;
    return (amount * rate) / 100;
  }

  /**
   * Calculate total with VAT
   */
  calculateTotalWithVat(amount: number, vatRate?: number): number {
    const vatAmount = this.calculateVat(amount, vatRate);
    return amount + vatAmount;
  }

  /**
   * Generate invoice number
   */
  async generateInvoiceNumber(date: Date): Promise<string> {
    const { storageService } = await import('../storage/LocalStorageService');
    const settings = await this.getInvoiceSettings();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    
    // Get counter from metadata
    const data = storageService.loadData();
    const counter = (data.metadata.invoiceCounter || 0) + 1;
    
    // Update counter
    data.metadata.invoiceCounter = counter;
    storageService.saveData(data);
    
    // Format: INV-YYYYMM-####
    const number = String(counter).padStart(4, '0');
    return `${settings.prefix}-${year}${month}-${number}`;
  }

  /**
   * Calculate due date
   */
  async calculateDueDate(invoiceDate: Date): Promise<Date> {
    const settings = await this.getInvoiceSettings();
    const dueDate = new Date(invoiceDate);
    dueDate.setDate(dueDate.getDate() + settings.termsDays);
    return dueDate;
  }
}

export const companySettingsService = new CompanySettingsService();
