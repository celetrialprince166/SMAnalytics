/**
 * Clients Repository
 * 
 * Data access layer for client management
 */
import { Client, ClientFilters } from '@/types';
import { BaseRepository } from './BaseRepository';

export class ClientRepository extends BaseRepository<Client> {
  protected storageKey = 'clients' as const;

  async findByClientId(clientId: string): Promise<Client | null> {
    const clients = this.getAll();
    return clients.find(c => c.clientId === clientId) || null;
  }

  async findByStatus(status: string): Promise<Client[]> {
    const clients = this.getAll();
    return clients.filter(c => c.status === status);
  }

  async findActive(): Promise<Client[]> {
    const clients = this.getAll();
    return clients.filter(c => c.isActive);
  }

  async search(filters: ClientFilters): Promise<Client[]> {
    let clients = this.getAll();

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      clients = clients.filter(c =>
        c.companyName.toLowerCase().includes(searchTerm) ||
        c.clientId.toLowerCase().includes(searchTerm) ||
        c.contactPerson.toLowerCase().includes(searchTerm) ||
        c.emailAddress.toLowerCase().includes(searchTerm) ||
        c.phoneNumbers.includes(searchTerm)
      );
    }

    if (filters.status) {
      clients = clients.filter(c => c.status === filters.status);
    }

    if (filters.registrationDateFrom) {
      clients = clients.filter(c => 
        new Date(c.registrationDate) >= filters.registrationDateFrom!
      );
    }

    if (filters.registrationDateTo) {
      clients = clients.filter(c => 
        new Date(c.registrationDate) <= filters.registrationDateTo!
      );
    }

    return clients;
  }

  async getNextClientId(): Promise<string> {
    const clients = this.getAll();
    const maxNumber = clients.reduce((max, client) => {
      const match = client.clientId.match(/CLT-(\d+)/);
      if (match) {
        const num = parseInt(match[1]);
        return num > max ? num : max;
      }
      return max;
    }, 0);

    return `CLT-${String(maxNumber + 1).padStart(4, '0')}`;
  }
}

// Export singleton instance
export const clientRepository = new ClientRepository();
