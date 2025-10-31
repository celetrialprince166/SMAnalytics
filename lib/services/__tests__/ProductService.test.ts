/**
 * Product Service Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { productService } from '../ProductService';
import { productRepository } from '../../repositories/ProductRepository';
import { setupAccountHierarchy } from './helpers/accountSetup';

describe('ProductService', () => {
  beforeEach(async () => {
    // Clear storage before each test
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
    
    // Set up account hierarchy for tests
    await setupAccountHierarchy();
  });

  describe('Product Creation', () => {
    it('should create a product with automatic accounts', async () => {
      const productData = {
        name: 'Test Product',
        description: 'Test Description',
        category: 'Electronics',
        unitPrice: 100,
        costPrice: 60,
        quantityOnHand: 50,
        reorderLevel: 10,
      };

      const product = await productService.createProduct(productData);

      expect(product).toBeDefined();
      expect(product.name).toBe('Test Product');
      expect(product.unitPrice).toBe(100);
      expect(product.costPrice).toBe(60);
      expect(product.code).toMatch(/PRD-\d{4}/);
      expect(product.inventoryAccountId).toBeDefined();
      expect(product.salesAccountId).toBeDefined();
      expect(product.costOfSalesAccountId).toBeDefined();
    });

    it('should validate product data', async () => {
      const invalidData = {
        name: '',
        unitPrice: -10,
        costPrice: 50,
      };

      await expect(
        productService.createProduct(invalidData as any)
      ).rejects.toThrow();
    });

    it('should prevent unit price less than cost price', async () => {
      const invalidData = {
        name: 'Test Product',
        unitPrice: 50,
        costPrice: 100,
      };

      await expect(
        productService.createProduct(invalidData)
      ).rejects.toThrow('Unit price should not be less than cost price');
    });
  });

  describe('Product Retrieval', () => {
    it('should retrieve product by ID', async () => {
      const productData = {
        name: 'Test Product',
        unitPrice: 100,
        costPrice: 60,
      };

      const created = await productService.createProduct(productData);
      const retrieved = await productService.getProductById(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
      expect(retrieved?.name).toBe('Test Product');
    });

    it('should retrieve product by code', async () => {
      const productData = {
        name: 'Test Product',
        unitPrice: 100,
        costPrice: 60,
      };

      const created = await productService.createProduct(productData);
      const retrieved = await productService.getProductByCode(created.code);

      expect(retrieved).toBeDefined();
      expect(retrieved?.code).toBe(created.code);
    });

    it('should get active products only', async () => {
      await productService.createProduct({
        name: 'Active Product',
        unitPrice: 100,
        costPrice: 60,
      });

      const inactiveProduct = await productService.createProduct({
        name: 'Inactive Product',
        unitPrice: 100,
        costPrice: 60,
      });

      await productService.deleteProduct(inactiveProduct.id);

      const activeProducts = await productService.getActiveProducts();
      expect(activeProducts.length).toBe(1);
      expect(activeProducts[0].name).toBe('Active Product');
    });
  });

  describe('Product Updates', () => {
    it('should update product details', async () => {
      const product = await productService.createProduct({
        name: 'Original Name',
        unitPrice: 100,
        costPrice: 60,
      });

      const updated = await productService.updateProduct(product.id, {
        name: 'Updated Name',
        unitPrice: 120,
      });

      expect(updated.name).toBe('Updated Name');
      expect(updated.unitPrice).toBe(120);
      expect(updated.costPrice).toBe(60); // Unchanged
    });

    it('should update product quantity', async () => {
      const product = await productService.createProduct({
        name: 'Test Product',
        unitPrice: 100,
        costPrice: 60,
        quantityOnHand: 50,
      });

      const updated = await productService.updateProductQuantity(product.id, 10);
      expect(updated.quantityOnHand).toBe(60);

      const decreased = await productService.updateProductQuantity(product.id, -20);
      expect(decreased.quantityOnHand).toBe(40);
    });

    it('should prevent negative inventory', async () => {
      const product = await productService.createProduct({
        name: 'Test Product',
        unitPrice: 100,
        costPrice: 60,
        quantityOnHand: 10,
      });

      await expect(
        productService.updateProductQuantity(product.id, -20)
      ).rejects.toThrow('Insufficient inventory');
    });
  });

  describe('Product Calculations', () => {
    it('should calculate profit margin correctly', () => {
      const margin = productService.calculateProfitMargin(100, 60);
      expect(margin).toBeCloseTo(66.67, 1);
    });

    it('should calculate markup correctly', () => {
      const markup = productService.calculateMarkup(100, 60);
      expect(markup).toBe(40);
    });

    it('should handle zero cost price', () => {
      const margin = productService.calculateProfitMargin(100, 0);
      expect(margin).toBe(0);
    });
  });

  describe('Product Search and Filtering', () => {
    beforeEach(async () => {
      await productService.createProduct({
        name: 'Laptop',
        category: 'Electronics',
        unitPrice: 1000,
        costPrice: 600,
      });

      await productService.createProduct({
        name: 'Mouse',
        category: 'Electronics',
        unitPrice: 20,
        costPrice: 10,
      });

      await productService.createProduct({
        name: 'Desk',
        category: 'Furniture',
        unitPrice: 300,
        costPrice: 200,
      });
    });

    it('should search products by name', async () => {
      const results = await productService.searchProducts({
        search: 'Laptop',
      });

      expect(results.length).toBe(1);
      expect(results[0].name).toBe('Laptop');
    });

    it('should filter by category', async () => {
      const results = await productService.searchProducts({
        category: 'Electronics',
      });

      expect(results.length).toBe(2);
    });

    it('should filter by active status', async () => {
      const products = await productService.getProducts();
      await productService.deleteProduct(products[0].id);

      const activeResults = await productService.searchProducts({
        isActive: true,
      });

      expect(activeResults.length).toBe(2);
    });
  });

  describe('Product Categories', () => {
    it('should get all product categories', async () => {
      await productService.createProduct({
        name: 'Product 1',
        category: 'Electronics',
        unitPrice: 100,
        costPrice: 60,
      });

      await productService.createProduct({
        name: 'Product 2',
        category: 'Furniture',
        unitPrice: 200,
        costPrice: 120,
      });

      const categories = await productService.getProductCategories();
      expect(categories).toContain('Electronics');
      expect(categories).toContain('Furniture');
      expect(categories.length).toBe(2);
    });
  });

  describe('Low Stock Detection', () => {
    it('should identify low stock products', async () => {
      await productService.createProduct({
        name: 'Low Stock Product',
        unitPrice: 100,
        costPrice: 60,
        quantityOnHand: 5,
        reorderLevel: 10,
      });

      await productService.createProduct({
        name: 'Normal Stock Product',
        unitPrice: 100,
        costPrice: 60,
        quantityOnHand: 50,
        reorderLevel: 10,
      });

      const lowStock = await productService.getLowStockProducts();
      expect(lowStock.length).toBe(1);
      expect(lowStock[0].name).toBe('Low Stock Product');
    });
  });
});
