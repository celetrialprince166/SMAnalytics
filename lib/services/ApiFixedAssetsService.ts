/**
 * API-Based Fixed Assets Service
 * 
 * Business logic for fixed assets management using API routes
 * Replaces localStorage-based FixedAssetsService
 */

import {
  FixedAsset,
  DepreciationEntry,
  CreateFixedAssetRequest,
  UpdateFixedAssetRequest,
  FixedAssetFilters,
  FixedAssetSummary,
  DepreciationSchedule,
  AssetCategory,
} from '@/types';

export interface DisposalRequest {
  disposalDate: Date;
  disposalValue: number;
  bankAccountId: string;
  remarks?: string;
}

export interface DisposalResult {
  asset: FixedAsset;
  disposalValue: number;
  netBookValue: number;
  gainLoss: number;
  disposalDate: Date;
  bankAccountId: string;
  remarks: string | null;
}

export interface AssetTotals {
  totalCost: number;
  totalDepreciation: number;
  totalNetBookValue: number;
}

export class ApiFixedAssetsService {
  private static instance: ApiFixedAssetsService;
  private baseUrl = '/api/fixed-assets';

  private constructor() {}

  public static getInstance(): ApiFixedAssetsService {
    if (!ApiFixedAssetsService.instance) {
      ApiFixedAssetsService.instance = new ApiFixedAssetsService();
    }
    return ApiFixedAssetsService.instance;
  }

  /**
   * Helper method to make API requests
   */
  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: 'Request failed',
      }));
      throw new Error(error.message || error.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.data || data;
  }

  /**
   * Get all fixed assets with optional filters
   */
  async getFixedAssets(filters?: FixedAssetFilters): Promise<FixedAsset[]> {
    const params = new URLSearchParams();
    
    if (filters?.category) {
      params.append('category', filters.category);
    }
    if (filters?.status) {
      params.append('status', filters.status);
    }
    if (filters?.search) {
      params.append('search', filters.search);
    }
    
    const queryString = params.toString();
    const endpoint = queryString ? `?${queryString}` : '';
    
    return this.request<FixedAsset[]>(endpoint);
  }

  /**
   * Get fixed asset by ID
   */
  async getFixedAssetById(id: string): Promise<FixedAsset | null> {
    try {
      return await this.request<FixedAsset>(`/${id}`);
    } catch (error) {
      console.error('Error fetching fixed asset:', error);
      return null;
    }
  }

  /**
   * Create a new fixed asset
   */
  async createFixedAsset(request: CreateFixedAssetRequest): Promise<FixedAsset> {
    return this.request<FixedAsset>('', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Update a fixed asset
   */
  async updateFixedAsset(id: string, updates: UpdateFixedAssetRequest): Promise<FixedAsset> {
    return this.request<FixedAsset>(`/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  /**
   * Delete a fixed asset (soft delete)
   */
  async deleteFixedAsset(id: string): Promise<void> {
    await this.request(`/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * Dispose an asset
   */
  async disposeAsset(id: string, disposal: DisposalRequest): Promise<DisposalResult> {
    return this.request<DisposalResult>(`/${id}/dispose`, {
      method: 'POST',
      body: JSON.stringify({
        ...disposal,
        disposalDate: disposal.disposalDate.toISOString(),
      }),
    });
  }

  /**
   * Record depreciation for an asset
   */
  async recordDepreciation(assetId: string, period: Date): Promise<DepreciationEntry> {
    return this.request<DepreciationEntry>('/depreciation', {
      method: 'POST',
      body: JSON.stringify({
        assetId,
        period: period.toISOString(),
      }),
    });
  }

  /**
   * Get depreciation schedule for an asset
   */
  async getDepreciationSchedule(assetId: string): Promise<DepreciationSchedule> {
    return this.request<DepreciationSchedule>(`/depreciation?assetId=${assetId}`);
  }

  /**
   * Record batch depreciation for multiple assets
   */
  async recordBatchDepreciation(period: Date, assetIds: string[]): Promise<DepreciationEntry[]> {
    const results: DepreciationEntry[] = [];
    
    for (const assetId of assetIds) {
      try {
        const entry = await this.recordDepreciation(assetId, period);
        results.push(entry);
      } catch (error) {
        console.error(`Error recording depreciation for asset ${assetId}:`, error);
        // Continue with other assets
      }
    }
    
    return results;
  }

  /**
   * Get active fixed assets
   */
  async getActiveFixedAssets(): Promise<FixedAsset[]> {
    return this.getFixedAssets({ status: 'ACTIVE' });
  }

  /**
   * Get assets by category
   */
  async getAssetsByCategory(category: AssetCategory): Promise<FixedAsset[]> {
    return this.getFixedAssets({ category });
  }

  /**
   * Get assets by status
   */
  async getAssetsByStatus(status: 'ACTIVE' | 'DISPOSED' | 'UNDER_MAINTENANCE' | 'RETIRED'): Promise<FixedAsset[]> {
    return this.getFixedAssets({ status });
  }

  /**
   * Search fixed assets
   */
  async searchFixedAssets(query: string): Promise<FixedAsset[]> {
    return this.getFixedAssets({ search: query });
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
   * Get total values
   */
  async getTotalValues(): Promise<AssetTotals> {
    const assets = await this.getActiveFixedAssets();
    
    return {
      totalCost: assets.reduce((sum, asset) => sum + Number(asset.valueAtCost), 0),
      totalDepreciation: assets.reduce((sum, asset) => sum + Number(asset.accumulatedDepreciation), 0),
      totalNetBookValue: assets.reduce((sum, asset) => sum + Number(asset.netBookValue), 0),
    };
  }

  /**
   * Get non-current asset categories from secondary accounts
   * This is a placeholder - in production, this would fetch from the account hierarchy
   */
  async getNonCurrentAssetCategories(): Promise<Array<{id: string, name: string, code: string}>> {
    // For now, return the standard asset categories
    // In production, this would fetch from secondary accounts under "Non-Current Assets"
    return [
      { id: 'BUILDING', name: 'Buildings', code: 'BUILD' },
      { id: 'EQUIPMENT', name: 'Equipment', code: 'EQUIP' },
      { id: 'VEHICLE', name: 'Vehicles', code: 'VEH' },
      { id: 'FURNITURE', name: 'Furniture & Fixtures', code: 'FURN' },
      { id: 'LAND', name: 'Land', code: 'LAND' },
      { id: 'OTHER', name: 'Other Assets', code: 'OTHER' },
    ];
  }
}

// Export singleton instance
export const apiFixedAssetsService = ApiFixedAssetsService.getInstance();
