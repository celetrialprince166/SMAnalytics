import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ApiFixedAssetsService } from '../ApiFixedAssetsService';
import type { FixedAsset, DepreciationEntry } from '@/types';

// Mock fetch globally
global.fetch = vi.fn();

describe('ApiFixedAssetsService', () => {
  let service: ApiFixedAssetsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = ApiFixedAssetsService.getInstance();
  });

  describe('getFixedAssets', () => {
    it('should fetch all fixed assets', async () => {
      const mockAssets: FixedAsset[] = [
        {
          id: '1',
          organizationId: 'org-123',
          assetCode: 'FA-001',
          description: 'Laptop',
          category: 'EQUIPMENT',
          acquisitionDate: new Date('2024-01-01'),
          valueAtCost: 1000,
          residualValue: 100,
          usefulLife: 5,
          depreciationType: 'STRAIGHT_LINE',
          depreciationRate: 20,
          accumulatedDepreciation: 180,
          netBookValue: 820,
          status: 'ACTIVE',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01')
        }
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockAssets })
      });

      const result = await service.getFixedAssets();

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/fixed-assets',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      );
      expect(result).toEqual(mockAssets);
    });

    it('should fetch assets with filters', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] })
      });

      await service.getFixedAssets({ category: 'EQUIPMENT', status: 'ACTIVE' });

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/fixed-assets?category=EQUIPMENT&status=ACTIVE',
        expect.any(Object)
      );
    });

    it('should throw error when fetch fails', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Internal Server Error' })
      });

      await expect(service.getFixedAssets()).rejects.toThrow();
    });
  });

  describe('getFixedAssetById', () => {
    it('should fetch single fixed asset by id', async () => {
      const mockAsset: FixedAsset = {
        id: '1',
        organizationId: 'org-123',
        assetCode: 'FA-001',
        description: 'Laptop',
        category: 'EQUIPMENT',
        acquisitionDate: new Date('2024-01-01'),
        valueAtCost: 1000,
        residualValue: 100,
        usefulLife: 5,
        depreciationType: 'STRAIGHT_LINE',
        depreciationRate: 20,
        accumulatedDepreciation: 180,
        netBookValue: 820,
        status: 'ACTIVE',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockAsset })
      });

      const result = await service.getFixedAssetById('1');

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/fixed-assets/1',
        expect.any(Object)
      );
      expect(result).toEqual(mockAsset);
    });

    it('should return null when asset not found', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Not found' })
      });

      const result = await service.getFixedAssetById('999');

      expect(result).toBeNull();
    });
  });

  describe('createFixedAsset', () => {
    it('should create new fixed asset', async () => {
      const newAsset = {
        description: 'Laptop',
        category: 'EQUIPMENT',
        acquisitionDate: new Date('2024-01-01'),
        valueAtCost: 1000,
        residualValue: 100,
        usefulLife: 5,
        depreciationType: 'STRAIGHT_LINE' as const,
        depreciationRate: 20,
        holderAccountId: 'acc-123'
      };

      const mockCreated: FixedAsset = {
        id: '1',
        organizationId: 'org-123',
        assetCode: 'FA-001',
        ...newAsset,
        accumulatedDepreciation: 0,
        netBookValue: 1000,
        status: 'ACTIVE',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockCreated })
      });

      const result = await service.createFixedAsset(newAsset);

      expect(global.fetch).toHaveBeenCalledWith('/api/fixed-assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAsset)
      });
      expect(result).toEqual(mockCreated);
    });
  });

  describe('updateFixedAsset', () => {
    it('should update existing fixed asset', async () => {
      const updates = {
        description: 'Updated Laptop',
        residualValue: 150
      };

      const mockUpdated: FixedAsset = {
        id: '1',
        organizationId: 'org-123',
        assetCode: 'FA-001',
        description: 'Updated Laptop',
        category: 'EQUIPMENT',
        acquisitionDate: new Date('2024-01-01'),
        valueAtCost: 1000,
        residualValue: 150,
        usefulLife: 5,
        depreciationType: 'STRAIGHT_LINE',
        depreciationRate: 20,
        accumulatedDepreciation: 180,
        netBookValue: 820,
        status: 'ACTIVE',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02')
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockUpdated })
      });

      const result = await service.updateFixedAsset('1', updates);

      expect(global.fetch).toHaveBeenCalledWith('/api/fixed-assets/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      expect(result).toEqual(mockUpdated);
    });
  });

  describe('deleteFixedAsset', () => {
    it('should delete fixed asset', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { success: true } })
      });

      await service.deleteFixedAsset('1');

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/fixed-assets/1',
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  describe('disposeAsset', () => {
    it('should dispose fixed asset with accounting entries', async () => {
      const disposalData = {
        disposalDate: new Date('2024-06-01'),
        disposalValue: 800,
        bankAccountId: 'bank-123',
        remarks: 'Sold to employee'
      };

      const mockResult = {
        asset: {
          id: '1',
          status: 'DISPOSED',
          disposalDate: new Date('2024-06-01'),
          disposalValue: 800
        } as any,
        disposalValue: 800,
        netBookValue: 820,
        gainLoss: -20,
        disposalDate: new Date('2024-06-01'),
        bankAccountId: 'bank-123',
        remarks: 'Sold to employee'
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockResult })
      });

      const result = await service.disposeAsset('1', disposalData);

      expect(global.fetch).toHaveBeenCalledWith('/api/fixed-assets/1/dispose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('2024-06-01')
      });
      expect(result).toEqual(mockResult);
    });
  });

  describe('recordDepreciation', () => {
    it('should record depreciation for asset', async () => {
      const mockEntry: DepreciationEntry = {
        id: 'dep-1',
        assetId: '1',
        period: new Date('2024-01-31'),
        depreciationAmount: 15,
        accumulatedDepreciation: 15,
        netBookValue: 985,
        createdAt: new Date('2024-01-31')
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockEntry })
      });

      const result = await service.recordDepreciation('1', new Date('2024-01-31'));

      expect(global.fetch).toHaveBeenCalledWith('/api/fixed-assets/depreciation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('2024-01-31')
      });
      expect(result).toEqual(mockEntry);
    });
  });

  describe('getDepreciationSchedule', () => {
    it('should fetch depreciation schedule for asset', async () => {
      const mockSchedule = {
        assetId: '1',
        entries: [
          {
            id: 'dep-1',
            assetId: '1',
            period: new Date('2024-01-31'),
            depreciationAmount: 15,
            accumulatedDepreciation: 15,
            netBookValue: 985,
            createdAt: new Date('2024-01-31')
          },
          {
            id: 'dep-2',
            assetId: '1',
            period: new Date('2024-02-29'),
            depreciationAmount: 15,
            accumulatedDepreciation: 30,
            netBookValue: 970,
            createdAt: new Date('2024-02-29')
          }
        ],
        totalDepreciation: 30,
        remainingValue: 970
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockSchedule })
      });

      const result = await service.getDepreciationSchedule('1');

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/fixed-assets/depreciation?assetId=1',
        expect.any(Object)
      );
      expect(result).toEqual(mockSchedule);
    });
  });

  describe('getActiveFixedAssets', () => {
    it('should fetch only active assets', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] })
      });

      await service.getActiveFixedAssets();

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/fixed-assets?status=ACTIVE',
        expect.any(Object)
      );
    });
  });

  describe('searchFixedAssets', () => {
    it('should search assets by query', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] })
      });

      await service.searchFixedAssets('laptop');

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/fixed-assets?search=laptop',
        expect.any(Object)
      );
    });
  });
});
