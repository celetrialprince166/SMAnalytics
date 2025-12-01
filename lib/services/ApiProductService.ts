/**
 * API Product Service
 * 
 * Service for managing products using API backend instead of local storage
 */

import { Product } from '@/types';

export class ApiProductService {
  private static instance: ApiProductService;
  private baseUrl = '/api/products';

  private constructor() {}

  public static getInstance(): ApiProductService {
    if (!ApiProductService.instance) {
      ApiProductService.instance = new ApiProductService();
    }
    return ApiProductService.instance;
  }

  /**
   * Get all products
   */
  async getProducts(): Promise<Product[]> {
    try {
      const response = await fetch(`${this.baseUrl}?limit=1000`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.statusText}`);
      }

      const result = await response.json();
      // Handle nested response structure
      return result.data?.data || result.data || [];
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  }

  /**
   * Get active products only
   */
  async getActiveProducts(): Promise<Product[]> {
    try {
      const products = await this.getProducts();
      return products.filter(p => p.isActive);
    } catch (error) {
      console.error('Error fetching active products:', error);
      throw error;
    }
  }

  /**
   * Get product by ID
   */
  async getProductById(id: string): Promise<Product | null> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Failed to fetch product: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching product:', error);
      throw error;
    }
  }

  /**
   * Search products
   */
  async searchProducts(query: string): Promise<Product[]> {
    try {
      const response = await fetch(`${this.baseUrl}?search=${encodeURIComponent(query)}&limit=1000`);
      
      if (!response.ok) {
        throw new Error(`Failed to search products: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data?.data || result.data || [];
    } catch (error) {
      console.error('Error searching products:', error);
      throw error;
    }
  }

  /**
   * Get product summaries for dropdowns
   */
  async getProductSummaries(): Promise<Array<{ id: string; name: string; code: string }>> {
    try {
      const products = await this.getProducts();
      return products.map(p => ({
        id: p.id,
        name: p.name,
        code: p.code,
      }));
    } catch (error) {
      console.error('Error fetching product summaries:', error);
      throw error;
    }
  }

  /**
   * Create a new product
   */
  async createProduct(productData: Partial<Product>): Promise<Product> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `Failed to create product: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  }

  /**
   * Update an existing product
   */
  async updateProduct(id: string, productData: Partial<Product>): Promise<Product> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `Failed to update product: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  }

  /**
   * Delete a product
   */
  async deleteProduct(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `Failed to delete product: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  }
}

export const apiProductService = ApiProductService.getInstance();


