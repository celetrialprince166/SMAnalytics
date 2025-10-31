/**
 * Product Service
 * 
 * Business logic for product management with automatic account creation
 */

import {
  Product,
  CreateProductRequest,
  UpdateProductRequest,
  } from '@/types';
import {
  productRepository,
  holderAccountRepository,
  auditRepository,
} from '../repositories';
import { accountService } from './AccountService';

export class ProductService {
  private static instance: ProductService;

  private constructor() {}

  public static getInstance(): ProductService {
    if (!ProductService.instance) {
      ProductService.instance = new ProductService();
    }
    return ProductService.instance;
  }

  /**
   * Create a new product with automatic account creation
   */
  async createProduct(request: CreateProductRequest): Promise<Product> {
    // Validate product data
    const validation = await this.validateProduct(request);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    // Generate product code
    const code = await productRepository.getNextProductCode();

    // Create automatic accounts for the product
    const accounts = await this.createProductAccounts(code, request.name);

    // Create product
    const product = await productRepository.create({
      code,
      name: request.name,
      description: request.description,
      category: request.category,
      unitPrice: request.unitPrice,
      costPrice: request.costPrice,
      quantityOnHand: request.quantityOnHand || 0,
      reorderLevel: request.reorderLevel || 0,
      isActive: true,
      inventoryAccountId: accounts.inventory.id,
      salesAccountId: accounts.sales.id,
      costOfSalesAccountId: accounts.costOfSales.id,
    });

    // Log audit entry
    const { userId, username } = this.getCurrentUser();
    await this.logAudit(
      product.id,
      'CREATE',
      undefined,
      product,
      userId,
      username
    );

    return product;
  }

  /**
   * Update an existing product
   */
  async updateProduct(productId: string, updates: UpdateProductRequest): Promise<Product> {
    const existingProduct = await productRepository.findById(productId);
    if (!existingProduct) {
      throw new Error('Product not found');
    }

    // Validate updates
    if (updates.name || updates.unitPrice !== undefined || updates.costPrice !== undefined) {
      const validation = await this.validateProduct({
        name: updates.name || existingProduct.name,
        unitPrice: updates.unitPrice !== undefined ? updates.unitPrice : existingProduct.unitPrice,
        costPrice: updates.costPrice !== undefined ? updates.costPrice : existingProduct.costPrice,
      } as CreateProductRequest);
      
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }
    }

    // Update product
    const updatedProduct = await productRepository.update(productId, updates);

    // Log audit entry
    const { userId, username } = this.getCurrentUser();
    await this.logAudit(
      productId,
      'UPDATE',
      existingProduct,
      updatedProduct,
      userId,
      username
    );

    return updatedProduct;
  }

  /**
   * Delete a product (soft delete by setting isActive to false)
   */
  async deleteProduct(productId: string): Promise<void> {
    const product = await productRepository.findById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    // Soft delete by setting isActive to false
    await productRepository.update(productId, { isActive: false });

    // Log audit entry
    const { userId, username } = this.getCurrentUser();
    await this.logAudit(
      productId,
      'DELETE',
      product,
      { ...product, isActive: false },
      userId,
      username
    );
  }

  /**
   * Get product by ID
   */
  async getProductById(productId: string): Promise<Product | null> {
    return await productRepository.findById(productId);
  }

  /**
   * Get product by code
   */
  async getProductByCode(code: string): Promise<Product | null> {
    return await productRepository.findByCode(code);
  }

  /**
   * Get all products
   */
  async getProducts(): Promise<Product[]> {
    return await productRepository.findAll();
  }

  /**
   * Get active products only
   */
  async getActiveProducts(): Promise<Product[]> {
    const products = await productRepository.findAll();
    return products.filter(p => p.isActive);
  }

  /**
   * Search products with filters
   */
  async searchProducts(filters: any): Promise<Product[]> {
    return await productRepository.search(filters);
  }

  /**
   * Get product summaries for dropdowns
   */
  async getProductSummaries(): Promise<any[]> {
    const products = await this.getActiveProducts();
    return products.map(p => ({
      id: p.id,
      code: p.code,
      name: p.name,
      category: p.category,
      unitPrice: p.unitPrice,
      quantityOnHand: p.quantityOnHand,
      isActive: p.isActive,
    }));
  }

  /**
   * Get products by category
   */
  async getProductsByCategory(category: string): Promise<Product[]> {
    return await productRepository.findByCategory(category);
  }

  /**
   * Get low stock products
   */
  async getLowStockProducts(): Promise<Product[]> {
    return await productRepository.findLowStock();
  }

  /**
   * Update product quantity (for inventory management)
   */
  async updateProductQuantity(productId: string, quantityChange: number): Promise<Product> {
    const product = await productRepository.findById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    const newQuantity = product.quantityOnHand + quantityChange;
    if (newQuantity < 0) {
      throw new Error('Insufficient inventory');
    }

    return await this.updateProduct(productId, { quantityOnHand: newQuantity });
  }

  /**
   * Calculate profit margin
   */
  calculateProfitMargin(unitPrice: number, costPrice: number): number {
    if (costPrice === 0) return 0;
    return ((unitPrice - costPrice) / costPrice) * 100;
  }

  /**
   * Calculate markup percentage
   */
  calculateMarkup(unitPrice: number, costPrice: number): number {
    if (unitPrice === 0) return 0;
    return ((unitPrice - costPrice) / unitPrice) * 100;
  }

  /**
   * Get all product categories
   */
  async getProductCategories(): Promise<string[]> {
    const products = await productRepository.findAll();
    const categories = new Set<string>();
    products.forEach(p => {
      if (p.category) {
        categories.add(p.category);
      }
    });
    return Array.from(categories).sort();
  }

  /**
   * Validate product data
   */
  async validateProduct(data: CreateProductRequest): Promise<{
    isValid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    if (!data.name || data.name.trim().length === 0) {
      errors.push('Product name is required');
    }

    if (data.unitPrice === undefined || data.unitPrice < 0) {
      errors.push('Unit price must be zero or greater');
    }

    if (data.costPrice === undefined || data.costPrice < 0) {
      errors.push('Cost price must be zero or greater');
    }

    if (data.unitPrice !== undefined && data.costPrice !== undefined && data.unitPrice < data.costPrice) {
      errors.push('Unit price should not be less than cost price');
    }

    if (data.quantityOnHand !== undefined && data.quantityOnHand < 0) {
      errors.push('Quantity on hand cannot be negative');
    }

    if (data.reorderLevel !== undefined && data.reorderLevel < 0) {
      errors.push('Reorder level cannot be negative');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Create automatic accounts for a product
   * 
   * This creates three holder accounts for each product under a default secondary account.
   * If the required account structure doesn't exist, it creates placeholder accounts.
   */
  private async createProductAccounts(productCode: string, productName: string) {
    const { primaryAccountRepository, secondaryAccountRepository } = await import('../repositories');
    const hierarchy = await accountService.getAccountHierarchy();
    
    // Find or create Inventory primary account
    let inventoryPrimary = hierarchy.primary.find(p => p.name === 'Inventory');
    if (!inventoryPrimary) {
      inventoryPrimary = await primaryAccountRepository.create({
        name: 'Inventory',
        type: 'ASSETS',
        description: 'Product inventory accounts',
        isActive: true,
      });
    }

    // Find or create Sales primary account
    let salesPrimary = hierarchy.primary.find(p => p.name === 'Sales');
    if (!salesPrimary) {
      salesPrimary = await primaryAccountRepository.create({
        name: 'Sales',
        type: 'REVENUE',
        description: 'Product sales accounts',
        isActive: true,
      });
    }

    // Find or create Cost of Sales primary account
    let costPrimary = hierarchy.primary.find(p => p.name === 'Cost of Sales');
    if (!costPrimary) {
      costPrimary = await primaryAccountRepository.create({
        name: 'Cost of Sales',
        type: 'EXPENSES',
        description: 'Cost of goods sold accounts',
        isActive: true,
      });
    }

    // Create secondary accounts if they don't exist
    let inventorySecondary = hierarchy.secondary.find(
      s => s.primaryAccountId === inventoryPrimary!.id && s.name === 'Products'
    );
    if (!inventorySecondary) {
      inventorySecondary = await accountService.createSecondaryAccount(
        inventoryPrimary.id,
        'Products',
        'Product inventory'
      );
    }

    let salesSecondary = hierarchy.secondary.find(
      s => s.primaryAccountId === salesPrimary!.id && s.name === 'Product Sales'
    );
    if (!salesSecondary) {
      salesSecondary = await accountService.createSecondaryAccount(
        salesPrimary.id,
        'Product Sales',
        'Revenue from product sales'
      );
    }

    let costSecondary = hierarchy.secondary.find(
      s => s.primaryAccountId === costPrimary!.id && s.name === 'Product Costs'
    );
    if (!costSecondary) {
      costSecondary = await accountService.createSecondaryAccount(
        costPrimary.id,
        'Product Costs',
        'Cost of products sold'
      );
    }

    // Create holder accounts for this specific product
    const inventoryAccount = await accountService.createHolderAccount({
      name: `${productName} - Inventory`,
      secondaryAccountId: inventorySecondary.id,
      description: `Inventory account for ${productName} (${productCode})`,
    });

    const salesAccount = await accountService.createHolderAccount({
      name: `${productName} - Sales`,
      secondaryAccountId: salesSecondary.id,
      description: `Sales account for ${productName} (${productCode})`,
    });

    const costOfSalesAccount = await accountService.createHolderAccount({
      name: `${productName} - Cost of Sales`,
      secondaryAccountId: costSecondary.id,
      description: `Cost of sales account for ${productName} (${productCode})`,
    });

    return {
      inventory: inventoryAccount,
      sales: salesAccount,
      costOfSales: costOfSalesAccount,
    };
  }

  /**
   * Log audit entry for product action
   */
  private async logAudit(
    productId: string,
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    previousValues?: Partial<Product>,
    newValues?: Partial<Product>,
    userId?: string,
    username?: string
  ): Promise<void> {
    try {
      await auditRepository.create({
        transactionId: productId, // Using productId as transactionId for audit
        action,
        timestamp: new Date(),
        userId,
        username,
        previousValues: previousValues as any,
        newValues: newValues as any,
      });
    } catch (error) {
      console.error('Failed to log audit entry:', error);
    }
  }

  /**
   * Get current user info for audit logging
   */
  private getCurrentUser(): { userId?: string; username?: string } {
    try {
      if (typeof window !== 'undefined') {
        const sessionData = localStorage.getItem('snm_session');
        if (sessionData) {
          const session = JSON.parse(sessionData);
          return {
            userId: session.userId,
            username: session.username,
          };
        }
      }
    } catch (error) {
      console.error('Failed to get current user:', error);
    }
    return {};
  }
}

// Export singleton instance
export const productService = ProductService.getInstance();
