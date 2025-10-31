/**
 * API Services Service
 * 
 * Service for managing service lines using API backend instead of local storage
 */

import { 
  ServiceLine, 
  Service, 
  CreateServiceLineRequest, 
  UpdateServiceLineRequest,
  CreateServiceRequest,
  UpdateServiceRequest
} from '@/types';

export class ApiServicesService {
  private static instance: ApiServicesService;
  private baseUrl = '/api/services';

  private constructor() {}

  public static getInstance(): ApiServicesService {
    if (!ApiServicesService.instance) {
      ApiServicesService.instance = new ApiServicesService();
    }
    return ApiServicesService.instance;
  }

  // ==================== Service Lines ====================

  /**
   * Get all service lines
   */
  async getServiceLines(): Promise<ServiceLine[]> {
    try {
      const response = await fetch(`${this.baseUrl}/service-lines`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch service lines: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching service lines:', error);
      throw error;
    }
  }

  /**
   * Get service line by ID
   */
  async getServiceLineById(id: string): Promise<ServiceLine | null> {
    try {
      const response = await fetch(`${this.baseUrl}/service-lines/${id}`);
      
      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch service line: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching service line:', error);
      throw error;
    }
  }

  /**
   * Create a new service line
   */
  async createServiceLine(request: CreateServiceLineRequest): Promise<ServiceLine> {
    try {
      const response = await fetch(`${this.baseUrl}/service-lines`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to create service line: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error creating service line:', error);
      throw error;
    }
  }

  /**
   * Update a service line
   */
  async updateServiceLine(id: string, updates: UpdateServiceLineRequest): Promise<ServiceLine> {
    try {
      const response = await fetch(`${this.baseUrl}/service-lines/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to update service line: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error updating service line:', error);
      throw error;
    }
  }

  /**
   * Delete a service line
   */
  async deleteServiceLine(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/service-lines/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to delete service line: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting service line:', error);
      throw error;
    }
  }

  /**
   * Get active service lines
   */
  async getActiveServiceLines(): Promise<ServiceLine[]> {
    try {
      const response = await fetch(`${this.baseUrl}/service-lines?active=true`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch active service lines: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching active service lines:', error);
      throw error;
    }
  }

  // ==================== Services ====================

  /**
   * Get all services
   */
  async getServices(): Promise<Service[]> {
    try {
      const response = await fetch(`${this.baseUrl}/services`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch services: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching services:', error);
      throw error;
    }
  }

  /**
   * Create a new service
   */
  async createService(serviceData: CreateServiceRequest): Promise<Service> {
    try {
      const response = await fetch(`${this.baseUrl}/services`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(serviceData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to create service: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error creating service:', error);
      throw error;
    }
  }

  /**
   * Update a service
   */
  async updateService(id: string, updates: UpdateServiceRequest): Promise<Service> {
    try {
      const response = await fetch(`${this.baseUrl}/services/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to update service: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error updating service:', error);
      throw error;
    }
  }

  /**
   * Delete a service
   */
  async deleteService(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/services/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to delete service: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting service:', error);
      throw error;
    }
  }

  // ==================== Team Leaders (Placeholder methods - to be implemented) ====================

  /**
   * Get all team leaders (placeholder - to be implemented)
   */
  async getTeamLeaders(): Promise<any[]> {
    // TODO: Implement team leaders API
    console.warn('Team Leaders API not yet implemented, returning empty array');
    return [];
  }
}

// Export singleton instance
export const apiServicesService = ApiServicesService.getInstance();
