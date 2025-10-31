/**
 * API Taxation Service
 * 
 * Business logic for tax configuration management using API endpoints
 */

import { VATTaxConfiguration, WithholdingTaxConfiguration } from '@/types';

export class ApiTaxationService {
  private static instance: ApiTaxationService;
  private baseUrl = '/api/taxation';

  private constructor() {}

  public static getInstance(): ApiTaxationService {
    if (!ApiTaxationService.instance) {
      ApiTaxationService.instance = new ApiTaxationService();
    }
    return ApiTaxationService.instance;
  }

  /**
   * Get current VAT tax configuration
   */
  async getTaxConfiguration(): Promise<VATTaxConfiguration | null> {
    try {
      const response = await fetch(`${this.baseUrl}/vat-configuration`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch VAT tax configuration: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || null;
    } catch (error) {
      console.error('Error fetching VAT tax configuration:', error);
      throw error;
    }
  }

  /**
   * Save VAT tax configuration
   */
  async saveTaxConfiguration(
    config: Omit<VATTaxConfiguration, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<VATTaxConfiguration> {
    try {
      const response = await fetch(`${this.baseUrl}/vat-configuration`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to save VAT tax configuration: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error saving VAT tax configuration:', error);
      throw error;
    }
  }

  /**
   * Get withholding tax configuration
   */
  async getWithholdingTaxConfiguration(): Promise<WithholdingTaxConfiguration | null> {
    try {
      const response = await fetch(`${this.baseUrl}/withholding-tax-configuration`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch withholding tax configuration: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || null;
    } catch (error) {
      console.error('Error fetching withholding tax configuration:', error);
      throw error;
    }
  }

  /**
   * Save withholding tax configuration
   */
  async saveWithholdingTaxConfiguration(
    config: Omit<WithholdingTaxConfiguration, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<WithholdingTaxConfiguration> {
    try {
      const response = await fetch(`${this.baseUrl}/withholding-tax-configuration`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to save withholding tax configuration: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error saving withholding tax configuration:', error);
      throw error;
    }
  }

  /**
   * Calculate VAT amount
   */
  calculateVAT(amount: number, includeNHIL: boolean = true, includeGETFL: boolean = true, includeCOVID: boolean = true): {
    vat: number;
    nhil: number;
    getfl: number;
    covid19: number;
    total: number;
  } {
    // This would use the stored configuration
    // For now, using default rates
    const vatRate = 0.125; // 12.5%
    const nhilRate = includeNHIL ? 0.025 : 0; // 2.5%
    const getflRate = includeGETFL ? 0.025 : 0; // 2.5%
    const covidRate = includeCOVID ? 0.01 : 0; // 1%

    const vat = amount * vatRate;
    const nhil = amount * nhilRate;
    const getfl = amount * getflRate;
    const covid19 = amount * covidRate;
    const total = vat + nhil + getfl + covid19;

    return { vat, nhil, getfl, covid19, total };
  }
}

// Export singleton instance
export const apiTaxationService = ApiTaxationService.getInstance();

