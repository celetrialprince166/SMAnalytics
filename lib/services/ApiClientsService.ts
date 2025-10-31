/**
 * API Clients Service
 * 
 * Service for managing clients using API backend instead of local storage
 */

import {
  Client,
  CreateClientRequest,
  UpdateClientRequest,
  ClientFilters,
  ClientSummary,
} from '@/types';

export class ApiClientsService {
  private static instance: ApiClientsService;
  private baseUrl = '/api/clients';

  private constructor() {}

  public static getInstance(): ApiClientsService {
    if (!ApiClientsService.instance) {
      ApiClientsService.instance = new ApiClientsService();
    }
    return ApiClientsService.instance;
  }

  /**
   * Create a new client
   */
  async createClient(request: CreateClientRequest): Promise<Client> {
    try {
      const response = await fetch(`${this.baseUrl}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...request,
          organizationId: '7224ab64-5bd7-4382-839d-6c415d872ba7', // Default org
          registrationDate: request.registrationDate.toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `Failed to create client: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error creating client:', error);
      throw error;
    }
  }

  /**
   * Update a client
   */
  async updateClient(id: string, updates: UpdateClientRequest): Promise<Client> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...updates,
          ...(updates.registrationDate && {
            registrationDate: updates.registrationDate.toISOString(),
          }),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `Failed to update client: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error updating client:', error);
      throw error;
    }
  }

  /**
   * Delete a client (soft delete)
   */
  async deleteClient(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `Failed to delete client: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting client:', error);
      throw error;
    }
  }

  /**
   * Get client by ID
   */
  async getClientById(id: string): Promise<Client | null> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`);

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Failed to fetch client: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching client:', error);
      throw error;
    }
  }

  /**
   * Get client by client ID
   */
  async getClientByClientId(clientId: string): Promise<Client | null> {
    try {
      const clients = await this.getClients();
      return clients.find(client => client.clientId === clientId) || null;
    } catch (error) {
      console.error('Error fetching client by client ID:', error);
      throw error;
    }
  }

  /**
   * Get all clients
   */
  async getClients(): Promise<Client[]> {
    try {
      const response = await fetch(`${this.baseUrl}?organizationId=7224ab64-5bd7-4382-839d-6c415d872ba7&limit=1000`);

      if (!response.ok) {
        throw new Error(`Failed to fetch clients: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data?.data || [];
    } catch (error) {
      console.error('Error fetching clients:', error);
      throw error;
    }
  }

  /**
   * Get active clients
   */
  async getActiveClients(): Promise<Client[]> {
    try {
      const response = await fetch(`${this.baseUrl}?organizationId=7224ab64-5bd7-4382-839d-6c415d872ba7&isActive=true&limit=1000`);

      if (!response.ok) {
        throw new Error(`Failed to fetch active clients: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data?.data || [];
    } catch (error) {
      console.error('Error fetching active clients:', error);
      throw error;
    }
  }

  /**
   * Search clients with filters
   */
  async searchClients(filters: ClientFilters): Promise<Client[]> {
    try {
      const params = new URLSearchParams({
        organizationId: '7224ab64-5bd7-4382-839d-6c415d872ba7',
        limit: '1000',
      });

      if (filters.search) {
        params.append('search', filters.search);
      }
      if (filters.status) {
        params.append('status', filters.status);
      }
      if (filters.registrationDateFrom) {
        params.append('dateFrom', filters.registrationDateFrom.toISOString());
      }
      if (filters.registrationDateTo) {
        params.append('dateTo', filters.registrationDateTo.toISOString());
      }

      const response = await fetch(`${this.baseUrl}?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Failed to search clients: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data?.data || [];
    } catch (error) {
      console.error('Error searching clients:', error);
      throw error;
    }
  }

  /**
   * Get client summaries for display
   */
  async getClientSummaries(): Promise<ClientSummary[]> {
    try {
      const clients = await this.getActiveClients();
      
      return clients.map(client => ({
        id: client.id,
        clientId: client.clientId,
        companyName: client.companyName,
        contactPerson: client.contactPerson,
        emailAddress: client.emailAddress,
        status: client.status,
      }));
    } catch (error) {
      console.error('Error getting client summaries:', error);
      throw error;
    }
  }

  /**
   * Get clients by status
   */
  async getClientsByStatus(status: string): Promise<Client[]> {
    try {
      const response = await fetch(`${this.baseUrl}?organizationId=7224ab64-5bd7-4382-839d-6c415d872ba7&status=${status}&limit=1000`);

      if (!response.ok) {
        throw new Error(`Failed to fetch clients by status: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data?.data || [];
    } catch (error) {
      console.error('Error fetching clients by status:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const apiClientsService = ApiClientsService.getInstance();
