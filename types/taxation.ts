/**
 * Taxation Types
 * 
 * Types for VAT and withholding tax management
 */

export interface VATTaxConfiguration {
  id: string;
  nhil: number; // National Health Insurance Levy
  getfund: number; // GETFund Levy
  covid19: number; // COVID-19 Levy
  vat: number; // Value Added Tax
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

export interface WithholdingTaxConfiguration {
  id: string;
  // From persons other than individuals
  nonIndividualThreshold: number;
  nonIndividualRate: number;
  // From individuals
  individualRate: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

export interface CreateVATTaxConfigurationRequest {
  nhil: number;
  getfund: number;
  covid19: number;
  vat: number;
}

export interface UpdateVATTaxConfigurationRequest {
  nhil?: number;
  getfund?: number;
  covid19?: number;
  vat?: number;
}

export interface CreateWithholdingTaxRequest {
  nonIndividualThreshold: number;
  nonIndividualRate: number;
  individualRate: number;
}

export interface UpdateWithholdingTaxRequest {
  nonIndividualThreshold?: number;
  nonIndividualRate?: number;
  individualRate?: number;
}
