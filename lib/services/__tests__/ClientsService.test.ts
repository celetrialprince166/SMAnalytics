/**
 * Clients Service Tests
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { clientsService } from '../ClientsService';
import { clientRepository } from '../../repositories/ClientsRepository';

describe('ClientsService', () => {
  beforeEach(() => {
    // Clear storage before each test
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
  });

  describe('Client Creation', () => {
    it('should create a client with auto-generated client ID', async () => {
      const request = {
        registrationDate: new Date('2024-01-15'),
        status: 'ACTIVE' as const,
        companyName: 'Acme Corporation',
        companyRegNo: 'REG123456',
        address: '123 Main Street, Accra',
        contactPerson: 'John Doe',
        emailAddress: 'john@acme.com',
        phoneNumbers: '+233 24 123 4567',
        remarks: 'New client from referral',
      };

      const client = await clientsService.createClient(request);

      expect(client).toBeDefined();
      expect(client.clientId).toMatch(/CLT-\d{4}/);
      expect(client.companyName).toBe('Acme Corporation');
      expect(client.contactPerson).toBe('John Doe');
      expect(client.emailAddress).toBe('john@acme.com');
      expect(client.status).toBe('ACTIVE');
      expect(client.isActive).toBe(true);
      expect(client.id).toBeDefined();
      expect(client.createdAt).toBeDefined();
    });

    it('should generate sequential client IDs', async () => {
      const client1 = await clientsService.createClient({
        registrationDate: new Date(),
        status: 'ACTIVE',
        companyName: 'Company 1',
        contactPerson: 'Person 1',
        emailAddress: 'person1@company1.com',
        phoneNumbers: '+233 24 111 1111',
      });

      const client2 = await clientsService.createClient({
        registrationDate: new Date(),
        status: 'ACTIVE',
        companyName: 'Company 2',
        contactPerson: 'Person 2',
        emailAddress: 'person2@company2.com',
        phoneNumbers: '+233 24 222 2222',
      });

      expect(client1.clientId).toBe('CLT-0001');
      expect(client2.clientId).toBe('CLT-0002');
    });

    it('should validate required fields', async () => {
      await expect(
        clientsService.createClient({
          registrationDate: new Date(),
          status: 'ACTIVE',
          companyName: '',
          contactPerson: 'John Doe',
          emailAddress: 'john@example.com',
          phoneNumbers: '+233 24 123 4567',
        })
      ).rejects.toThrow('Company name is required');

      await expect(
        clientsService.createClient({
          registrationDate: new Date(),
          status: 'ACTIVE',
          companyName: 'Acme Corp',
          contactPerson: '',
          emailAddress: 'john@example.com',
          phoneNumbers: '+233 24 123 4567',
        })
      ).rejects.toThrow('Contact person is required');

      await expect(
        clientsService.createClient({
          registrationDate: new Date(),
          status: 'ACTIVE',
          companyName: 'Acme Corp',
          contactPerson: 'John Doe',
          emailAddress: '',
          phoneNumbers: '+233 24 123 4567',
        })
      ).rejects.toThrow('Email address is required');

      await expect(
        clientsService.createClient({
          registrationDate: new Date(),
          status: 'ACTIVE',
          companyName: 'Acme Corp',
          contactPerson: 'John Doe',
          emailAddress: 'john@example.com',
          phoneNumbers: '',
        })
      ).rejects.toThrow('Phone number is required');
    });

    it('should validate email format', async () => {
      await expect(
        clientsService.createClient({
          registrationDate: new Date(),
          status: 'ACTIVE',
          companyName: 'Acme Corp',
          contactPerson: 'John Doe',
          emailAddress: 'invalid-email',
          phoneNumbers: '+233 24 123 4567',
        })
      ).rejects.toThrow('Invalid email format');
    });

    it('should trim whitespace from fields', async () => {
      const client = await clientsService.createClient({
        registrationDate: new Date(),
        status: 'ACTIVE',
        companyName: '  Acme Corp  ',
        contactPerson: '  John Doe  ',
        emailAddress: '  john@acme.com  ',
        phoneNumbers: '  +233 24 123 4567  ',
        remarks: '  Some remarks  ',
      });

      expect(client.companyName).toBe('Acme Corp');
      expect(client.contactPerson).toBe('John Doe');
      expect(client.emailAddress).toBe('john@acme.com');
      expect(client.phoneNumbers).toBe('+233 24 123 4567');
      expect(client.remarks).toBe('Some remarks');
    });
  });

  describe('Client Updates', () => {
    it('should update client information', async () => {
      const client = await clientsService.createClient({
        registrationDate: new Date('2024-01-15'),
        status: 'ACTIVE',
        companyName: 'Acme Corp',
        contactPerson: 'John Doe',
        emailAddress: 'john@acme.com',
        phoneNumbers: '+233 24 123 4567',
      });

      const updated = await clientsService.updateClient(client.id, {
        companyName: 'Acme Corporation Ltd',
        contactPerson: 'Jane Smith',
        status: 'INACTIVE',
      });

      expect(updated.companyName).toBe('Acme Corporation Ltd');
      expect(updated.contactPerson).toBe('Jane Smith');
      expect(updated.status).toBe('INACTIVE');
      expect(updated.emailAddress).toBe('john@acme.com'); // Unchanged
    });

    it('should validate updates', async () => {
      const client = await clientsService.createClient({
        registrationDate: new Date(),
        status: 'ACTIVE',
        companyName: 'Acme Corp',
        contactPerson: 'John Doe',
        emailAddress: 'john@acme.com',
        phoneNumbers: '+233 24 123 4567',
      });

      await expect(
        clientsService.updateClient(client.id, {
          emailAddress: 'invalid-email',
        })
      ).rejects.toThrow('Invalid email format');
    });

    it('should throw error for non-existent client', async () => {
      await expect(
        clientsService.updateClient('non-existent-id', {
          companyName: 'Updated Name',
        })
      ).rejects.toThrow('Client not found');
    });
  });

  describe('Client Deletion', () => {
    it('should soft delete a client', async () => {
      const client = await clientsService.createClient({
        registrationDate: new Date(),
        status: 'ACTIVE',
        companyName: 'Acme Corp',
        contactPerson: 'John Doe',
        emailAddress: 'john@acme.com',
        phoneNumbers: '+233 24 123 4567',
      });

      await clientsService.deleteClient(client.id);

      const retrieved = await clientsService.getClientById(client.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.isActive).toBe(false);
    });

    it('should throw error when deleting non-existent client', async () => {
      await expect(
        clientsService.deleteClient('non-existent-id')
      ).rejects.toThrow('Client not found');
    });
  });

  describe('Client Retrieval', () => {
    beforeEach(async () => {
      // Create test clients
      await clientsService.createClient({
        registrationDate: new Date('2024-01-15'),
        status: 'ACTIVE',
        companyName: 'Acme Corporation',
        contactPerson: 'John Doe',
        emailAddress: 'john@acme.com',
        phoneNumbers: '+233 24 123 4567',
      });

      await clientsService.createClient({
        registrationDate: new Date('2024-02-20'),
        status: 'INACTIVE',
        companyName: 'Beta Industries',
        contactPerson: 'Jane Smith',
        emailAddress: 'jane@beta.com',
        phoneNumbers: '+233 24 234 5678',
      });

      await clientsService.createClient({
        registrationDate: new Date('2024-03-10'),
        status: 'SUSPENDED',
        companyName: 'Gamma Services',
        contactPerson: 'Bob Johnson',
        emailAddress: 'bob@gamma.com',
        phoneNumbers: '+233 24 345 6789',
      });
    });

    it('should get all clients', async () => {
      const clients = await clientsService.getClients();
      expect(clients.length).toBe(3);
    });

    it('should get active clients only', async () => {
      const activeClients = await clientsService.getActiveClients();
      expect(activeClients.length).toBe(3); // All are active (isActive=true)
    });

    it('should get client by ID', async () => {
      const clients = await clientsService.getClients();
      const client = await clientsService.getClientById(clients[0].id);
      
      expect(client).toBeDefined();
      expect(client?.companyName).toBe('Acme Corporation');
    });

    it('should get client by client ID', async () => {
      const client = await clientsService.getClientByClientId('CLT-0001');
      
      expect(client).toBeDefined();
      expect(client?.companyName).toBe('Acme Corporation');
    });

    it('should return null for non-existent client', async () => {
      const client = await clientsService.getClientById('non-existent-id');
      expect(client).toBeNull();
    });

    it('should get clients by status', async () => {
      const activeClients = await clientsService.getClientsByStatus('ACTIVE');
      const inactiveClients = await clientsService.getClientsByStatus('INACTIVE');
      const suspendedClients = await clientsService.getClientsByStatus('SUSPENDED');

      expect(activeClients.length).toBe(1);
      expect(inactiveClients.length).toBe(1);
      expect(suspendedClients.length).toBe(1);
    });
  });

  describe('Client Search', () => {
    beforeEach(async () => {
      await clientsService.createClient({
        registrationDate: new Date('2024-01-15'),
        status: 'ACTIVE',
        companyName: 'Acme Corporation',
        contactPerson: 'John Doe',
        emailAddress: 'john@acme.com',
        phoneNumbers: '+233 24 123 4567',
      });

      await clientsService.createClient({
        registrationDate: new Date('2024-02-20'),
        status: 'INACTIVE',
        companyName: 'Beta Industries',
        contactPerson: 'Jane Smith',
        emailAddress: 'jane@beta.com',
        phoneNumbers: '+233 24 234 5678',
      });

      await clientsService.createClient({
        registrationDate: new Date('2024-03-10'),
        status: 'ACTIVE',
        companyName: 'Gamma Services',
        contactPerson: 'Bob Johnson',
        emailAddress: 'bob@gamma.com',
        phoneNumbers: '+233 24 345 6789',
      });
    });

    it('should search by company name', async () => {
      const results = await clientsService.searchClients({
        search: 'Acme',
      });

      expect(results.length).toBe(1);
      expect(results[0].companyName).toBe('Acme Corporation');
    });

    it('should search by contact person', async () => {
      const results = await clientsService.searchClients({
        search: 'Jane',
      });

      expect(results.length).toBe(1);
      expect(results[0].contactPerson).toBe('Jane Smith');
    });

    it('should search by email', async () => {
      const results = await clientsService.searchClients({
        search: 'bob@gamma',
      });

      expect(results.length).toBe(1);
      expect(results[0].emailAddress).toBe('bob@gamma.com');
    });

    it('should search by phone number', async () => {
      const results = await clientsService.searchClients({
        search: '234 5678',
      });

      expect(results.length).toBe(1);
      expect(results[0].phoneNumbers).toBe('+233 24 234 5678');
    });

    it('should search by client ID', async () => {
      const results = await clientsService.searchClients({
        search: 'CLT-0002',
      });

      expect(results.length).toBe(1);
      expect(results[0].clientId).toBe('CLT-0002');
    });

    it('should filter by status', async () => {
      const results = await clientsService.searchClients({
        status: 'ACTIVE',
      });

      expect(results.length).toBe(2);
      expect(results.every(c => c.status === 'ACTIVE')).toBe(true);
    });

    it('should filter by registration date range', async () => {
      const results = await clientsService.searchClients({
        registrationDateFrom: new Date('2024-02-01'),
        registrationDateTo: new Date('2024-02-28'),
      });

      expect(results.length).toBe(1);
      expect(results[0].companyName).toBe('Beta Industries');
    });

    it('should combine multiple filters', async () => {
      const results = await clientsService.searchClients({
        search: 'Services',
        status: 'ACTIVE',
      });

      expect(results.length).toBe(1);
      expect(results[0].companyName).toBe('Gamma Services');
    });

    it('should return empty array when no matches', async () => {
      const results = await clientsService.searchClients({
        search: 'NonExistent',
      });

      expect(results.length).toBe(0);
    });

    it('should be case-insensitive', async () => {
      const results = await clientsService.searchClients({
        search: 'ACME',
      });

      expect(results.length).toBe(1);
      expect(results[0].companyName).toBe('Acme Corporation');
    });
  });

  describe('Client Summaries', () => {
    it('should get client summaries', async () => {
      await clientsService.createClient({
        registrationDate: new Date(),
        status: 'ACTIVE',
        companyName: 'Acme Corp',
        contactPerson: 'John Doe',
        emailAddress: 'john@acme.com',
        phoneNumbers: '+233 24 123 4567',
      });

      const summaries = await clientsService.getClientSummaries();

      expect(summaries.length).toBe(1);
      expect(summaries[0].clientId).toBe('CLT-0001');
      expect(summaries[0].companyName).toBe('Acme Corp');
      expect(summaries[0].contactPerson).toBe('John Doe');
      expect(summaries[0].emailAddress).toBe('john@acme.com');
      expect(summaries[0].status).toBe('ACTIVE');
    });

    it('should only include active clients in summaries', async () => {
      const client1 = await clientsService.createClient({
        registrationDate: new Date(),
        status: 'ACTIVE',
        companyName: 'Active Corp',
        contactPerson: 'John Doe',
        emailAddress: 'john@active.com',
        phoneNumbers: '+233 24 123 4567',
      });

      const client2 = await clientsService.createClient({
        registrationDate: new Date(),
        status: 'ACTIVE',
        companyName: 'Inactive Corp',
        contactPerson: 'Jane Smith',
        emailAddress: 'jane@inactive.com',
        phoneNumbers: '+233 24 234 5678',
      });

      // Soft delete one client
      await clientsService.deleteClient(client2.id);

      const summaries = await clientsService.getClientSummaries();

      expect(summaries.length).toBe(1);
      expect(summaries[0].companyName).toBe('Active Corp');
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete client lifecycle', async () => {
      // Create
      const client = await clientsService.createClient({
        registrationDate: new Date('2024-01-15'),
        status: 'ACTIVE',
        companyName: 'Test Corporation',
        companyRegNo: 'REG123',
        address: '123 Test Street',
        contactPerson: 'Test Person',
        emailAddress: 'test@test.com',
        phoneNumbers: '+233 24 123 4567',
        remarks: 'Test client',
      });

      expect(client.clientId).toBe('CLT-0001');
      expect(client.isActive).toBe(true);

      // Update
      const updated = await clientsService.updateClient(client.id, {
        status: 'INACTIVE',
        remarks: 'Updated remarks',
      });

      expect(updated.status).toBe('INACTIVE');
      expect(updated.remarks).toBe('Updated remarks');

      // Retrieve
      const retrieved = await clientsService.getClientById(client.id);
      expect(retrieved?.status).toBe('INACTIVE');

      // Search
      const searchResults = await clientsService.searchClients({
        search: 'Test Corporation',
      });
      expect(searchResults.length).toBe(1);

      // Delete
      await clientsService.deleteClient(client.id);
      const deleted = await clientsService.getClientById(client.id);
      expect(deleted?.isActive).toBe(false);
    });

    it('should maintain data consistency across operations', async () => {
      // Create multiple clients
      const client1 = await clientsService.createClient({
        registrationDate: new Date('2024-01-15'),
        status: 'ACTIVE',
        companyName: 'Company A',
        contactPerson: 'Person A',
        emailAddress: 'a@company.com',
        phoneNumbers: '+233 24 111 1111',
      });

      const client2 = await clientsService.createClient({
        registrationDate: new Date('2024-02-20'),
        status: 'INACTIVE',
        companyName: 'Company B',
        contactPerson: 'Person B',
        emailAddress: 'b@company.com',
        phoneNumbers: '+233 24 222 2222',
      });

      const client3 = await clientsService.createClient({
        registrationDate: new Date('2024-03-10'),
        status: 'ACTIVE',
        companyName: 'Company C',
        contactPerson: 'Person C',
        emailAddress: 'c@company.com',
        phoneNumbers: '+233 24 333 3333',
      });

      // Verify all clients exist
      const allClients = await clientsService.getClients();
      expect(allClients.length).toBe(3);

      // Verify status filtering
      const activeClients = await clientsService.getClientsByStatus('ACTIVE');
      expect(activeClients.length).toBe(2);

      // Verify search
      const searchResults = await clientsService.searchClients({
        search: 'Company',
      });
      expect(searchResults.length).toBe(3);

      // Delete one and verify
      await clientsService.deleteClient(client2.id);
      const activeAfterDelete = await clientsService.getActiveClients();
      expect(activeAfterDelete.length).toBe(2);
    });
  });
});
