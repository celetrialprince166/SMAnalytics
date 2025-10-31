/**
 * Company Settings Repository
 * 
 * Handles storage and retrieval of company settings
 */

import { storageService } from '../storage/LocalStorageService';
import { CompanySettings, UpdateCompanySettingsRequest } from '@/types';

class CompanySettingsRepository {
  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get company settings (singleton)
   */
  async getSettings(): Promise<CompanySettings | null> {
    const data = storageService.loadData();
    return data.companySettings || null;
  }

  /**
   * Initialize default company settings
   */
  async initializeSettings(): Promise<CompanySettings> {
    const defaultSettings: CompanySettings = {
      id: this.generateId(),
      companyName: 'SNM Analytics',
      address: '',
      city: '',
      country: 'Ghana',
      phone: '',
      email: '',
      website: '',
      logo: '',
      bankName: '',
      bankAccountNumber: '',
      bankSortCode: '',
      bankSwiftCode: '',
      vatRate: 15, // Default 15% VAT for Ghana
      vatRegistrationNumber: '',
      taxId: '',
      invoicePrefix: 'INV',
      invoiceNumberFormat: 'INV-YYYYMM-####',
      invoiceTermsDays: 30,
      invoiceFooterText: 'Thank you for your business!',
      fiscalYearStart: '01-01',
      baseCurrency: 'GHS',
      updatedAt: new Date(),
    };

    const data = storageService.loadData();
    data.companySettings = defaultSettings;
    storageService.saveData(data);

    return defaultSettings;
  }

  /**
   * Update company settings
   */
  async updateSettings(updates: UpdateCompanySettingsRequest): Promise<CompanySettings> {
    const data = storageService.loadData();
    let settings = data.companySettings;

    if (!settings) {
      settings = await this.initializeSettings();
    }

    // Update fields
    const updatedSettings: CompanySettings = {
      ...settings,
      ...updates,
      updatedAt: new Date(),
    };

    data.companySettings = updatedSettings;
    storageService.saveData(data);

    return updatedSettings;
  }

  /**
   * Get VAT rate
   */
  async getVatRate(): Promise<number> {
    const settings = await this.getSettings();
    return settings?.vatRate || 15;
  }

  /**
   * Get invoice settings
   */
  async getInvoiceSettings(): Promise<{
    prefix: string;
    format: string;
    termsDays: number;
    footerText: string;
  }> {
    const settings = await this.getSettings();
    return {
      prefix: settings?.invoicePrefix || 'INV',
      format: settings?.invoiceNumberFormat || 'INV-YYYYMM-####',
      termsDays: settings?.invoiceTermsDays || 30,
      footerText: settings?.invoiceFooterText || 'Thank you for your business!',
    };
  }

  /**
   * Get bank details
   */
  async getBankDetails(): Promise<{
    bankName: string;
    accountNumber: string;
    sortCode: string;
    swiftCode: string;
  }> {
    const settings = await this.getSettings();
    return {
      bankName: settings?.bankName || '',
      accountNumber: settings?.bankAccountNumber || '',
      sortCode: settings?.bankSortCode || '',
      swiftCode: settings?.bankSwiftCode || '',
    };
  }
}

export const companySettingsRepository = new CompanySettingsRepository();
