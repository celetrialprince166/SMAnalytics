/**
 * Product Repository
 * 
 * Data access layer for product management
 */

import { BaseRepository } from './BaseRepository';
import { Product } from '@/types';
import { storageService } from '../storage/LocalStorageService';

export class ProductRepository extends BaseRepository<Product> {
  protected storageKey = 'products' as const;

  async findByCode(code: string): Promise<Product | null> {
    const products = this.getAll();
    return products.find(p => p.code === code) || null;
  }

  async getNextProductCode(): Promise<string> {
    const metadata = storageService.getData('metadata');
    const counter = metadata.productCounter + 1;
    
    // Update counter
    metadata.productCounter = counter;
    storageService.updateData('metadata', metadata);

    // Format: PRD-NNNN
    return `PRD-${String(counter).padStart(4, '0')}`;
  }

  async search(filters: any): Promise<Product[]> {
    let products = this.getAll();

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      products = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm) ||
        p.code.toLowerCase().includes(searchTerm) ||
        p.description?.toLowerCase().includes(searchTerm)
      );
    }

    if (filters.category) {
      products = products.filter(p => p.category === filters.category);
    }

    if (filters.isActive !== undefined) {
      products = products.filter(p => p.isActive === filters.isActive);
    }

    if (filters.lowStock) {
      products = products.filter(p => p.quantityOnHand <= p.reorderLevel);
    }

    return products;
  }

  async findByCategory(category: string): Promise<Product[]> {
    const products = this.getAll();
    return products.filter(p => p.category === category);
  }

  async findLowStock(): Promise<Product[]> {
    const products = this.getAll();
    return products.filter(p => p.quantityOnHand <= p.reorderLevel);
  }

  async findActive(): Promise<Product[]> {
    const products = this.getAll();
    return products.filter(p => p.isActive);
  }
}

// Export singleton instance
export const productRepository = new ProductRepository();
