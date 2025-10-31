/**
 * Services Service
 * 
 * Business logic for service line and service management
 */

import {
  ServiceLine,
  Service,
  TeamLeader,
  CreateServiceLineRequest,
  UpdateServiceLineRequest,
  CreateServiceRequest,
  UpdateServiceRequest,
  ServiceSummary,
} from '@/types';
import {
  serviceLineRepository,
  serviceRepository,
  teamLeaderRepository,
} from '../repositories/ServicesRepository';

export class ServicesService {
  private static instance: ServicesService;

  private constructor() {}

  public static getInstance(): ServicesService {
    if (!ServicesService.instance) {
      ServicesService.instance = new ServicesService();
    }
    return ServicesService.instance;
  }

  // ==================== Service Lines ====================

  /**
   * Create a new service line
   */
  async createServiceLine(request: CreateServiceLineRequest): Promise<ServiceLine> {
    // Validate
    if (!request.name || request.name.trim().length === 0) {
      throw new Error('Service line name is required');
    }

    // Check for duplicate name
    const existing = await serviceLineRepository.findByName(request.name);
    if (existing) {
      throw new Error('A service line with this name already exists');
    }

    const serviceLine = await serviceLineRepository.create({
      name: request.name.trim(),
      description: request.description?.trim(),
      isActive: true,
    });

    return serviceLine;
  }

  /**
   * Update a service line
   */
  async updateServiceLine(id: string, updates: UpdateServiceLineRequest): Promise<ServiceLine> {
    const existing = await serviceLineRepository.findById(id);
    if (!existing) {
      throw new Error('Service line not found');
    }

    // Check for duplicate name if name is being updated
    if (updates.name && updates.name !== existing.name) {
      const duplicate = await serviceLineRepository.findByName(updates.name);
      if (duplicate && duplicate.id !== id) {
        throw new Error('A service line with this name already exists');
      }
    }

    return await serviceLineRepository.update(id, updates);
  }

  /**
   * Delete a service line
   */
  async deleteServiceLine(id: string): Promise<void> {
    // Check if any services are using this line
    const services = await serviceRepository.findByServiceLine(id);
    if (services.length > 0) {
      throw new Error('Cannot delete service line with existing services');
    }

    await serviceLineRepository.delete(id);
  }

  /**
   * Get all service lines
   */
  async getServiceLines(): Promise<ServiceLine[]> {
    return await serviceLineRepository.findAll();
  }

  /**
   * Get active service lines
   */
  async getActiveServiceLines(): Promise<ServiceLine[]> {
    return await serviceLineRepository.findActive();
  }

  /**
   * Get service line by ID
   */
  async getServiceLineById(id: string): Promise<ServiceLine | null> {
    return await serviceLineRepository.findById(id);
  }

  // ==================== Services ====================

  /**
   * Create a new service
   */
  async createService(request: CreateServiceRequest): Promise<Service> {
    // Validate
    const validation = this.validateService(request);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    // Verify service line exists
    const serviceLine = await serviceLineRepository.findById(request.serviceLineId);
    if (!serviceLine) {
      throw new Error('Service line not found');
    }

    // Generate service code
    const code = await serviceRepository.getNextServiceCode();

    const service = await serviceRepository.create({
      code,
      serviceLineId: request.serviceLineId,
      name: request.name.trim(),
      description: request.description.trim(),
      averageFee: request.averageFee,
      remarks: request.remarks?.trim(),
      teamLeaderId: request.teamLeaderId,
      isActive: true,
    });

    return service;
  }

  /**
   * Update a service
   */
  async updateService(id: string, updates: UpdateServiceRequest): Promise<Service> {
    const existing = await serviceRepository.findById(id);
    if (!existing) {
      throw new Error('Service not found');
    }

    // Validate updates
    if (updates.averageFee !== undefined && updates.averageFee < 0) {
      throw new Error('Average fee must be positive');
    }

    return await serviceRepository.update(id, updates);
  }

  /**
   * Delete a service
   */
  async deleteService(id: string): Promise<void> {
    await serviceRepository.delete(id);
  }

  /**
   * Get all services
   */
  async getServices(): Promise<Service[]> {
    return await serviceRepository.findAll();
  }

  /**
   * Get active services
   */
  async getActiveServices(): Promise<Service[]> {
    return await serviceRepository.findActive();
  }

  /**
   * Get services by service line
   */
  async getServicesByLine(serviceLineId: string): Promise<Service[]> {
    return await serviceRepository.findByServiceLine(serviceLineId);
  }

  /**
   * Get service by ID
   */
  async getServiceById(id: string): Promise<Service | null> {
    return await serviceRepository.findById(id);
  }

  /**
   * Get service summaries for display
   */
  async getServiceSummaries(): Promise<ServiceSummary[]> {
    const services = await this.getActiveServices();
    const serviceLines = await this.getServiceLines();
    const teamLeaders = await this.getTeamLeaders();

    return services.map(service => {
      const serviceLine = serviceLines.find(sl => sl.id === service.serviceLineId);
      const teamLeader = service.teamLeaderId 
        ? teamLeaders.find(tl => tl.id === service.teamLeaderId)
        : undefined;

      return {
        id: service.id,
        code: service.code,
        name: service.name,
        serviceLineName: serviceLine?.name || 'Unknown',
        averageFee: service.averageFee,
        teamLeaderName: teamLeader?.name,
      };
    });
  }

  // ==================== Team Leaders ====================

  /**
   * Create a new team leader
   */
  async createTeamLeader(data: Omit<TeamLeader, 'id' | 'createdAt' | 'updatedAt'>): Promise<TeamLeader> {
    // Validate
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Team leader name is required');
    }

    if (!data.employeeId || data.employeeId.trim().length === 0) {
      throw new Error('Employee ID is required');
    }

    // Check for duplicate employee ID
    const existing = await teamLeaderRepository.findByEmployeeId(data.employeeId);
    if (existing) {
      throw new Error('A team leader with this employee ID already exists');
    }

    return await teamLeaderRepository.create(data);
  }

  /**
   * Update a team leader
   */
  async updateTeamLeader(id: string, updates: Partial<TeamLeader>): Promise<TeamLeader> {
    const existing = await teamLeaderRepository.findById(id);
    if (!existing) {
      throw new Error('Team leader not found');
    }

    return await teamLeaderRepository.update(id, updates);
  }

  /**
   * Delete a team leader
   */
  async deleteTeamLeader(id: string): Promise<void> {
    await teamLeaderRepository.delete(id);
  }

  /**
   * Get all team leaders
   */
  async getTeamLeaders(): Promise<TeamLeader[]> {
    return await teamLeaderRepository.findAll();
  }

  /**
   * Get active team leaders
   */
  async getActiveTeamLeaders(): Promise<TeamLeader[]> {
    return await teamLeaderRepository.findActive();
  }

  /**
   * Get team leader by ID
   */
  async getTeamLeaderById(id: string): Promise<TeamLeader | null> {
    return await teamLeaderRepository.findById(id);
  }

  // ==================== Validation ====================

  /**
   * Validate service data
   */
  private validateService(data: CreateServiceRequest): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!data.name || data.name.trim().length === 0) {
      errors.push('Service name is required');
    }

    if (!data.description || data.description.trim().length === 0) {
      errors.push('Service description is required');
    }

    if (data.averageFee < 0) {
      errors.push('Average fee must be positive');
    }

    if (!data.serviceLineId) {
      errors.push('Service line is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

// Export singleton instance
export const servicesService = ServicesService.getInstance();
