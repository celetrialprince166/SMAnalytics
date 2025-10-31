/**
 * Clients Service
 * 
 * Business logic for client management
 */
import {
  Client,
  CreateClientRequest,
  UpdateClientRequest,
  ClientFilters,
  ClientSummary,
} from '@/types';
import { clientRepository } from '../repositories/ClientsRepository';

export class ClientsService {
  private static instance: ClientsService;

  private constructor() {}

  public static getInstance(): ClientsService {
    if (!ClientsService.instance) {
      ClientsService.instance = new ClientsService();
    }
    return ClientsService.instance;
  }

  /**
   * Create a new client
   */
  async createClient(request: CreateClientRequest): Promise<Client> {
    // Trim all string fields first
    const trimmedRequest = {
      ...request,
      companyName: request.companyName?.trim() || '',
      companyRegNo: request.companyRegNo?.trim(),
      address: request.address?.trim(),
      contactPerson: request.contactPerson?.trim() || '',
      emailAddress: request.emailAddress?.trim() || '',
      phoneNumbers: request.phoneNumbers?.trim() || '',
      remarks: request.remarks?.trim(),
    };

    // Validate
    const validation = this.validateClient(trimmedRequest);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    // Generate client ID
    const clientId = await clientRepository.getNextClientId();

    const client = await clientRepository.create({
      clientId,
      registrationDate: trimmedRequest.registrationDate,
      status: trimmedRequest.status,
      companyName: trimmedRequest.companyName,
      companyRegNo: trimmedRequest.companyRegNo,
      address: trimmedRequest.address,
      contactPerson: trimmedRequest.contactPerson,
      emailAddress: trimmedRequest.emailAddress,
      phoneNumbers: trimmedRequest.phoneNumbers,
      remarks: trimmedRequest.remarks,
      isActive: true,
    });

    return client;
  }

  /**
   * Update a client
   */
  async updateClient(id: string, updates: UpdateClientRequest): Promise<Client> {
    const existing = await clientRepository.findById(id);
    if (!existing) {
      throw new Error('Client not found');
    }

    // Validate updates if critical fields are being changed
    if (updates.companyName || updates.contactPerson || updates.emailAddress) {
      const validation = this.validateClient({
        registrationDate: updates.registrationDate || existing.registrationDate,
        status: updates.status || existing.status,
        companyName: updates.companyName || existing.companyName,
        contactPerson: updates.contactPerson || existing.contactPerson,
        emailAddress: updates.emailAddress || existing.emailAddress,
        phoneNumbers: updates.phoneNumbers || existing.phoneNumbers,
      } as CreateClientRequest);
      
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }
    }

    return await clientRepository.update(id, updates);
  }

  /**
   * Delete a client (soft delete)
   */
  async deleteClient(id: string): Promise<void> {
    const client = await clientRepository.findById(id);
    if (!client) {
      throw new Error('Client not found');
    }

    // Soft delete by setting isActive to false
    await clientRepository.update(id, { isActive: false });
  }

  /**
   * Get client by ID
   */
  async getClientById(id: string): Promise<Client | null> {
    return await clientRepository.findById(id);
  }

  /**
   * Get client by client ID
   */
  async getClientByClientId(clientId: string): Promise<Client | null> {
    return await clientRepository.findByClientId(clientId);
  }

  /**
   * Get all clients
   */
  async getClients(): Promise<Client[]> {
    return await clientRepository.findAll();
  }

  /**
   * Get active clients
   */
  async getActiveClients(): Promise<Client[]> {
    return await clientRepository.findActive();
  }

  /**
   * Search clients with filters
   */
  async searchClients(filters: ClientFilters): Promise<Client[]> {
    return await clientRepository.search(filters);
  }

  /**
   * Get client summaries for display
   */
  async getClientSummaries(): Promise<ClientSummary[]> {
    const clients = await this.getActiveClients();
    
    return clients.map(client => ({
      id: client.id,
      clientId: client.clientId,
      companyName: client.companyName,
      contactPerson: client.contactPerson,
      emailAddress: client.emailAddress,
      status: client.status,
    }));
  }

  /**
   * Get clients by status
   */
  async getClientsByStatus(status: string): Promise<Client[]> {
    return await clientRepository.findByStatus(status);
  }

  /**
   * Validate client data
   */
  private validateClient(data: CreateClientRequest): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!data.companyName || data.companyName.trim().length === 0) {
      errors.push('Company name is required');
    }

    if (!data.contactPerson || data.contactPerson.trim().length === 0) {
      errors.push('Contact person is required');
    }

    if (!data.emailAddress || data.emailAddress.trim().length === 0) {
      errors.push('Email address is required');
    } else if (!this.isValidEmail(data.emailAddress)) {
      errors.push('Invalid email format');
    }

    if (!data.phoneNumbers || data.phoneNumbers.trim().length === 0) {
      errors.push('Phone number is required');
    }

    if (!data.status) {
      errors.push('Status is required');
    }

    if (!data.registrationDate) {
      errors.push('Registration date is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

// Export singleton instance
export const clientsService = ClientsService.getInstance();
