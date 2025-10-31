/**
 * Fixed Assets Service Tests
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { fixedAssetsService } from '../FixedAssetsService';

describe('FixedAssetsService', () => {
  beforeEach(() => {
    // Clear storage before each test
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
  });

  describe('Asset Creation', () => {
    it('should create a fixed asset with auto-generated code', async () => {
      const request = {
        acquisitionDate: new Date('2024-01-15'),
        category: 'EQUIPMENT' as const,
        description: 'Dell Laptop Computer',
        valueAtCost: 5000,
        usefulLife: 5,
        depreciationRate: 20,
        depreciationType: 'STRAIGHT_LINE' as const,
        residualValue: 500,
        status: 'ACTIVE' as const,
      };

      const asset = await fixedAssetsService.createFixedAsset(request);

      expect(asset).toBeDefined();
      expect(asset.assetCode).toMatch(/FA-\d{4}/);
      expect(asset.description).toBe('Dell Laptop Computer');
      expect(asset.valueAtCost).toBe(5000);
      expect(asset.netBookValue).toBe(5000); // Initially equals valueAtCost (no depreciation yet)
      expect(asset.accumulatedDepreciation).toBe(0);
      expect(asset.isActive).toBe(true);
    });

    it('should generate sequential asset codes', async () => {
      const asset1 = await fixedAssetsService.createFixedAsset({
        acquisitionDate: new Date(),
        category: 'EQUIPMENT',
        description: 'Asset 1',
        valueAtCost: 1000,
        usefulLife: 5,
        depreciationRate: 20,
        depreciationType: 'STRAIGHT_LINE',
        residualValue: 100,
      });

      const asset2 = await fixedAssetsService.createFixedAsset({
        acquisitionDate: new Date(),
        category: 'VEHICLE',
        description: 'Asset 2',
        valueAtCost: 2000,
        usefulLife: 10,
        depreciationRate: 10,
        depreciationType: 'STRAIGHT_LINE',
        residualValue: 200,
      });

      expect(asset1.assetCode).toBe('FA-0001');
      expect(asset2.assetCode).toBe('FA-0002');
    });

    it('should validate required fields', async () => {
      await expect(
        fixedAssetsService.createFixedAsset({
          acquisitionDate: new Date(),
          category: 'EQUIPMENT',
          description: '',
          valueAtCost: 1000,
          usefulLife: 5,
          depreciationRate: 20,
          depreciationType: 'STRAIGHT_LINE',
          residualValue: 100,
        })
      ).rejects.toThrow('Asset description is required');

      await expect(
        fixedAssetsService.createFixedAsset({
          acquisitionDate: new Date(),
          category: 'EQUIPMENT',
          description: 'Test Asset',
          valueAtCost: 0,
          usefulLife: 5,
          depreciationRate: 20,
          depreciationType: 'STRAIGHT_LINE',
          residualValue: 100,
        })
      ).rejects.toThrow('Value at cost must be greater than zero');

      await expect(
        fixedAssetsService.createFixedAsset({
          acquisitionDate: new Date(),
          category: 'EQUIPMENT',
          description: 'Test Asset',
          valueAtCost: 1000,
          usefulLife: 0,
          depreciationRate: 20,
          depreciationType: 'STRAIGHT_LINE',
          residualValue: 100,
        })
      ).rejects.toThrow('Useful life must be greater than zero');
    });

    it('should validate depreciation rate', async () => {
      await expect(
        fixedAssetsService.createFixedAsset({
          acquisitionDate: new Date(),
          category: 'EQUIPMENT',
          description: 'Test Asset',
          valueAtCost: 1000,
          usefulLife: 5,
          depreciationRate: -10,
          depreciationType: 'STRAIGHT_LINE',
          residualValue: 100,
        })
      ).rejects.toThrow('Depreciation rate must be between 0 and 100');

      await expect(
        fixedAssetsService.createFixedAsset({
          acquisitionDate: new Date(),
          category: 'EQUIPMENT',
          description: 'Test Asset',
          valueAtCost: 1000,
          usefulLife: 5,
          depreciationRate: 150,
          depreciationType: 'STRAIGHT_LINE',
          residualValue: 100,
        })
      ).rejects.toThrow('Depreciation rate must be between 0 and 100');
    });

    it('should validate residual value', async () => {
      await expect(
        fixedAssetsService.createFixedAsset({
          acquisitionDate: new Date(),
          category: 'EQUIPMENT',
          description: 'Test Asset',
          valueAtCost: 1000,
          usefulLife: 5,
          depreciationRate: 20,
          depreciationType: 'STRAIGHT_LINE',
          residualValue: -100,
        })
      ).rejects.toThrow('Residual value cannot be negative');

      await expect(
        fixedAssetsService.createFixedAsset({
          acquisitionDate: new Date(),
          category: 'EQUIPMENT',
          description: 'Test Asset',
          valueAtCost: 1000,
          usefulLife: 5,
          depreciationRate: 20,
          depreciationType: 'STRAIGHT_LINE',
          residualValue: 1500,
        })
      ).rejects.toThrow('Residual value must be less than value at cost');
    });
  });

  describe('Asset Updates', () => {
    it('should update asset information', async () => {
      const asset = await fixedAssetsService.createFixedAsset({
        acquisitionDate: new Date('2024-01-15'),
        category: 'EQUIPMENT',
        description: 'Original Description',
        valueAtCost: 5000,
        usefulLife: 5,
        depreciationRate: 20,
        depreciationType: 'STRAIGHT_LINE',
        residualValue: 500,
      });

      const updated = await fixedAssetsService.updateFixedAsset(asset.id, {
        description: 'Updated Description',
        status: 'UNDER_MAINTENANCE',
      });

      expect(updated.description).toBe('Updated Description');
      expect(updated.status).toBe('UNDER_MAINTENANCE');
      expect(updated.valueAtCost).toBe(5000); // Unchanged
    });

    it('should recalculate net book value when cost changes', async () => {
      const asset = await fixedAssetsService.createFixedAsset({
        acquisitionDate: new Date(),
        category: 'EQUIPMENT',
        description: 'Test Asset',
        valueAtCost: 5000,
        usefulLife: 5,
        depreciationRate: 20,
        depreciationType: 'STRAIGHT_LINE',
        residualValue: 500,
      });

      const updated = await fixedAssetsService.updateFixedAsset(asset.id, {
        valueAtCost: 6000,
      });

      expect(updated.valueAtCost).toBe(6000);
      expect(updated.netBookValue).toBe(6000); // No depreciation yet
    });

    it('should throw error for non-existent asset', async () => {
      await expect(
        fixedAssetsService.updateFixedAsset('non-existent-id', {
          description: 'Updated',
        })
      ).rejects.toThrow('Fixed asset not found');
    });
  });

  describe('Asset Deletion', () => {
    it('should soft delete an asset', async () => {
      const asset = await fixedAssetsService.createFixedAsset({
        acquisitionDate: new Date(),
        category: 'EQUIPMENT',
        description: 'To Delete',
        valueAtCost: 1000,
        usefulLife: 5,
        depreciationRate: 20,
        depreciationType: 'STRAIGHT_LINE',
        residualValue: 100,
      });

      await fixedAssetsService.deleteFixedAsset(asset.id);

      const retrieved = await fixedAssetsService.getFixedAssetById(asset.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.isActive).toBe(false);
    });

    it('should throw error when deleting non-existent asset', async () => {
      await expect(
        fixedAssetsService.deleteFixedAsset('non-existent-id')
      ).rejects.toThrow('Fixed asset not found');
    });
  });

  describe('Asset Retrieval', () => {
    beforeEach(async () => {
      await fixedAssetsService.createFixedAsset({
        acquisitionDate: new Date('2024-01-15'),
        category: 'EQUIPMENT',
        description: 'Laptop',
        valueAtCost: 5000,
        usefulLife: 5,
        depreciationRate: 20,
        depreciationType: 'STRAIGHT_LINE',
        residualValue: 500,
        status: 'ACTIVE',
      });

      await fixedAssetsService.createFixedAsset({
        acquisitionDate: new Date('2024-02-20'),
        category: 'VEHICLE',
        description: 'Company Car',
        valueAtCost: 30000,
        usefulLife: 10,
        depreciationRate: 10,
        depreciationType: 'DECLINING_BALANCE',
        residualValue: 5000,
        status: 'ACTIVE',
      });

      await fixedAssetsService.createFixedAsset({
        acquisitionDate: new Date('2024-03-10'),
        category: 'FURNITURE',
        description: 'Office Desk',
        valueAtCost: 1000,
        usefulLife: 7,
        depreciationRate: 14.29,
        depreciationType: 'STRAIGHT_LINE',
        residualValue: 100,
        status: 'DISPOSED',
      });
    });

    it('should get all assets', async () => {
      const assets = await fixedAssetsService.getFixedAssets();
      expect(assets.length).toBe(3);
    });

    it('should get active assets only', async () => {
      const activeAssets = await fixedAssetsService.getActiveFixedAssets();
      expect(activeAssets.length).toBe(3); // All are active (isActive=true)
    });

    it('should get asset by ID', async () => {
      const assets = await fixedAssetsService.getFixedAssets();
      const asset = await fixedAssetsService.getFixedAssetById(assets[0].id);
      
      expect(asset).toBeDefined();
      expect(asset?.description).toBe('Laptop');
    });

    it('should get asset by asset code', async () => {
      const asset = await fixedAssetsService.getFixedAssetByCode('FA-0001');
      
      expect(asset).toBeDefined();
      expect(asset?.description).toBe('Laptop');
    });

    it('should return null for non-existent asset', async () => {
      const asset = await fixedAssetsService.getFixedAssetById('non-existent-id');
      expect(asset).toBeNull();
    });

    it('should get assets by category', async () => {
      const equipment = await fixedAssetsService.getAssetsByCategory('EQUIPMENT');
      const vehicles = await fixedAssetsService.getAssetsByCategory('VEHICLE');

      expect(equipment.length).toBe(1);
      expect(vehicles.length).toBe(1);
    });

    it('should get assets by status', async () => {
      const active = await fixedAssetsService.getAssetsByStatus('ACTIVE');
      const disposed = await fixedAssetsService.getAssetsByStatus('DISPOSED');

      expect(active.length).toBe(2);
      expect(disposed.length).toBe(1);
    });
  });

  describe('Asset Search', () => {
    beforeEach(async () => {
      await fixedAssetsService.createFixedAsset({
        acquisitionDate: new Date('2024-01-15'),
        category: 'EQUIPMENT',
        description: 'Dell Laptop',
        referenceNumber: 'REF001',
        valueAtCost: 5000,
        usefulLife: 5,
        depreciationRate: 20,
        depreciationType: 'STRAIGHT_LINE',
        residualValue: 500,
      });

      await fixedAssetsService.createFixedAsset({
        acquisitionDate: new Date('2024-02-20'),
        category: 'VEHICLE',
        description: 'Toyota Camry',
        referenceNumber: 'REF002',
        valueAtCost: 30000,
        usefulLife: 10,
        depreciationRate: 10,
        depreciationType: 'DECLINING_BALANCE',
        residualValue: 5000,
      });
    });

    it('should search by description', async () => {
      const results = await fixedAssetsService.searchFixedAssets({
        search: 'Laptop',
      });

      expect(results.length).toBe(1);
      expect(results[0].description).toBe('Dell Laptop');
    });

    it('should search by asset code', async () => {
      const results = await fixedAssetsService.searchFixedAssets({
        search: 'FA-0002',
      });

      expect(results.length).toBe(1);
      expect(results[0].description).toBe('Toyota Camry');
    });

    it('should search by reference number', async () => {
      const results = await fixedAssetsService.searchFixedAssets({
        search: 'REF001',
      });

      expect(results.length).toBe(1);
      expect(results[0].description).toBe('Dell Laptop');
    });

    it('should filter by category', async () => {
      const results = await fixedAssetsService.searchFixedAssets({
        category: 'VEHICLE',
      });

      expect(results.length).toBe(1);
      expect(results[0].category).toBe('VEHICLE');
    });

    it('should combine multiple filters', async () => {
      const results = await fixedAssetsService.searchFixedAssets({
        search: 'Toyota',
        category: 'VEHICLE',
      });

      expect(results.length).toBe(1);
      expect(results[0].description).toBe('Toyota Camry');
    });

    it('should be case-insensitive', async () => {
      const results = await fixedAssetsService.searchFixedAssets({
        search: 'LAPTOP',
      });

      expect(results.length).toBe(1);
      expect(results[0].description).toBe('Dell Laptop');
    });
  });

  describe('Depreciation Calculations', () => {
    it('should calculate straight line depreciation', async () => {
      const asset = await fixedAssetsService.createFixedAsset({
        acquisitionDate: new Date(),
        category: 'EQUIPMENT',
        description: 'Test Asset',
        valueAtCost: 12000,
        usefulLife: 5,
        depreciationRate: 20,
        depreciationType: 'STRAIGHT_LINE',
        residualValue: 2000,
      });

      const monthlyDepreciation = fixedAssetsService.calculateMonthlyDepreciation(asset);
      
      // (12000 - 2000) / 5 years / 12 months = 166.67
      expect(monthlyDepreciation).toBeCloseTo(166.67, 2);
    });

    it('should calculate declining balance depreciation', async () => {
      const asset = await fixedAssetsService.createFixedAsset({
        acquisitionDate: new Date(),
        category: 'VEHICLE',
        description: 'Test Vehicle',
        valueAtCost: 30000,
        usefulLife: 10,
        depreciationRate: 20,
        depreciationType: 'DECLINING_BALANCE',
        residualValue: 5000,
      });

      const monthlyDepreciation = fixedAssetsService.calculateMonthlyDepreciation(asset);
      
      // 30000 * (20% / 12) = 500
      expect(monthlyDepreciation).toBeCloseTo(500, 2);
    });

    it('should record depreciation entry', async () => {
      const asset = await fixedAssetsService.createFixedAsset({
        acquisitionDate: new Date(),
        category: 'EQUIPMENT',
        description: 'Test Asset',
        valueAtCost: 12000,
        usefulLife: 5,
        depreciationRate: 20,
        depreciationType: 'STRAIGHT_LINE',
        residualValue: 2000,
        status: 'ACTIVE',
      });

      const period = new Date('2024-01-31');
      const entry = await fixedAssetsService.recordDepreciation(asset.id, period);

      expect(entry).toBeDefined();
      expect(entry.assetId).toBe(asset.id);
      expect(entry.depreciationAmount).toBeCloseTo(166.67, 2);
      expect(entry.accumulatedDepreciation).toBeCloseTo(166.67, 2);

      // Check asset was updated
      const updatedAsset = await fixedAssetsService.getFixedAssetById(asset.id);
      expect(updatedAsset?.accumulatedDepreciation).toBeCloseTo(166.67, 2);
      expect(updatedAsset?.netBookValue).toBeCloseTo(11833.33, 2);
    });

    it('should not depreciate below residual value', async () => {
      const asset = await fixedAssetsService.createFixedAsset({
        acquisitionDate: new Date(),
        category: 'EQUIPMENT',
        description: 'Test Asset',
        valueAtCost: 1000,
        usefulLife: 1,
        depreciationRate: 100,
        depreciationType: 'STRAIGHT_LINE',
        residualValue: 100,
        status: 'ACTIVE',
      });

      // Record depreciation for 12 months
      for (let i = 1; i <= 12; i++) {
        await fixedAssetsService.recordDepreciation(
          asset.id,
          new Date(`2024-${String(i).padStart(2, '0')}-01`)
        );
      }

      const finalAsset = await fixedAssetsService.getFixedAssetById(asset.id);
      expect(finalAsset?.netBookValue).toBeGreaterThanOrEqual(100);
      expect(finalAsset?.accumulatedDepreciation).toBeLessThanOrEqual(900);
    });

    it('should throw error when depreciating inactive asset', async () => {
      const asset = await fixedAssetsService.createFixedAsset({
        acquisitionDate: new Date(),
        category: 'EQUIPMENT',
        description: 'Test Asset',
        valueAtCost: 1000,
        usefulLife: 5,
        depreciationRate: 20,
        depreciationType: 'STRAIGHT_LINE',
        residualValue: 100,
        status: 'DISPOSED',
      });

      await expect(
        fixedAssetsService.recordDepreciation(asset.id, new Date())
      ).rejects.toThrow('Cannot depreciate inactive asset');
    });
  });

  describe('Total Values', () => {
    it('should calculate total values', async () => {
      await fixedAssetsService.createFixedAsset({
        acquisitionDate: new Date(),
        category: 'EQUIPMENT',
        description: 'Asset 1',
        valueAtCost: 5000,
        usefulLife: 5,
        depreciationRate: 20,
        depreciationType: 'STRAIGHT_LINE',
        residualValue: 500,
        status: 'ACTIVE',
      });

      await fixedAssetsService.createFixedAsset({
        acquisitionDate: new Date(),
        category: 'VEHICLE',
        description: 'Asset 2',
        valueAtCost: 30000,
        usefulLife: 10,
        depreciationRate: 10,
        depreciationType: 'STRAIGHT_LINE',
        residualValue: 5000,
        status: 'ACTIVE',
      });

      const totals = await fixedAssetsService.getTotalValues();

      expect(totals.totalCost).toBe(35000);
      expect(totals.totalDepreciation).toBe(0); // No depreciation recorded yet
      expect(totals.totalNetBookValue).toBe(35000);
    });

    it('should only include active assets in totals', async () => {
      const asset1 = await fixedAssetsService.createFixedAsset({
        acquisitionDate: new Date(),
        category: 'EQUIPMENT',
        description: 'Active Asset',
        valueAtCost: 5000,
        usefulLife: 5,
        depreciationRate: 20,
        depreciationType: 'STRAIGHT_LINE',
        residualValue: 500,
        status: 'ACTIVE',
      });

      const asset2 = await fixedAssetsService.createFixedAsset({
        acquisitionDate: new Date(),
        category: 'EQUIPMENT',
        description: 'Disposed Asset',
        valueAtCost: 3000,
        usefulLife: 5,
        depreciationRate: 20,
        depreciationType: 'STRAIGHT_LINE',
        residualValue: 300,
        status: 'DISPOSED',
      });

      const totals = await fixedAssetsService.getTotalValues();

      expect(totals.totalCost).toBe(5000); // Only active asset
    });
  });

  describe('Asset Summaries', () => {
    it('should get asset summaries', async () => {
      await fixedAssetsService.createFixedAsset({
        acquisitionDate: new Date('2024-01-15'),
        category: 'EQUIPMENT',
        description: 'Test Asset',
        valueAtCost: 5000,
        usefulLife: 5,
        depreciationRate: 20,
        depreciationType: 'STRAIGHT_LINE',
        residualValue: 500,
      });

      const summaries = await fixedAssetsService.getFixedAssetSummaries();

      expect(summaries.length).toBe(1);
      expect(summaries[0].assetCode).toBe('FA-0001');
      expect(summaries[0].description).toBe('Test Asset');
      expect(summaries[0].valueAtCost).toBe(5000);
    });

    it('should only include active assets in summaries', async () => {
      const asset1 = await fixedAssetsService.createFixedAsset({
        acquisitionDate: new Date(),
        category: 'EQUIPMENT',
        description: 'Active Asset',
        valueAtCost: 5000,
        usefulLife: 5,
        depreciationRate: 20,
        depreciationType: 'STRAIGHT_LINE',
        residualValue: 500,
      });

      const asset2 = await fixedAssetsService.createFixedAsset({
        acquisitionDate: new Date(),
        category: 'EQUIPMENT',
        description: 'Inactive Asset',
        valueAtCost: 3000,
        usefulLife: 5,
        depreciationRate: 20,
        depreciationType: 'STRAIGHT_LINE',
        residualValue: 300,
      });

      // Soft delete one asset
      await fixedAssetsService.deleteFixedAsset(asset2.id);

      const summaries = await fixedAssetsService.getFixedAssetSummaries();

      expect(summaries.length).toBe(1);
      expect(summaries[0].description).toBe('Active Asset');
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete asset lifecycle', async () => {
      // Create
      const asset = await fixedAssetsService.createFixedAsset({
        acquisitionDate: new Date('2024-01-15'),
        category: 'EQUIPMENT',
        description: 'Test Computer',
        referenceNumber: 'REF001',
        valueAtCost: 5000,
        usefulLife: 5,
        depreciationRate: 20,
        depreciationType: 'STRAIGHT_LINE',
        residualValue: 500,
        status: 'ACTIVE',
      });

      expect(asset.assetCode).toBe('FA-0001');
      expect(asset.isActive).toBe(true);

      // Record depreciation (must be done while asset is ACTIVE)
      await fixedAssetsService.recordDepreciation(asset.id, new Date('2024-01-31'));

      // Update
      const updated = await fixedAssetsService.updateFixedAsset(asset.id, {
        description: 'Updated Computer',
        status: 'UNDER_MAINTENANCE',
      });

      expect(updated.description).toBe('Updated Computer');
      expect(updated.status).toBe('UNDER_MAINTENANCE');

      // Retrieve
      const retrieved = await fixedAssetsService.getFixedAssetById(asset.id);
      expect(retrieved?.accumulatedDepreciation).toBeGreaterThan(0);

      // Search
      const searchResults = await fixedAssetsService.searchFixedAssets({
        search: 'Computer',
      });
      expect(searchResults.length).toBe(1);

      // Delete
      await fixedAssetsService.deleteFixedAsset(asset.id);
      const deleted = await fixedAssetsService.getFixedAssetById(asset.id);
      expect(deleted?.isActive).toBe(false);
    });
  });
});
