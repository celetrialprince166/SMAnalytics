/**
 * Employee Service
 * 
 * Business logic for employee management
 */
import {
  Employee,
  CreateEmployeeRequest,
  UpdateEmployeeRequest,
  EmployeeFilters,
  EmployeeSummary,
} from '@/types';
import { employeeRepository } from '../repositories/EmployeeRepository';

export class EmployeeService {
  private static instance: EmployeeService;

  private constructor() {}

  public static getInstance(): EmployeeService {
    if (!EmployeeService.instance) {
      EmployeeService.instance = new EmployeeService();
    }
    return EmployeeService.instance;
  }

  /**
   * Create a new employee
   */
  async createEmployee(request: CreateEmployeeRequest): Promise<Employee> {
    // Validate
    const validation = this.validateEmployee(request);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    // Generate employee ID automatically
    const employeeId = await employeeRepository.getNextEmployeeId();

    const employee = await employeeRepository.create({
      employeeId,
      entryDate: request.entryDate,
      status: request.status,
      surname: request.surname.trim(),
      firstName: request.firstName.trim(),
      otherNames: request.otherNames?.trim(),
      dateOfBirth: request.dateOfBirth,
      placeOfBirth: request.placeOfBirth?.trim(),
      nationality: request.nationality,
      gender: request.gender,
      maritalStatus: request.maritalStatus,
      numberOfChildren: request.numberOfChildren || 0,
      residentialAddress: request.residentialAddress?.trim(),
      emailAddress: request.emailAddress.trim(),
      phoneNumber: request.phoneNumber.trim(),
      position: request.position?.trim(),
      department: request.department?.trim(),
      basicSalary: request.basicSalary,
      taxNumber: request.taxNumber?.trim(),
      ssnitNumber: request.ssnitNumber?.trim(),
      isActive: true,
    });

    return employee;
  }

  /**
   * Update an employee
   */
  async updateEmployee(id: string, updates: UpdateEmployeeRequest): Promise<Employee> {
    const existing = await employeeRepository.findById(id);
    if (!existing) {
      throw new Error('Employee not found');
    }

    // Validate updates if critical fields are being changed
    if (updates.firstName || updates.surname || updates.basicSalary !== undefined) {
      const validation = this.validateEmployee({
        ...existing,
        ...updates,
        entryDate: existing.entryDate,
        status: existing.status,
        surname: updates.surname || existing.surname,
        firstName: updates.firstName || existing.firstName,
        dateOfBirth: existing.dateOfBirth,
        nationality: existing.nationality,
        gender: existing.gender,
        maritalStatus: existing.maritalStatus,
        emailAddress: existing.emailAddress,
        phoneNumber: existing.phoneNumber,
        basicSalary: updates.basicSalary !== undefined ? updates.basicSalary : existing.basicSalary,
      } as CreateEmployeeRequest);
      
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }
    }

    return await employeeRepository.update(id, updates);
  }

  /**
   * Delete an employee (soft delete)
   */
  async deleteEmployee(id: string): Promise<void> {
    const employee = await employeeRepository.findById(id);
    if (!employee) {
      throw new Error('Employee not found');
    }

    // Soft delete by setting isActive to false
    await employeeRepository.update(id, { isActive: false, status: 'TERMINATED' });
  }

  /**
   * Get employee by ID
   */
  async getEmployeeById(id: string): Promise<Employee | null> {
    return await employeeRepository.findById(id);
  }

  /**
   * Get employee by employee ID
   */
  async getEmployeeByEmployeeId(employeeId: string): Promise<Employee | null> {
    return await employeeRepository.findByEmployeeId(employeeId);
  }

  /**
   * Get all employees
   */
  async getEmployees(): Promise<Employee[]> {
    return await employeeRepository.findAll();
  }

  /**
   * Get active employees
   */
  async getActiveEmployees(): Promise<Employee[]> {
    return await employeeRepository.findActive();
  }

  /**
   * Search employees with filters
   */
  async searchEmployees(filters: EmployeeFilters): Promise<Employee[]> {
    return await employeeRepository.search(filters);
  }

  /**
   * Get employee summaries for display
   */
  async getEmployeeSummaries(): Promise<EmployeeSummary[]> {
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
  }

  /**
   * Get employees by department
   */
  async getEmployeesByDepartment(department: string): Promise<Employee[]> {
    return await employeeRepository.findByDepartment(department);
  }

  /**
   * Get employees by position
   */
  async getEmployeesByPosition(position: string): Promise<Employee[]> {
    return await employeeRepository.findByPosition(position);
  }

  /**
   * Get employees by status
   */
  async getEmployeesByStatus(status: string): Promise<Employee[]> {
    return await employeeRepository.findByStatus(status);
  }

  /**
   * Get all departments
   */
  async getDepartments(): Promise<string[]> {
    return await employeeRepository.getDepartments();
  }

  /**
   * Get all positions
   */
  async getPositions(): Promise<string[]> {
    return await employeeRepository.getPositions();
  }

  /**
   * Get total active employees count
   */
  async getTotalActiveEmployees(): Promise<number> {
    return await employeeRepository.getTotalActiveEmployees();
  }

  /**
   * Validate employee data
   */
  private validateEmployee(data: CreateEmployeeRequest): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!data.firstName || data.firstName.trim().length === 0) {
      errors.push('First name is required');
    }

    if (!data.surname || data.surname.trim().length === 0) {
      errors.push('Surname is required');
    }

    if (data.emailAddress && !this.isValidEmail(data.emailAddress)) {
      errors.push('Invalid email format');
    }

    if (!data.entryDate) {
      errors.push('Entry date is required');
    }

    if (data.basicSalary === undefined || data.basicSalary < 0) {
      errors.push('Basic salary must be zero or greater');
    }

    if (data.dateOfBirth) {
      const age = this.calculateAge(data.dateOfBirth);
      if (age < 16) {
        errors.push('Employee must be at least 16 years old');
      }
      if (age > 100) {
        errors.push('Invalid date of birth');
      }
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

  /**
   * Calculate age from date of birth
   */
  private calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }
}

// Export singleton instance
export const employeeService = EmployeeService.getInstance();
