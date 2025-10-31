/**
 * Fixed Assets Repository
 * 
 * Data access layer for fixed assets and depreciation management
 */
import { FixedAsset, DepreciationEntry, FixedAssetFilters } from '@/types';
import { BaseRepository } from './BaseRepository';

export class FixedAssetRepository extends BaseRepository<FixedAsset> {
  protected storageKey = 'fixedAssets' as const;

  async findByAssetCode(assetCode: string): Promise<FixedAsset | null> {
    const assets = this.getAll();
    return assets.find(a => a.assetCode === assetCode) || null;
  }

  async findByCategory(category: string): Promise<FixedAsset[]> {
    const assets = this.getAll();
    return assets.filter(a => a.category === category);
  }

  async findByStatus(status: string): Promise<FixedAsset[]> {
    const assets = this.getAll();
    return assets.filter(a => a.status === status);
  }

  async findActive(): Promise<FixedAsset[]> {
    const assets = this.getAll();
    return assets.filter(a => a.isActive);
  }

  async search(filters: FixedAssetFilters): Promise<FixedAsset[]> {
    let assets = this.getAll();

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      assets = assets.filter(a =>
        a.assetCode.toLowerCase().includes(searchTerm) ||
        a.description.toLowerCase().includes(searchTerm) ||
        a.referenceNumber?.toLowerCase().includes(searchTerm)
      );
    }

    if (filters.category) {
      assets = assets.filter(a => a.category === filters.category);
    }

    if (filters.status) {
      assets = assets.filter(a => a.status === filters.status);
    }

    if (filters.acquisitionDateFrom) {
      assets = assets.filter(a => 
        new Date(a.acquisitionDate) >= filters.acquisitionDateFrom!
      );
    }

    if (filters.acquisitionDateTo) {
      assets = assets.filter(a => 
        new Date(a.acquisitionDate) <= filters.acquisitionDateTo!
      );
    }

    return assets;
  }

  async getNextAssetCode(): Promise<string> {
    const assets = this.getAll();
    const maxNumber = assets.reduce((max, asset) => {
      const match = asset.assetCode.match(/FA-(\d+)/);
      if (match) {
        const num = parseInt(match[1]);
        return num > max ? num : max;
      }
      return max;
    }, 0);

    return `FA-${String(maxNumber + 1).padStart(4, '0')}`;
  }

  async getTotalValue(): Promise<number> {
    const assets = this.getAll();
    return assets
      .filter(a => a.isActive && a.status === 'ACTIVE')
      .reduce((sum, asset) => sum + asset.valueAtCost, 0);
  }

  async getTotalDepreciation(): Promise<number> {
    const assets = this.getAll();
    return assets
      .filter(a => a.isActive && a.status === 'ACTIVE')
      .reduce((sum, asset) => sum + asset.accumulatedDepreciation, 0);
  }

  async getTotalNetBookValue(): Promise<number> {
    const assets = this.getAll();
    return assets
      .filter(a => a.isActive && a.status === 'ACTIVE')
      .reduce((sum, asset) => sum + asset.netBookValue, 0);
  }
}

export class DepreciationEntryRepository extends BaseRepository<DepreciationEntry> {
  protected storageKey = 'depreciationEntries' as const;

  async findByAsset(assetId: string): Promise<DepreciationEntry[]> {
    const entries = this.getAll();
    return entries
      .filter(e => e.assetId === assetId)
      .sort((a, b) => new Date(a.period).getTime() - new Date(b.period).getTime());
  }

  async findByPeriod(period: Date): Promise<DepreciationEntry[]> {
    const entries = this.getAll();
    const targetMonth = new Date(period).getMonth();
    const targetYear = new Date(period).getFullYear();
    
    return entries.filter(e => {
      const entryDate = new Date(e.period);
      return entryDate.getMonth() === targetMonth && 
             entryDate.getFullYear() === targetYear;
    });
  }

  async getLatestEntry(assetId: string): Promise<DepreciationEntry | null> {
    const entries = await this.findByAsset(assetId);
    return entries.length > 0 ? entries[entries.length - 1] : null;
  }
}

// Export singleton instances
export const fixedAssetRepository = new FixedAssetRepository();
export const depreciationEntryRepository = new DepreciationEntryRepository();
