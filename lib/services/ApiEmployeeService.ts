/**
 * API Employee Service
 * 
 * Handles employee management via API endpoints
 */

import {
  Employee,
  CreateEmployeeRequest,
  UpdateEmployeeRequest,
  EmployeeFilters,
  EmployeeSummary,
} from '@/types';

export class ApiEmployeeService {
  private static instance: ApiEmployeeService;
  private baseUrl = '/api/employees';

  private constructor() {}

  public static getInstance(): ApiEmployeeService {
    if (!ApiEmployeeService.instance) {
      ApiEmployeeService.instance = new ApiEmployeeService();
    }
    return ApiEmployeeService.instance;
  }

  /**
   * Create a new employee
   */
  async createEmployee(request: CreateEmployeeRequest): Promise<Employee> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `Failed to create employee: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error creating employee:', error);
      throw error;
    }
  }

  /**
   * Update an employee
   */
  async updateEmployee(id: string, updates: UpdateEmployeeRequest): Promise<Employee> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `Failed to update employee: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error updating employee:', error);
      throw error;
    }
  }

  /**
   * Delete an employee (soft delete)
   */
  async deleteEmployee(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `Failed to delete employee: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting employee:', error);
      throw error;
    }
  }

  /**
   * Get employee by ID
   */
  async getEmployeeById(id: string): Promise<Employee | null> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`);

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `Failed to fetch employee: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching employee:', error);
      throw error;
    }
  }

  /**
   * Get employee by employee ID
   */
  async getEmployeeByEmployeeId(employeeId: string): Promise<Employee | null> {
    try {
      const employees = await this.getEmployees();
      return employees.find(e => e.employeeId === employeeId) || null;
    } catch (error) {
      console.error('Error fetching employee by employee ID:', error);
      throw error;
    }
  }

  /**
   * Get all employees
   */
  async getEmployees(): Promise<Employee[]> {
    try {
      const response = await fetch(this.baseUrl);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `Failed to fetch employees: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('Error fetching employees:', error);
      throw error;
    }
  }

  /**
   * Get active employees
   */
  async getActiveEmployees(): Promise<Employee[]> {
    try {
      const employees = await this.getEmployees();
      return employees.filter(e => e.isActive && e.status === 'ACTIVE');
    } catch (error) {
      console.error('Error fetching active employees:', error);
      throw error;
    }
  }

  /**
   * Search employees with filters
   */
  async searchEmployees(filters: EmployeeFilters): Promise<Employee[]> {
    try {
      const employees = await this.getEmployees();
      let filtered = employees;

      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        filtered = filtered.filter(e =>
          e.employeeId.toLowerCase().includes(searchTerm) ||
          e.firstName.toLowerCase().includes(searchTerm) ||
          e.surname.toLowerCase().includes(searchTerm) ||
          e.emailAddress?.toLowerCase().includes(searchTerm) ||
          e.phoneNumber?.includes(searchTerm)
        );
      }

      if (filters.department) {
        filtered = filtered.filter(e => e.department === filters.department);
      }

      if (filters.status) {
        filtered = filtered.filter(e => e.status === filters.status);
      }

      if (filters.entryDateFrom) {
        filtered = filtered.filter(e => 
          new Date(e.entryDate) >= filters.entryDateFrom!
        );
      }

      if (filters.entryDateTo) {
        filtered = filtered.filter(e => 
          new Date(e.entryDate) <= filters.entryDateTo!
        );
      }

      return filtered;
    } catch (error) {
      console.error('Error searching employees:', error);
      throw error;
    }
  }

  /**
   * Get employee summaries for display
   */
  async getEmployeeSummaries(): Promise<EmployeeSummary[]> {
    try {
      const employees = await this.getActiveEmployees();
      
      return employees.map(employee => ({
        id: employee.id,
        employeeId: employee.employeeId,
        fullName: `${employee.firstName} ${employee.surname}`,
        department: employee.department || '',
        position: employee.position || '',
        emailAddress: employee.emailAddress,
        phoneNumber: employee.phoneNumber,
        basicSalary: employee.basicSalary,
        status: employee.status,
      }));
    } catch (error) {
      console.error('Error fetching employee summaries:', error);
      throw error;
    }
  }

  /**
   * Get employees by department
   */
  async getEmployeesByDepartment(department: string): Promise<Employee[]> {
    try {
      const employees = await this.getEmployees();
      return employees.filter(e => e.department === department);
    } catch (error) {
      console.error('Error fetching employees by department:', error);
      throw error;
    }
  }

  /**
   * Get employees by position
   */
  async getEmployeesByPosition(position: string): Promise<Employee[]> {
    try {
      const employees = await this.getEmployees();
      return employees.filter(e => e.position === position);
    } catch (error) {
      console.error('Error fetching employees by position:', error);
      throw error;
    }
  }

  /**
   * Get employees by status
   */
  async getEmployeesByStatus(status: string): Promise<Employee[]> {
    try {
      const employees = await this.getEmployees();
      return employees.filter(e => e.status === status);
    } catch (error) {
      console.error('Error fetching employees by status:', error);
      throw error;
    }
  }

  /**
   * Get all departments
   */
  async getDepartments(): Promise<string[]> {
    try {
      const employees = await this.getEmployees();
      const departments = new Set<string>();
      employees.forEach(e => {
        if (e.department) {
          departments.add(e.department);
        }
      });
      return Array.from(departments).sort();
    } catch (error) {
      console.error('Error fetching departments:', error);
      throw error;
    }
  }

  /**
   * Get all positions
   */
  async getPositions(): Promise<string[]> {
    try {
      const employees = await this.getEmployees();
      const positions = new Set<string>();
      employees.forEach(e => {
        if (e.position) {
          positions.add(e.position);
        }
      });
      return Array.from(positions).sort();
    } catch (error) {
      console.error('Error fetching positions:', error);
      throw error;
    }
  }

  /**
   * Get total active employees count
   */
  async getTotalActiveEmployees(): Promise<number> {
    try {
      const employees = await this.getActiveEmployees();
      return employees.length;
    } catch (error) {
      console.error('Error fetching total active employees:', error);
      throw error;
    }
  }

  /**
   * Get sales commission data for an employee
   */
  async getEmployeeSalesCommissions(
    employeeId: string,
    startDate?: string,
    endDate?: string
  ): Promise<any> {
    try {
      let url = `${this.baseUrl}/${employeeId}/sales-commissions`;
      
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `Failed to fetch sales commissions: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching employee sales commissions:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const apiEmployeeService = ApiEmployeeService.getInstance();
