/**
 * Services Repository
 * 
 * Data access layer for service line and service management
 */

import { ServiceLine, Service, TeamLeader } from '@/types';
import { BaseRepository } from './BaseRepository';

export class ServiceLineRepository extends BaseRepository<ServiceLine> {
  protected storageKey = 'serviceLines' as const;

  async findByName(name: string): Promise<ServiceLine | null> {
    const lines = this.getAll();
    return lines.find(l => l.name.toLowerCase() === name.toLowerCase()) || null;
  }

  async findActive(): Promise<ServiceLine[]> {
    const lines = this.getAll();
    return lines.filter(l => l.isActive);
  }
}

export class ServiceRepository extends BaseRepository<Service> {
  protected storageKey = 'services' as const;

  async findByServiceLine(serviceLineId: string): Promise<Service[]> {
    const services = this.getAll();
    return services.filter(s => s.serviceLineId === serviceLineId);
  }

  async findByCode(code: string): Promise<Service | null> {
    const services = this.getAll();
    return services.find(s => s.code === code) || null;
  }

  async findActive(): Promise<Service[]> {
    const services = this.getAll();
    return services.filter(s => s.isActive);
  }

  async getNextServiceCode(): Promise<string> {
    const services = this.getAll();
    const maxNumber = services.reduce((max, service) => {
      const match = service.code.match(/SRV-(\d+)/);
      if (match) {
        const num = parseInt(match[1]);
        return num > max ? num : max;
      }
      return max;
    }, 0);
    return `SRV-${String(maxNumber + 1).padStart(4, '0')}`;
  }
}

export class TeamLeaderRepository extends BaseRepository<TeamLeader> {
  protected storageKey = 'teamLeaders' as const;

  async findByEmployeeId(employeeId: string): Promise<TeamLeader | null> {
    const leaders = this.getAll();
    return leaders.find(l => l.employeeId === employeeId) || null;
  }

  async findActive(): Promise<TeamLeader[]> {
    const leaders = this.getAll();
    return leaders.filter(l => l.isActive);
  }
}

// Export singleton instances
export const serviceLineRepository = new ServiceLineRepository();
export const serviceRepository = new ServiceRepository();
export const teamLeaderRepository = new TeamLeaderRepository();
