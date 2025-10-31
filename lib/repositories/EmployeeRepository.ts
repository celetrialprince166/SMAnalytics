/**
 * Employee Repository
 * 
 * Data access layer for employee management
 */
import { Employee, EmployeeFilters } from '@/types';
import { BaseRepository } from './BaseRepository';

export class EmployeeRepository extends BaseRepository<Employee> {
  protected storageKey = 'employees' as const;

  async findByEmployeeId(employeeId: string): Promise<Employee | null> {
    const employees = this.getAll();
    return employees.find(e => e.employeeId === employeeId) || null;
  }

  async findByDepartment(department: string): Promise<Employee[]> {
    const employees = this.getAll();
    return employees.filter(e => e.department === department);
  }

  async findByPosition(position: string): Promise<Employee[]> {
    const employees = this.getAll();
    return employees.filter(e => e.position === position);
  }

  async findByStatus(status: string): Promise<Employee[]> {
    const employees = this.getAll();
    return employees.filter(e => e.status === status);
  }

  async findActive(): Promise<Employee[]> {
    const employees = this.getAll();
    return employees.filter(e => e.isActive && e.status === 'ACTIVE');
  }

  async search(filters: EmployeeFilters): Promise<Employee[]> {
    let employees = this.getAll();

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      employees = employees.filter(e =>
        e.employeeId.toLowerCase().includes(searchTerm) ||
        e.firstName.toLowerCase().includes(searchTerm) ||
        e.surname.toLowerCase().includes(searchTerm) ||
        e.emailAddress?.toLowerCase().includes(searchTerm) ||
        e.phoneNumber?.includes(searchTerm)
      );
    }

    if (filters.department) {
      employees = employees.filter(e => e.department === filters.department);
    }

    if (filters.status) {
      employees = employees.filter(e => e.status === filters.status);
    }

    if (filters.entryDateFrom) {
      employees = employees.filter(e => 
        new Date(e.entryDate) >= filters.entryDateFrom!
      );
    }

    if (filters.entryDateTo) {
      employees = employees.filter(e => 
        new Date(e.entryDate) <= filters.entryDateTo!
      );
    }

    return employees;
  }

  async getNextEmployeeId(): Promise<string> {
    const employees = this.getAll();
    const maxNumber = employees.reduce((max, employee) => {
      const match = employee.employeeId.match(/EMP-(\d+)/);
      if (match) {
        const num = parseInt(match[1]);
        return num > max ? num : max;
      }
      return max;
    }, 0);

    return `EMP-${String(maxNumber + 1).padStart(4, '0')}`;
  }

  async getDepartments(): Promise<string[]> {
    const employees = this.getAll();
    const departments = new Set<string>();
    employees.forEach(e => {
      if (e.department) {
        departments.add(e.department);
      }
    });
    return Array.from(departments).sort();
  }

  async getPositions(): Promise<string[]> {
    const employees = this.getAll();
    const positions = new Set<string>();
    employees.forEach(e => {
      if (e.position) {
        positions.add(e.position);
      }
    });
    return Array.from(positions).sort();
  }

  async getTotalActiveEmployees(): Promise<number> {
    const employees = await this.findActive();
    return employees.length;
  }
}

// Export singleton instance
export const employeeRepository = new EmployeeRepository();
