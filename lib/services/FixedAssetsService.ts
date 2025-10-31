/**
 * Fixed Assets Service (DEPRECATED)
 * 
 * @deprecated This service has been replaced by ApiFixedAssetsService.
 * Use @/lib/services/ApiFixedAssetsService instead.
 * 
 * This file is kept for reference only and should not be used in new code.
 * Migration completed: October 27, 2025
 * 
 * Business logic for fixed assets management and depreciation calculations
 */
import {
  FixedAsset,
  DepreciationEntry,
  CreateFixedAssetRequest,
  UpdateFixedAssetRequest,
  FixedAssetFilters,
  FixedAssetSummary,
  DepreciationSchedule,
} from '@/types';
import {
  fixedAssetRepository,
  depreciationEntryRepository,
} from '../repositories/FixedAssetsRepository';

export class FixedAssetsService {
  private static instance: FixedAssetsService;

  private constructor() {}

  public static getInstance(): FixedAssetsService {
    if (!FixedAssetsService.instance) {
      FixedAssetsService.instance = new FixedAssetsService();
    }
    return FixedAssetsService.instance;
  }

  /**
   * Create a new fixed asset
   */
  async createFixedAsset(request: CreateFixedAssetRequest): Promise<FixedAsset> {
    // Validate
    const validation = this.validateFixedAsset(request);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    // Generate asset code
    const assetCode = await fixedAssetRepository.getNextAssetCode();

    // Calculate initial values
    const netBookValue = request.valueAtCost; // Initially, no depreciation has been recorded

    const asset = await fixedAssetRepository.create({
      assetCode,
      acquisitionDate: request.acquisitionDate,
      referenceNumber: request.referenceNumber?.trim(),
      category: request.category,
      assetClass: request.assetClass?.trim(),
      description: request.description.trim(),
      valueAtCost: request.valueAtCost,
      usefulLife: request.usefulLife,
      depreciationRate: request.depreciationRate,
      depreciationType: request.depreciationType,
      residualValue: request.residualValue,
      primaryAccountId: request.primaryAccountId,
      secondaryAccountId: request.secondaryAccountId,
      holderAccountId: request.holderAccountId,
      status: request.status || 'ACTIVE',
      remarks: request.remarks?.trim(),
      accumulatedDepreciation: 0,
      netBookValue: netBookValue,
      isActive: true,
    });

    return asset;
  }

  /**
   * Update a fixed asset
   */
  async updateFixedAsset(id: string, updates: UpdateFixedAssetRequest): Promise<FixedAsset> {
    const existing = await fixedAssetRepository.findById(id);
    if (!existing) {
      throw new Error('Fixed asset not found');
    }

    // Validate updates if critical fields are being changed
    if (updates.description || updates.valueAtCost !== undefined) {
      const validation = this.validateFixedAsset({
        ...existing,
        ...updates,
      } as CreateFixedAssetRequest);
      
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }
    }

    // Recalculate net book value if cost or residual value changed
    let netBookValue = existing.netBookValue;
    if (updates.valueAtCost !== undefined || updates.residualValue !== undefined) {
      const newCost = updates.valueAtCost ?? existing.valueAtCost;
      const newResidual = updates.residualValue ?? existing.residualValue;
      netBookValue = newCost - existing.accumulatedDepreciation;
      if (netBookValue < newResidual) {
        netBookValue = newResidual;
      }
    }

    return await fixedAssetRepository.update(id, {
      ...updates,
      netBookValue,
    });
  }

  /**
   * Delete a fixed asset (soft delete)
   */
  async deleteFixedAsset(id: string): Promise<void> {
    const asset = await fixedAssetRepository.findById(id);
    if (!asset) {
      throw new Error('Fixed asset not found');
    }

    // Soft delete by setting isActive to false
    await fixedAssetRepository.update(id, { isActive: false });
  }

  /**
   * Get fixed asset by ID
   */
  async getFixedAssetById(id: string): Promise<FixedAsset | null> {
    return await fixedAssetRepository.findById(id);
  }

  /**
   * Get fixed asset by asset code
   */
  async getFixedAssetByCode(assetCode: string): Promise<FixedAsset | null> {
    return await fixedAssetRepository.findByAssetCode(assetCode);
  }

  /**
   * Get all fixed assets
   */
  async getFixedAssets(): Promise<FixedAsset[]> {
    return await fixedAssetRepository.findAll();
  }

  /**
   * Get active fixed assets
   */
  async getActiveFixedAssets(): Promise<FixedAsset[]> {
    return await fixedAssetRepository.findActive();
  }

  /**
   * Search fixed assets with filters
   */
  async searchFixedAssets(filters: FixedAssetFilters): Promise<FixedAsset[]> {
    return await fixedAssetRepository.search(filters);
  }

  /**
   * Get fixed asset summaries for display
   */
  async getFixedAssetSummaries(): Promise<FixedAssetSummary[]> {
    const assets = await this.getActiveFixedAssets();
    
    return assets.map(asset => ({
      id: asset.id,
      assetCode: asset.assetCode,
      description: asset.description,
      category: asset.category,
      acquisitionDate: asset.acquisitionDate,
      valueAtCost: asset.valueAtCost,
      accumulatedDepreciation: asset.accumulatedDepreciation,
      netBookValue: asset.netBookValue,
      status: asset.status,
    }));
  }

  /**
   * Get assets by category
   */
  async getAssetsByCategory(category: string): Promise<FixedAsset[]> {
    return await fixedAssetRepository.findByCategory(category);
  }

  /**
   * Get assets by status
   */
  async getAssetsByStatus(status: string): Promise<FixedAsset[]> {
    return await fixedAssetRepository.findByStatus(status);
  }

  /**
   * Calculate monthly depreciation for an asset
   */
  calculateMonthlyDepreciation(asset: FixedAsset): number {
    const depreciableAmount = asset.valueAtCost - asset.residualValue;
    
    switch (asset.depreciationType) {
      case 'STRAIGHT_LINE':
        // Annual depreciation / 12 months
        const annualDepreciation = depreciableAmount / asset.usefulLife;
        return annualDepreciation / 12;
        
      case 'DECLINING_BALANCE':
        // Declining balance method
        const currentBookValue = asset.netBookValue;
        const monthlyRate = asset.depreciationRate / 100 / 12;
        return currentBookValue * monthlyRate;
        
      case 'UNITS_OF_PRODUCTION':
        // Would need units produced data - default to straight line
        return (depreciableAmount / asset.usefulLife) / 12;
        
      default:
        return 0;
    }
  }

  /**
   * Record depreciation for an asset
   */
  async recordDepreciation(assetId: string, period: Date): Promise<DepreciationEntry> {
    const asset = await fixedAssetRepository.findById(assetId);
    if (!asset) {
      throw new Error('Fixed asset not found');
    }

    if (asset.status !== 'ACTIVE') {
      throw new Error('Cannot depreciate inactive asset');
    }

    // Calculate depreciation
    const depreciationAmount = this.calculateMonthlyDepreciation(asset);
    const newAccumulatedDepreciation = asset.accumulatedDepreciation + depreciationAmount;
    const newNetBookValue = asset.valueAtCost - newAccumulatedDepreciation;

    // Ensure net book value doesn't go below residual value
    const finalNetBookValue = Math.max(newNetBookValue, asset.residualValue);
    const finalAccumulatedDepreciation = asset.valueAtCost - finalNetBookValue;
    const finalDepreciationAmount = finalAccumulatedDepreciation - asset.accumulatedDepreciation;

    // Create depreciation entry
    const entry = await depreciationEntryRepository.create({
      assetId,
      period,
      depreciationAmount: finalDepreciationAmount,
      accumulatedDepreciation: finalAccumulatedDepreciation,
      netBookValue: finalNetBookValue,
    });

    // Update asset
    await fixedAssetRepository.update(assetId, {
      accumulatedDepreciation: finalAccumulatedDepreciation,
      netBookValue: finalNetBookValue,
    });

    return entry;
  }

  /**
   * Get depreciation schedule for an asset
   */
  async getDepreciationSchedule(assetId: string): Promise<DepreciationSchedule> {
    const asset = await fixedAssetRepository.findById(assetId);
    if (!asset) {
      throw new Error('Fixed asset not found');
    }

    const entries = await depreciationEntryRepository.findByAsset(assetId);

    return {
      assetId: asset.id,
      assetCode: asset.assetCode,
      description: asset.description,
      entries: entries.map(e => ({
        period: e.period,
        depreciationAmount: e.depreciationAmount,
        accumulatedDepreciation: e.accumulatedDepreciation,
        netBookValue: e.netBookValue,
      })),
    };
  }

  /**
   * Get total asset values
   */
  async getTotalValues(): Promise<{
    totalCost: number;
    totalDepreciation: number;
    totalNetBookValue: number;
  }> {
    const [totalCost, totalDepreciation, totalNetBookValue] = await Promise.all([
      fixedAssetRepository.getTotalValue(),
      fixedAssetRepository.getTotalDepreciation(),
      fixedAssetRepository.getTotalNetBookValue(),
    ]);

    return {
      totalCost,
      totalDepreciation,
      totalNetBookValue,
    };
  }

  /**
   * Validate fixed asset data
   */
  private validateFixedAsset(data: CreateFixedAssetRequest): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!data.description || data.description.trim().length === 0) {
      errors.push('Asset description is required');
    }

    if (!data.category) {
      errors.push('Asset category is required');
    }

    if (!data.acquisitionDate) {
      errors.push('Acquisition date is required');
    }

    if (data.valueAtCost === undefined || data.valueAtCost <= 0) {
      errors.push('Value at cost must be greater than zero');
    }

    if (data.usefulLife === undefined || data.usefulLife <= 0) {
      errors.push('Useful life must be greater than zero');
    }

    if (data.depreciationRate === undefined || data.depreciationRate < 0 || data.depreciationRate > 100) {
      errors.push('Depreciation rate must be between 0 and 100');
    }

    if (data.residualValue < 0) {
      errors.push('Residual value cannot be negative');
    }

    if (data.residualValue >= data.valueAtCost) {
      errors.push('Residual value must be less than value at cost');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

// Export singleton instance
export const fixedAssetsService = FixedAssetsService.getInstance();
