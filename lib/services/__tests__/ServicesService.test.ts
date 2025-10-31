/**
 * Services Service Tests
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { servicesService } from '../ServicesService';

describe('ServicesService', () => {
  beforeEach(() => {
    // Clear storage before each test
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
  });

  describe('Service Lines', () => {
    it('should create a service line', async () => {
      const request = {
        name: 'Tax Services',
        description: 'All tax-related services',
      };

      const serviceLine = await servicesService.createServiceLine(request);

      expect(serviceLine).toBeDefined();
      expect(serviceLine.name).toBe('Tax Services');
      expect(serviceLine.description).toBe('All tax-related services');
      expect(serviceLine.isActive).toBe(true);
      expect(serviceLine.id).toBeDefined();
      expect(serviceLine.createdAt).toBeDefined();
    });

    it('should prevent duplicate service line names', async () => {
      await servicesService.createServiceLine({
        name: 'Tax Services',
        description: 'First one',
      });

      await expect(
        servicesService.createServiceLine({
          name: 'Tax Services',
          description: 'Duplicate',
        })
      ).rejects.toThrow('A service line with this name already exists');
    });

    it('should require service line name', async () => {
      await expect(
        servicesService.createServiceLine({
          name: '',
          description: 'No name',
        })
      ).rejects.toThrow('Service line name is required');
    });

    it('should update service line', async () => {
      const serviceLine = await servicesService.createServiceLine({
        name: 'Tax Services',
        description: 'Original description',
      });

      const updated = await servicesService.updateServiceLine(serviceLine.id, {
        name: 'Updated Tax Services',
        description: 'Updated description',
      });

      expect(updated.name).toBe('Updated Tax Services');
      expect(updated.description).toBe('Updated description');
    });

    it('should prevent duplicate names when updating', async () => {
      await servicesService.createServiceLine({
        name: 'Tax Services',
        description: 'First',
      });

      const second = await servicesService.createServiceLine({
        name: 'Audit Services',
        description: 'Second',
      });

      await expect(
        servicesService.updateServiceLine(second.id, {
          name: 'Tax Services',
        })
      ).rejects.toThrow('A service line with this name already exists');
    });

    it('should delete service line when no services exist', async () => {
      const serviceLine = await servicesService.createServiceLine({
        name: 'Tax Services',
        description: 'To be deleted',
      });

      await servicesService.deleteServiceLine(serviceLine.id);

      const retrieved = await servicesService.getServiceLineById(serviceLine.id);
      expect(retrieved).toBeNull();
    });

    it('should prevent deleting service line with existing services', async () => {
      const serviceLine = await servicesService.createServiceLine({
        name: 'Tax Services',
        description: 'Has services',
      });

      await servicesService.createService({
        serviceLineId: serviceLine.id,
        name: 'Corporate Tax',
        description: 'Corporate tax filing',
        averageFee: 1000,
      });

      await expect(
        servicesService.deleteServiceLine(serviceLine.id)
      ).rejects.toThrow('Cannot delete service line with existing services');
    });

    it('should get all service lines', async () => {
      await servicesService.createServiceLine({
        name: 'Tax Services',
        description: 'Tax',
      });

      await servicesService.createServiceLine({
        name: 'Audit Services',
        description: 'Audit',
      });

      const serviceLines = await servicesService.getServiceLines();
      expect(serviceLines.length).toBe(2);
    });

    it('should get active service lines only', async () => {
      const active = await servicesService.createServiceLine({
        name: 'Active Service',
        description: 'Active',
      });

      const inactive = await servicesService.createServiceLine({
        name: 'Inactive Service',
        description: 'Inactive',
      });

      await servicesService.updateServiceLine(inactive.id, { isActive: false });

      const activeLines = await servicesService.getActiveServiceLines();
      expect(activeLines.length).toBe(1);
      expect(activeLines[0].name).toBe('Active Service');
    });
  });

  describe('Services', () => {
    let testServiceLine: any;

    beforeEach(async () => {
      testServiceLine = await servicesService.createServiceLine({
        name: 'Test Service Line',
        description: 'For testing',
      });
    });

    it('should create a service with auto-generated code', async () => {
      const request = {
        serviceLineId: testServiceLine.id,
        name: 'Corporate Tax Filing',
        description: 'Annual corporate tax return preparation',
        averageFee: 5000,
        remarks: 'Includes consultation',
      };

      const service = await servicesService.createService(request);

      expect(service).toBeDefined();
      expect(service.code).toMatch(/SRV-\d{4}/);
      expect(service.name).toBe('Corporate Tax Filing');
      expect(service.description).toBe('Annual corporate tax return preparation');
      expect(service.averageFee).toBe(5000);
      expect(service.remarks).toBe('Includes consultation');
      expect(service.serviceLineId).toBe(testServiceLine.id);
      expect(service.isActive).toBe(true);
    });

    it('should generate sequential service codes', async () => {
      const service1 = await servicesService.createService({
        serviceLineId: testServiceLine.id,
        name: 'Service 1',
        description: 'First service',
        averageFee: 1000,
      });

      const service2 = await servicesService.createService({
        serviceLineId: testServiceLine.id,
        name: 'Service 2',
        description: 'Second service',
        averageFee: 2000,
      });

      expect(service1.code).toBe('SRV-0001');
      expect(service2.code).toBe('SRV-0002');
    });

    it('should validate service data', async () => {
      await expect(
        servicesService.createService({
          serviceLineId: testServiceLine.id,
          name: '',
          description: 'No name',
          averageFee: 1000,
        })
      ).rejects.toThrow('Service name is required');

      await expect(
        servicesService.createService({
          serviceLineId: testServiceLine.id,
          name: 'Valid Name',
          description: '',
          averageFee: 1000,
        })
      ).rejects.toThrow('Service description is required');

      await expect(
        servicesService.createService({
          serviceLineId: testServiceLine.id,
          name: 'Valid Name',
          description: 'Valid description',
          averageFee: -100,
        })
      ).rejects.toThrow('Average fee must be positive');

      await expect(
        servicesService.createService({
          serviceLineId: '',
          name: 'Valid Name',
          description: 'Valid description',
          averageFee: 1000,
        })
      ).rejects.toThrow('Service line is required');
    });

    it('should require valid service line', async () => {
      await expect(
        servicesService.createService({
          serviceLineId: 'invalid-id',
          name: 'Valid Name',
          description: 'Valid description',
          averageFee: 1000,
        })
      ).rejects.toThrow('Service line not found');
    });

    it('should update service', async () => {
      const service = await servicesService.createService({
        serviceLineId: testServiceLine.id,
        name: 'Original Name',
        description: 'Original description',
        averageFee: 1000,
      });

      const updated = await servicesService.updateService(service.id, {
        name: 'Updated Name',
        averageFee: 2000,
      });

      expect(updated.name).toBe('Updated Name');
      expect(updated.averageFee).toBe(2000);
      expect(updated.description).toBe('Original description'); // Unchanged
    });

    it('should validate updates', async () => {
      const service = await servicesService.createService({
        serviceLineId: testServiceLine.id,
        name: 'Test Service',
        description: 'Test description',
        averageFee: 1000,
      });

      await expect(
        servicesService.updateService(service.id, {
          averageFee: -500,
        })
      ).rejects.toThrow('Average fee must be positive');
    });

    it('should delete service', async () => {
      const service = await servicesService.createService({
        serviceLineId: testServiceLine.id,
        name: 'To Delete',
        description: 'Will be deleted',
        averageFee: 1000,
      });

      await servicesService.deleteService(service.id);

      const retrieved = await servicesService.getServiceById(service.id);
      expect(retrieved).toBeNull();
    });

    it('should get services by service line', async () => {
      const anotherLine = await servicesService.createServiceLine({
        name: 'Another Line',
        description: 'Another',
      });

      await servicesService.createService({
        serviceLineId: testServiceLine.id,
        name: 'Service 1',
        description: 'First',
        averageFee: 1000,
      });

      await servicesService.createService({
        serviceLineId: testServiceLine.id,
        name: 'Service 2',
        description: 'Second',
        averageFee: 2000,
      });

      await servicesService.createService({
        serviceLineId: anotherLine.id,
        name: 'Service 3',
        description: 'Third',
        averageFee: 3000,
      });

      const services = await servicesService.getServicesByLine(testServiceLine.id);
      expect(services.length).toBe(2);
    });

    it('should get service summaries', async () => {
      await servicesService.createService({
        serviceLineId: testServiceLine.id,
        name: 'Test Service',
        description: 'Test description',
        averageFee: 1000,
      });

      const summaries = await servicesService.getServiceSummaries();
      expect(summaries.length).toBe(1);
      expect(summaries[0].name).toBe('Test Service');
      expect(summaries[0].serviceLineName).toBe('Test Service Line');
      expect(summaries[0].averageFee).toBe(1000);
    });
  });

  describe('Team Leaders', () => {
    it('should create team leader', async () => {
      const teamLeader = await servicesService.createTeamLeader({
        employeeId: 'EMP001',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+233123456789',
        isActive: true,
      });

      expect(teamLeader).toBeDefined();
      expect(teamLeader.employeeId).toBe('EMP001');
      expect(teamLeader.name).toBe('John Doe');
      expect(teamLeader.email).toBe('john@example.com');
      expect(teamLeader.phone).toBe('+233123456789');
      expect(teamLeader.isActive).toBe(true);
    });

    it('should validate team leader data', async () => {
      await expect(
        servicesService.createTeamLeader({
          employeeId: 'EMP001',
          name: '',
          isActive: true,
        })
      ).rejects.toThrow('Team leader name is required');

      await expect(
        servicesService.createTeamLeader({
          employeeId: '',
          name: 'John Doe',
          isActive: true,
        })
      ).rejects.toThrow('Employee ID is required');
    });

    it('should prevent duplicate employee IDs', async () => {
      await servicesService.createTeamLeader({
        employeeId: 'EMP001',
        name: 'John Doe',
        isActive: true,
      });

      await expect(
        servicesService.createTeamLeader({
          employeeId: 'EMP001',
          name: 'Jane Doe',
          isActive: true,
        })
      ).rejects.toThrow('A team leader with this employee ID already exists');
    });

    it('should update team leader', async () => {
      const teamLeader = await servicesService.createTeamLeader({
        employeeId: 'EMP001',
        name: 'John Doe',
        isActive: true,
      });

      const updated = await servicesService.updateTeamLeader(teamLeader.id, {
        name: 'John Smith',
        email: 'john.smith@example.com',
      });

      expect(updated.name).toBe('John Smith');
      expect(updated.email).toBe('john.smith@example.com');
      expect(updated.employeeId).toBe('EMP001'); // Unchanged
    });

    it('should delete team leader', async () => {
      const teamLeader = await servicesService.createTeamLeader({
        employeeId: 'EMP001',
        name: 'John Doe',
        isActive: true,
      });

      await servicesService.deleteTeamLeader(teamLeader.id);

      const retrieved = await servicesService.getTeamLeaderById(teamLeader.id);
      expect(retrieved).toBeNull();
    });

    it('should get active team leaders', async () => {
      await servicesService.createTeamLeader({
        employeeId: 'EMP001',
        name: 'Active Leader',
        isActive: true,
      });

      await servicesService.createTeamLeader({
        employeeId: 'EMP002',
        name: 'Inactive Leader',
        isActive: false,
      });

      const activeLeaders = await servicesService.getActiveTeamLeaders();
      expect(activeLeaders.length).toBe(1);
      expect(activeLeaders[0].name).toBe('Active Leader');
    });
  });

  describe('Integration Tests', () => {
    it('should create service with team leader', async () => {
      const serviceLine = await servicesService.createServiceLine({
        name: 'Tax Services',
        description: 'Tax services',
      });

      const teamLeader = await servicesService.createTeamLeader({
        employeeId: 'EMP001',
        name: 'John Doe',
        isActive: true,
      });

      const service = await servicesService.createService({
        serviceLineId: serviceLine.id,
        name: 'Corporate Tax',
        description: 'Corporate tax filing',
        averageFee: 5000,
        teamLeaderId: teamLeader.id,
      });

      expect(service.teamLeaderId).toBe(teamLeader.id);

      const summaries = await servicesService.getServiceSummaries();
      expect(summaries[0].teamLeaderName).toBe('John Doe');
    });

    it('should handle service summaries without team leaders', async () => {
      const serviceLine = await servicesService.createServiceLine({
        name: 'Tax Services',
        description: 'Tax services',
      });

      await servicesService.createService({
        serviceLineId: serviceLine.id,
        name: 'Corporate Tax',
        description: 'Corporate tax filing',
        averageFee: 5000,
      });

      const summaries = await servicesService.getServiceSummaries();
      expect(summaries[0].teamLeaderName).toBeUndefined();
    });

    it('should maintain data consistency across operations', async () => {
      // Create service line
      const serviceLine = await servicesService.createServiceLine({
        name: 'Tax Services',
        description: 'Tax services',
      });

      // Create team leader
      const teamLeader = await servicesService.createTeamLeader({
        employeeId: 'EMP001',
        name: 'John Doe',
        isActive: true,
      });

      // Create multiple services
      const service1 = await servicesService.createService({
        serviceLineId: serviceLine.id,
        name: 'Corporate Tax',
        description: 'Corporate tax filing',
        averageFee: 5000,
        teamLeaderId: teamLeader.id,
      });

      const service2 = await servicesService.createService({
        serviceLineId: serviceLine.id,
        name: 'Personal Tax',
        description: 'Personal tax filing',
        averageFee: 1000,
      });

      // Verify relationships
      const servicesByLine = await servicesService.getServicesByLine(serviceLine.id);
      expect(servicesByLine.length).toBe(2);

      const summaries = await servicesService.getServiceSummaries();
      expect(summaries.length).toBe(2);
      expect(summaries.find(s => s.name === 'Corporate Tax')?.teamLeaderName).toBe('John Doe');
      expect(summaries.find(s => s.name === 'Personal Tax')?.teamLeaderName).toBeUndefined();
    });
  });
});
