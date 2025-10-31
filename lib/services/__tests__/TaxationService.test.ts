/**
 * Taxation Service Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { taxationService } from '../TaxationService';
import { taxationRepository } from '../../repositories/TaxationRepository';

describe('TaxationService', () => {
  beforeEach(() => {
    // Clear storage before each test
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
  });

  describe('Tax Configuration', () => {
    it('should save tax configuration', async () => {
      const config = {
        vat: 12.5,
        nhil: 2.5,
        getfund: 2.5,
        covid19: 1,
      };

      const saved = await taxationService.saveTaxConfiguration(config);

      expect(saved).toBeDefined();
      expect(saved.vat).toBe(12.5);
      expect(saved.nhil).toBe(2.5);
      expect(saved.getfund).toBe(2.5);
      expect(saved.covid19).toBe(1);
      expect(saved.id).toBeDefined();
      expect(saved.createdAt).toBeDefined();
      expect(saved.updatedAt).toBeDefined();
    });

    it('should retrieve saved tax configuration', async () => {
      const config = {
        vat: 15,
        nhil: 3,
        getfund: 3,
        covid19: 1.5,
      };

      await taxationService.saveTaxConfiguration(config);
      const retrieved = await taxationService.getTaxConfiguration();

      expect(retrieved).toBeDefined();
      expect(retrieved?.vat).toBe(15);
      expect(retrieved?.nhil).toBe(3);
      expect(retrieved?.getfund).toBe(3);
      expect(retrieved?.covid19).toBe(1.5);
    });

    it('should return null when no configuration exists', async () => {
      const config = await taxationService.getTaxConfiguration();
      expect(config).toBeNull();
    });

    it('should update existing configuration', async () => {
      await taxationService.saveTaxConfiguration({
        vat: 12.5,
        nhil: 2.5,
        getfund: 2.5,
        covid19: 1,
      });

      const updated = await taxationService.saveTaxConfiguration({
        vat: 15,
        nhil: 3,
        getfund: 3,
        covid19: 1.5,
      });

      expect(updated.vat).toBe(15);
      expect(updated.nhil).toBe(3);
    });
  });

  describe('Tax Configuration Validation', () => {
    it('should reject negative VAT rate', async () => {
      await expect(
        taxationService.saveTaxConfiguration({
          vat: -5,
          nhil: 2.5,
          getfund: 2.5,
          covid19: 1,
        })
      ).rejects.toThrow('VAT must be between 0 and 100');
    });

    it('should reject VAT rate over 100', async () => {
      await expect(
        taxationService.saveTaxConfiguration({
          vat: 150,
          nhil: 2.5,
          getfund: 2.5,
          covid19: 1,
        })
      ).rejects.toThrow('VAT must be between 0 and 100');
    });

    it('should reject negative NHIL rate', async () => {
      await expect(
        taxationService.saveTaxConfiguration({
          vat: 12.5,
          nhil: -2.5,
          getfund: 2.5,
          covid19: 1,
        })
      ).rejects.toThrow('NHIL must be between 0 and 100');
    });

    it('should reject negative GETFund rate', async () => {
      await expect(
        taxationService.saveTaxConfiguration({
          vat: 12.5,
          nhil: 2.5,
          getfund: -2.5,
          covid19: 1,
        })
      ).rejects.toThrow('GETFund must be between 0 and 100');
    });

    it('should reject negative COVID-19 rate', async () => {
      await expect(
        taxationService.saveTaxConfiguration({
          vat: 12.5,
          nhil: 2.5,
          getfund: 2.5,
          covid19: -1,
        })
      ).rejects.toThrow('COVID-19 Levy must be between 0 and 100');
    });

    it('should accept zero rates', async () => {
      const config = await taxationService.saveTaxConfiguration({
        vat: 0,
        nhil: 0,
        getfund: 0,
        covid19: 0,
      });

      expect(config.vat).toBe(0);
      expect(config.nhil).toBe(0);
    });

    it('should accept 100% rates', async () => {
      const config = await taxationService.saveTaxConfiguration({
        vat: 100,
        nhil: 100,
        getfund: 100,
        covid19: 100,
      });

      expect(config.vat).toBe(100);
      expect(config.nhil).toBe(100);
    });
  });

  describe('Withholding Tax Configuration', () => {
    it('should save withholding tax configuration', async () => {
      const config = {
        nonIndividualThreshold: 2000,
        nonIndividualRate: 5,
        individualRate: 7.5,
      };

      const saved = await taxationService.saveWithholdingTaxConfiguration(config);

      expect(saved).toBeDefined();
      expect(saved.nonIndividualThreshold).toBe(2000);
      expect(saved.nonIndividualRate).toBe(5);
      expect(saved.individualRate).toBe(7.5);
      expect(saved.id).toBeDefined();
    });

    it('should retrieve saved withholding tax configuration', async () => {
      const config = {
        nonIndividualThreshold: 3000,
        nonIndividualRate: 7,
        individualRate: 10,
      };

      await taxationService.saveWithholdingTaxConfiguration(config);
      const retrieved = await taxationService.getWithholdingTaxConfiguration();

      expect(retrieved).toBeDefined();
      expect(retrieved?.nonIndividualThreshold).toBe(3000);
      expect(retrieved?.nonIndividualRate).toBe(7);
      expect(retrieved?.individualRate).toBe(10);
    });

    it('should return null when no withholding configuration exists', async () => {
      const config = await taxationService.getWithholdingTaxConfiguration();
      expect(config).toBeNull();
    });
  });

  describe('Withholding Tax Validation', () => {
    it('should reject negative threshold', async () => {
      await expect(
        taxationService.saveWithholdingTaxConfiguration({
          nonIndividualThreshold: -1000,
          nonIndividualRate: 5,
          individualRate: 7.5,
        })
      ).rejects.toThrow('Non-individual threshold must be positive');
    });

    it('should reject negative non-individual rate', async () => {
      await expect(
        taxationService.saveWithholdingTaxConfiguration({
          nonIndividualThreshold: 2000,
          nonIndividualRate: -5,
          individualRate: 7.5,
        })
      ).rejects.toThrow('Non-individual rate must be between 0 and 100');
    });

    it('should reject non-individual rate over 100', async () => {
      await expect(
        taxationService.saveWithholdingTaxConfiguration({
          nonIndividualThreshold: 2000,
          nonIndividualRate: 150,
          individualRate: 7.5,
        })
      ).rejects.toThrow('Non-individual rate must be between 0 and 100');
    });

    it('should reject negative individual rate', async () => {
      await expect(
        taxationService.saveWithholdingTaxConfiguration({
          nonIndividualThreshold: 2000,
          nonIndividualRate: 5,
          individualRate: -7.5,
        })
      ).rejects.toThrow('Individual rate must be between 0 and 100');
    });

    it('should reject individual rate over 100', async () => {
      await expect(
        taxationService.saveWithholdingTaxConfiguration({
          nonIndividualThreshold: 2000,
          nonIndividualRate: 5,
          individualRate: 150,
        })
      ).rejects.toThrow('Individual rate must be between 0 and 100');
    });

    it('should accept zero threshold', async () => {
      const config = await taxationService.saveWithholdingTaxConfiguration({
        nonIndividualThreshold: 0,
        nonIndividualRate: 5,
        individualRate: 7.5,
      });

      expect(config.nonIndividualThreshold).toBe(0);
    });
  });

  describe('VAT Calculation', () => {
    it('should calculate VAT with all levies', () => {
      const result = taxationService.calculateVAT(1000, true, true, true);

      expect(result.vat).toBe(125); // 12.5%
      expect(result.nhil).toBe(25); // 2.5%
      expect(result.getfl).toBe(25); // 2.5%
      expect(result.covid19).toBe(10); // 1%
      expect(result.total).toBe(185); // 18.5%
    });

    it('should calculate VAT without NHIL', () => {
      const result = taxationService.calculateVAT(1000, false, true, true);

      expect(result.vat).toBe(125);
      expect(result.nhil).toBe(0);
      expect(result.getfl).toBe(25);
      expect(result.covid19).toBe(10);
      expect(result.total).toBe(160);
    });

    it('should calculate VAT without GETFund', () => {
      const result = taxationService.calculateVAT(1000, true, false, true);

      expect(result.vat).toBe(125);
      expect(result.nhil).toBe(25);
      expect(result.getfl).toBe(0);
      expect(result.covid19).toBe(10);
      expect(result.total).toBe(160);
    });

    it('should calculate VAT without COVID-19 levy', () => {
      const result = taxationService.calculateVAT(1000, true, true, false);

      expect(result.vat).toBe(125);
      expect(result.nhil).toBe(25);
      expect(result.getfl).toBe(25);
      expect(result.covid19).toBe(0);
      expect(result.total).toBe(175);
    });

    it('should calculate VAT only', () => {
      const result = taxationService.calculateVAT(1000, false, false, false);

      expect(result.vat).toBe(125);
      expect(result.nhil).toBe(0);
      expect(result.getfl).toBe(0);
      expect(result.covid19).toBe(0);
      expect(result.total).toBe(125);
    });

    it('should handle zero amount', () => {
      const result = taxationService.calculateVAT(0);

      expect(result.vat).toBe(0);
      expect(result.nhil).toBe(0);
      expect(result.getfl).toBe(0);
      expect(result.covid19).toBe(0);
      expect(result.total).toBe(0);
    });

    it('should handle decimal amounts', () => {
      const result = taxationService.calculateVAT(1234.56, true, true, true);

      expect(result.vat).toBeCloseTo(154.32, 2);
      expect(result.nhil).toBeCloseTo(30.86, 2);
      expect(result.getfl).toBeCloseTo(30.86, 2);
      expect(result.covid19).toBeCloseTo(12.35, 2);
      expect(result.total).toBeCloseTo(228.39, 2);
    });
  });

  describe('Configuration Persistence', () => {
    it('should persist tax configuration across service instances', async () => {
      await taxationService.saveTaxConfiguration({
        vat: 12.5,
        nhil: 2.5,
        getfund: 2.5,
        covid19: 1,
      });

      // Get configuration through repository directly
      const config = await taxationRepository.getTaxConfiguration();
      expect(config).toBeDefined();
      expect(config?.vat).toBe(12.5);
    });

    it('should persist withholding tax configuration', async () => {
      await taxationService.saveWithholdingTaxConfiguration({
        nonIndividualThreshold: 2000,
        nonIndividualRate: 5,
        individualRate: 7.5,
      });

      const config = await taxationRepository.getWithholdingTaxConfiguration();
      expect(config).toBeDefined();
      expect(config?.nonIndividualThreshold).toBe(2000);
    });
  });

  describe('Multiple Updates', () => {
    it('should handle multiple tax configuration updates', async () => {
      const config1 = await taxationService.saveTaxConfiguration({
        vat: 10,
        nhil: 2,
        getfund: 2,
        covid19: 1,
      });

      const config2 = await taxationService.saveTaxConfiguration({
        vat: 15,
        nhil: 3,
        getfund: 3,
        covid19: 1.5,
      });

      expect(config2.vat).toBe(15);
      expect(config2.id).toBe(config1.id); // Same ID, updated
      expect(config2.updatedAt.getTime()).toBeGreaterThanOrEqual(config1.updatedAt.getTime());
    });

    it('should handle multiple withholding tax updates', async () => {
      const config1 = await taxationService.saveWithholdingTaxConfiguration({
        nonIndividualThreshold: 1000,
        nonIndividualRate: 3,
        individualRate: 5,
      });

      const config2 = await taxationService.saveWithholdingTaxConfiguration({
        nonIndividualThreshold: 2000,
        nonIndividualRate: 5,
        individualRate: 7.5,
      });

      expect(config2.nonIndividualThreshold).toBe(2000);
      expect(config2.id).toBe(config1.id);
    });
  });
});
