/**
 * Fixed Assets Types
 * 
 * Types for fixed assets management and depreciation tracking
 */

export type AssetCategory = 'BUILDING' | 'EQUIPMENT' | 'VEHICLE' | 'FURNITURE' | 'LAND' | 'OTHER';
export type DepreciationType = 'STRAIGHT_LINE' | 'DECLINING_BALANCE' | 'UNITS_OF_PRODUCTION';
export type AssetStatus = 'ACTIVE' | 'DISPOSED' | 'UNDER_MAINTENANCE' | 'RETIRED';

export interface FixedAsset {
  id: string;
  assetCode: string; // Auto-generated (FA-0001, FA-0002, etc.)
  acquisitionDate: Date;
  referenceNumber?: string;
  
  // Asset Details
  category: AssetCategory;
  assetClass?: string;
  description: string;
  valueAtCost: number;
  usefulLife: number; // in years
  depreciationRate: number; // percentage
  depreciationType: DepreciationType;
  residualValue: number;
  
  // Accounting
  primaryAccountId?: string;
  secondaryAccountId?: string;
  holderAccountId?: string;
  
  // Status
  status: AssetStatus;
  remarks?: string;
  
  // Calculated fields
  accumulatedDepreciation: number;
  netBookValue: number;
  
  // Metadata
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

export interface DepreciationEntry {
  id: string;
  assetId: string;
  period: Date; // Month/Year of depreciation
  depreciationAmount: number;
  accumulatedDepreciation: number;
  netBookValue: number;
  createdAt: Date;
}

export interface CreateFixedAssetRequest {
  acquisitionDate: Date;
  referenceNumber?: string;
  category: AssetCategory;
  assetClass?: string;
  description: string;
  valueAtCost: number;
  usefulLife: number;
  depreciationRate: number;
  depreciationType: DepreciationType;
  residualValue: number;
  primaryAccountId?: string;
  secondaryAccountId?: string;
  holderAccountId?: string;
  status?: AssetStatus;
  remarks?: string;
}

export interface UpdateFixedAssetRequest {
  acquisitionDate?: Date;
  referenceNumber?: string;
  category?: AssetCategory;
  assetClass?: string;
  description?: string;
  valueAtCost?: number;
  usefulLife?: number;
  depreciationRate?: number;
  depreciationType?: DepreciationType;
  residualValue?: number;
  primaryAccountId?: string;
  secondaryAccountId?: string;
  holderAccountId?: string;
  status?: AssetStatus;
  remarks?: string;
  isActive?: boolean;
}

export interface FixedAssetSummary {
  id: string;
  assetCode: string;
  description: string;
  category: string;
  acquisitionDate: Date;
  valueAtCost: number;
  accumulatedDepreciation: number;
  netBookValue: number;
  status: string;
}

export interface FixedAssetFilters {
  search?: string;
  category?: AssetCategory;
  status?: AssetStatus;
  acquisitionDateFrom?: Date;
  acquisitionDateTo?: Date;
}

export interface DepreciationSchedule {
  assetId: string;
  assetCode: string;
  description: string;
  entries: {
    period: Date;
    depreciationAmount: number;
    accumulatedDepreciation: number;
    netBookValue: number;
  }[];
}
