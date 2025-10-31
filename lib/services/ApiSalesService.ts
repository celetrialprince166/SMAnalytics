/**
 * API Sales Service
 * 
 * Service for managing sales entries using API backend instead of local storage
 */

import { 
  SalesEntry, 
  CreateSalesEntryRequest, 
  UpdateSalesEntryRequest,
  SalesFilters
} from '@/types';

export class ApiSalesService {
  private static instance: ApiSalesService;
  private baseUrl = '/api/sales';

  private constructor() {}

  public static getInstance(): ApiSalesService {
    if (!ApiSalesService.instance) {
      ApiSalesService.instance = new ApiSalesService();
    }
    return ApiSalesService.instance;
  }

  /**
   * Get all sales entries
   */
  async getSalesEntries(filters?: SalesFilters): Promise<SalesEntry[]> {
    try {
      const params = new URLSearchParams();
      
      if (filters?.startDate) {
        params.append('dateFrom', filters.startDate.toISOString());
      }
      if (filters?.endDate) {
        params.append('dateTo', filters.endDate.toISOString());
      }
      if (filters?.productId) {
        params.append('productId', filters.productId);
      }
      if (filters?.customerAccountId) {
        params.append('customerAccountId', filters.customerAccountId);
      }

      const response = await fetch(`${this.baseUrl}?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch sales entries: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data?.data || [];
    } catch (error) {
      console.error('Error fetching sales entries:', error);
      throw error;
    }
  }

  /**
   * Get sales entry by ID
   */
  async getSalesEntryById(id: string): Promise<SalesEntry | null> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Failed to fetch sales entry: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching sales entry:', error);
      throw error;
    }
  }

  /**
   * Create a new sales entry
   */
  async createSalesEntry(salesData: CreateSalesEntryRequest): Promise<SalesEntry> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(salesData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `Failed to create sales entry: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error creating sales entry:', error);
      throw error;
    }
  }

  /**
   * Update an existing sales entry
   */
  async updateSalesEntry(id: string, salesData: UpdateSalesEntryRequest): Promise<SalesEntry> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(salesData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `Failed to update sales entry: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error updating sales entry:', error);
      throw error;
    }
  }

  /**
   * Delete a sales entry
   */
  async deleteSalesEntry(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `Failed to delete sales entry: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting sales entry:', error);
      throw error;
    }
  }

  /**
   * Get sales entries by date range
   */
  async getSalesEntriesByDateRange(startDate: Date, endDate: Date): Promise<SalesEntry[]> {
    return this.getSalesEntries({
      startDate,
      endDate,
    });
  }

  /**
   * Get sales entries by product
   */
  async getSalesEntriesByProduct(productId: string): Promise<SalesEntry[]> {
    return this.getSalesEntries({
      productId,
    });
  }

  /**
   * Get sales entries by customer account
   */
  async getSalesEntriesByCustomer(customerAccountId: string): Promise<SalesEntry[]> {
    return this.getSalesEntries({
      customerAccountId,
    });
  }

  /**
   * Search sales entries
   */
  async searchSalesEntries(query: string): Promise<SalesEntry[]> {
    try {
      const params = new URLSearchParams();
      params.append('search', query);

      const response = await fetch(`${this.baseUrl}?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to search sales entries: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data?.data || [];
    } catch (error) {
      console.error('Error searching sales entries:', error);
      throw error;
    }
  }

  /**
   * Get sales summaries (for reporting) - Returns individual sales entries, not grouped summaries
   */
  async getSalesSummaries(filters?: SalesFilters): Promise<any[]> {
    try {
      const salesEntries = await this.getSalesEntries(filters);
      
      // Return individual sales entries formatted for the Sales Register
      const summaries = salesEntries.map(entry => ({
        id: entry.id,
        date: entry.date,
        salesCode: entry.salesCode,
        productId: entry.productId,
        productName: entry.product?.name || null,
        serviceName: null,
        serviceLineName: null,
        description: entry.description,
        salesValue: entry.salesValue,
        costValue: entry.costValue,
        discountValue: 0, // TODO: Add discount support
        vatAmount: entry.vatAmount || 0,
        totalWithVat: entry.totalWithVat || entry.salesValue,
        customerAccount: entry.customerAccountId, // TODO: Resolve to account name
        applyVat: entry.applyVat,
        vatRate: entry.vatRate,
      }));

      return summaries;
    } catch (error) {
      console.error('Error getting sales summaries:', error);
      throw error;
    }
  }

  /**
   * Validate sales entry data
   */
  validateSalesEntry(data: CreateSalesEntryRequest): string[] {
    const errors: string[] = [];

    if (!data.date) {
      errors.push('Date is required');
    }
    if (!data.productId && !data.serviceId) {
      errors.push('Either product or service is required');
    }
    if (!data.description || data.description.trim().length === 0) {
      errors.push('Description is required');
    }
    if (!data.customerAccountId) {
      errors.push('Customer account is required');
    }
    if (data.salesValue < 0) {
      errors.push('Sales value must be non-negative');
    }
    if (data.costValue < 0) {
      errors.push('Cost value must be non-negative');
    }
    if (data.applyVat && (!data.vatRate || data.vatRate < 0 || data.vatRate > 100)) {
      errors.push('VAT rate must be between 0 and 100 when VAT is applied');
    }

    return errors;
  }
}

export const apiSalesService = ApiSalesService.getInstance();


