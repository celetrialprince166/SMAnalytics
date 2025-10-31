/**
 * Taxation Repository
 * 
 * Data access layer for tax configuration
 */

import { VATTaxConfiguration, WithholdingTaxConfiguration } from '@/types';
import { storageService } from '../storage/LocalStorageService';

export class TaxationRepository {
  private static instance: TaxationRepository;

  private constructor() {}

  public static getInstance(): TaxationRepository {
    if (!TaxationRepository.instance) {
      TaxationRepository.instance = new TaxationRepository();
    }
    return TaxationRepository.instance;
  }

  async getTaxConfiguration(): Promise<VATTaxConfiguration | null> {
    const data = storageService.getData('taxation');
    return data.config || null;
  }

  async saveTaxConfiguration(config: Omit<VATTaxConfiguration, 'id' | 'createdAt' | 'updatedAt'>): Promise<VATTaxConfiguration> {
    const data = storageService.getData('taxation');
    const now = new Date();
    
    const taxConfig: VATTaxConfiguration = {
      id: data.config?.id || 'tax-config-1',
      ...config,
      createdAt: data.config?.createdAt || now,
      updatedAt: now,
    };

    data.config = taxConfig;
    storageService.updateData('taxation', data);
    return taxConfig;
  }

  async getWithholdingTaxConfiguration(): Promise<WithholdingTaxConfiguration | null> {
    const data = storageService.getData('taxation');
    return data.withholdingTax || null;
  }

  async saveWithholdingTaxConfiguration(
    config: Omit<WithholdingTaxConfiguration, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<WithholdingTaxConfiguration> {
    const data = storageService.getData('taxation');
    const now = new Date();
    
    const withholdingConfig: WithholdingTaxConfiguration = {
      id: data.withholdingTax?.id || 'withholding-tax-1',
      ...config,
      createdAt: data.withholdingTax?.createdAt || now,
      updatedAt: now,
    };

    data.withholdingTax = withholdingConfig;
    storageService.updateData('taxation', data);
    return withholdingConfig;
  }
}

export const taxationRepository = TaxationRepository.getInstance();
