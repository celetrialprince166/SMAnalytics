/**
 * Taxation Service
 * 
 * Business logic for tax configuration management
 */

import { VATTaxConfiguration, WithholdingTaxConfiguration } from '@/types';
import { taxationRepository } from '../repositories/TaxationRepository';

export class TaxationService {
  private static instance: TaxationService;

  private constructor() {}

  public static getInstance(): TaxationService {
    if (!TaxationService.instance) {
      TaxationService.instance = new TaxationService();
    }
    return TaxationService.instance;
  }

  /**
   * Get current tax configuration
   */
  async getTaxConfiguration(): Promise<VATTaxConfiguration | null> {
    return await taxationRepository.getTaxConfiguration();
  }

  /**
   * Save tax configuration
   */
  async saveTaxConfiguration(
    config: Omit<VATTaxConfiguration, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<VATTaxConfiguration> {
    // Validate configuration
    this.validateTaxConfiguration(config);
    return await taxationRepository.saveTaxConfiguration(config);
  }

  /**
   * Get withholding tax configuration
   */
  async getWithholdingTaxConfiguration(): Promise<WithholdingTaxConfiguration | null> {
    return await taxationRepository.getWithholdingTaxConfiguration();
  }

  /**
   * Save withholding tax configuration
   */
  async saveWithholdingTaxConfiguration(
    config: Omit<WithholdingTaxConfiguration, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<WithholdingTaxConfiguration> {
    // Validate configuration
    this.validateWithholdingTaxConfiguration(config);
    return await taxationRepository.saveWithholdingTaxConfiguration(config);
  }

  /**
   * Validate tax configuration
   */
  private validateTaxConfiguration(config: Omit<VATTaxConfiguration, 'id' | 'createdAt' | 'updatedAt'>): void {
    const errors: string[] = [];

    if (config.nhil < 0 || config.nhil > 100) {
      errors.push('NHIL must be between 0 and 100');
    }

    if (config.getfund < 0 || config.getfund > 100) {
      errors.push('GETFund must be between 0 and 100');
    }

    if (config.covid19 < 0 || config.covid19 > 100) {
      errors.push('COVID-19 Levy must be between 0 and 100');
    }

    if (config.vat < 0 || config.vat > 100) {
      errors.push('VAT must be between 0 and 100');
    }

    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }
  }

  /**
   * Validate withholding tax configuration
   */
  private validateWithholdingTaxConfiguration(
    config: Omit<WithholdingTaxConfiguration, 'id' | 'createdAt' | 'updatedAt'>
  ): void {
    const errors: string[] = [];

    if (config.nonIndividualThreshold < 0) {
      errors.push('Non-individual threshold must be positive');
    }

    if (config.nonIndividualRate < 0 || config.nonIndividualRate > 100) {
      errors.push('Non-individual rate must be between 0 and 100');
    }

    if (config.individualRate < 0 || config.individualRate > 100) {
      errors.push('Individual rate must be between 0 and 100');
    }

    if (errors.length > 0) {
      throw new Error(errors.join(', '));
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
export const taxationService = TaxationService.getInstance();
