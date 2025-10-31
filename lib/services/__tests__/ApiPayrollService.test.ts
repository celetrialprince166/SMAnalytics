import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ApiPayrollService } from '../ApiPayrollService';
import { ApiEmployeeService } from '../ApiEmployeeService';
import type { 
  Employee, 
  TaxConfiguration, 
  PensionConfiguration,
  SalaryEntry,
  Commission 
} from '@/types';

// Mock fetch globally
global.fetch = vi.fn();

describe('ApiPayrollService - Comprehensive Tests', () => {
  let payrollService: ApiPayrollService;
  let employeeService: ApiEmployeeService;

  beforeEach(() => {
    vi.clearAllMocks();
    payrollService = ApiPayrollService.getInstance();
    employeeService = ApiEmployeeService.getInstance();
  });

  // ============================================================================
  // EMPLOYEE MANAGEMENT TESTS
  // ============================================================================

  describe('Employee Management', () => {
    describe('getEmployees', () => {
      it('should fetch all employees successfully', async () => {
        const mockEmployees: Employee[] = [
          {
            id: 'emp-1',
            employeeId: 'EMP-001',
            entryDate: new Date('2024-01-01'),
            status: 'ACTIVE',
            surname: 'Doe',
            firstName: 'John',
            dateOfBirth: new Date('1990-01-01'),
            emailAddress: 'john.doe@test.com',
            phoneNumber: '0241234567',
            nationality: 'GHANAIAN',
            gender: 'MALE',
            maritalStatus: 'SINGLE',
            basicSalary: 5000,
            department: 'IT',
            position: 'Developer',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ];


        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ 
            data: mockEmployees,
            pagination: { page: 1, pageSize: 10, total: 1, totalPages: 1 }
          })
        });

        const result = await employeeService.getEmployees();

        expect(global.fetch).toHaveBeenCalledWith(
          '/api/employees',
          expect.objectContaining({
            headers: expect.objectContaining({
              'Content-Type': 'application/json'
            })
          })
        );
        expect(result).toEqual(mockEmployees);
      });

      it('should fetch employees with pagination', async () => {
        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ 
            data: [],
            pagination: { page: 2, pageSize: 20, total: 50, totalPages: 3 }
          })
        });

        await employeeService.getEmployees({ page: 2, pageSize: 20 });

        expect(global.fetch).toHaveBeenCalledWith(
          '/api/employees?page=2&pageSize=20',
          expect.any(Object)
        );
      });

      it('should fetch employees filtered by status', async () => {
        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [], pagination: {} })
        });

        await employeeService.getEmployees({ status: 'ACTIVE' });

        expect(global.fetch).toHaveBeenCalledWith(
          '/api/employees?status=ACTIVE',
          expect.any(Object)
        );
      });

      it('should fetch employees filtered by department', async () => {
        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [], pagination: {} })
        });

        await employeeService.getEmployees({ department: 'IT' });

        expect(global.fetch).toHaveBeenCalledWith(
          '/api/employees?department=IT',
          expect.any(Object)
        );
      });

      it('should handle fetch errors gracefully', async () => {
        (global.fetch as any).mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({ message: 'Internal Server Error' })
        });

        await expect(employeeService.getEmployees()).rejects.toThrow();
      });
    });

    describe('getEmployeeById', () => {
      it('should fetch single employee by id', async () => {
        const mockEmployee: Employee = {
          id: 'emp-1',
          employeeId: 'EMP-001',
          entryDate: new Date('2024-01-01'),
          status: 'ACTIVE',
          surname: 'Doe',
          firstName: 'John',
          dateOfBirth: new Date('1990-01-01'),
          emailAddress: 'john.doe@test.com',
          phoneNumber: '0241234567',
          nationality: 'GHANAIAN',
          gender: 'MALE',
          maritalStatus: 'SINGLE',
          basicSalary: 5000,
          department: 'IT',
          position: 'Developer',
          createdAt: new Date(),
          updatedAt: new Date()
        };

        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockEmployee })
        });

        const result = await employeeService.getEmployeeById('emp-1');

        expect(global.fetch).toHaveBeenCalledWith(
          '/api/employees/emp-1',
          expect.any(Object)
        );
        expect(result).toEqual(mockEmployee);
      });

      it('should return null when employee not found', async () => {
        (global.fetch as any).mockResolvedValueOnce({
          ok: false,
          status: 404,
          json: async () => ({ message: 'Not found' })
        });

        const result = await employeeService.getEmployeeById('non-existent');

        expect(result).toBeNull();
      });
    });

    describe('createEmployee', () => {
      it('should create new employee successfully', async () => {
        const newEmployee = {
          entryDate: new Date('2024-01-01'),
          status: 'ACTIVE' as const,
          surname: 'Smith',
          firstName: 'Jane',
          dateOfBirth: new Date('1992-05-15'),
          emailAddress: 'jane.smith@test.com',
          phoneNumber: '0247654321',
          nationality: 'GHANAIAN' as const,
          gender: 'FEMALE' as const,
          maritalStatus: 'MARRIED' as const,
          basicSalary: 6000,
          department: 'HR',
          position: 'HR Manager'
        };

        const mockCreated: Employee = {
          id: 'emp-2',
          employeeId: 'EMP-002',
          ...newEmployee,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockCreated })
        });

        const result = await employeeService.createEmployee(newEmployee);

        expect(global.fetch).toHaveBeenCalledWith('/api/employees', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('jane.smith@test.com')
        });
        expect(result).toEqual(mockCreated);
      });

      it('should handle validation errors', async () => {
        (global.fetch as any).mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: async () => ({ 
            message: 'Validation failed',
            errors: ['Email already exists']
          })
        });

        await expect(employeeService.createEmployee({} as any)).rejects.toThrow();
      });
    });

    describe('updateEmployee', () => {
      it('should update employee successfully', async () => {
        const updates = {
          basicSalary: 7000,
          position: 'Senior Developer',
          status: 'ACTIVE' as const
        };

        const mockUpdated: Employee = {
          id: 'emp-1',
          employeeId: 'EMP-001',
          entryDate: new Date('2024-01-01'),
          status: 'ACTIVE',
          surname: 'Doe',
          firstName: 'John',
          dateOfBirth: new Date('1990-01-01'),
          emailAddress: 'john.doe@test.com',
          phoneNumber: '0241234567',
          nationality: 'GHANAIAN',
          gender: 'MALE',
          maritalStatus: 'SINGLE',
          basicSalary: 7000,
          department: 'IT',
          position: 'Senior Developer',
          createdAt: new Date(),
          updatedAt: new Date()
        };

        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockUpdated })
        });

        const result = await employeeService.updateEmployee('emp-1', updates);

        expect(global.fetch).toHaveBeenCalledWith('/api/employees/emp-1', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        });
        expect(result.basicSalary).toBe(7000);
        expect(result.position).toBe('Senior Developer');
      });
    });

    describe('deleteEmployee', () => {
      it('should delete employee successfully', async () => {
        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { success: true } })
        });

        await employeeService.deleteEmployee('emp-1');

        expect(global.fetch).toHaveBeenCalledWith(
          '/api/employees/emp-1',
          expect.objectContaining({ method: 'DELETE' })
        );
      });

      it('should handle deletion errors', async () => {
        (global.fetch as any).mockResolvedValueOnce({
          ok: false,
          status: 409,
          json: async () => ({ 
            message: 'Cannot delete employee with existing salary entries'
          })
        });

        await expect(employeeService.deleteEmployee('emp-1')).rejects.toThrow();
      });
    });
  });

  // ============================================================================
  // TAX CONFIGURATION TESTS
  // ============================================================================

  describe('Tax Configuration Management', () => {
    describe('getTaxConfigurations', () => {
      it('should fetch all tax configurations', async () => {
        const mockConfigs: TaxConfiguration[] = [
          {
            id: 'tax-1',
            effectiveDate: new Date('2024-01-01'),
            brackets: [
              { order: 1, amount: 0, rate: 0 },
              { order: 2, amount: 365, rate: 5 }
            ],
            nonResidentRate: 25,
            personalRelief: 365,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ];

        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockConfigs })
        });

        const result = await payrollService.getTaxConfigurations();

        expect(global.fetch).toHaveBeenCalledWith(
          '/api/payroll/tax-configurations',
          expect.any(Object)
        );
        expect(result).toEqual(mockConfigs);
      });
    });

    describe('getActiveTaxConfiguration', () => {
      it('should fetch active tax configuration', async () => {
        const mockConfig: TaxConfiguration = {
          id: 'tax-1',
          effectiveDate: new Date('2024-01-01'),
          brackets: [
            { order: 1, amount: 0, rate: 0 },
            { order: 2, amount: 365, rate: 5 },
            { order: 3, amount: 110, rate: 10 },
            { order: 4, amount: 130, rate: 17.5 },
            { order: 5, amount: 3000, rate: 25 },
            { order: 6, amount: 0, rate: 30 }
          ],
          nonResidentRate: 25,
          personalRelief: 365,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockConfig })
        });

        const result = await payrollService.getActiveTaxConfiguration();

        expect(global.fetch).toHaveBeenCalledWith(
          '/api/payroll/tax-configurations/active',
          expect.any(Object)
        );
        expect(result).toEqual(mockConfig);
        expect(result?.isActive).toBe(true);
      });

      it('should return null when no active configuration exists', async () => {
        (global.fetch as any).mockResolvedValueOnce({
          ok: false,
          status: 404,
          json: async () => ({ message: 'No active configuration' })
        });

        const result = await payrollService.getActiveTaxConfiguration();

        expect(result).toBeNull();
      });
    });

    describe('createTaxConfiguration', () => {
      it('should create new tax configuration', async () => {
        const newConfig = {
          effectiveDate: new Date('2024-01-01'),
          brackets: [
            { order: 1, amount: 0, rate: 0 },
            { order: 2, amount: 365, rate: 5 }
          ],
          nonResidentRate: 25,
          personalRelief: 365
        };

        const mockCreated: TaxConfiguration = {
          id: 'tax-2',
          ...newConfig,
          isActive: false,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockCreated })
        });

        const result = await payrollService.createTaxConfiguration(newConfig);

        expect(global.fetch).toHaveBeenCalledWith(
          '/api/payroll/tax-configurations',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: expect.stringContaining('365')
          }
        );
        expect(result).toEqual(mockCreated);
      });
    });

    describe('updateTaxConfiguration', () => {
      it('should update tax configuration', async () => {
        const updates = {
          personalRelief: 400,
          isActive: true
        };

        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { ...updates, id: 'tax-1' } })
        });

        await payrollService.updateTaxConfiguration('tax-1', updates);

        expect(global.fetch).toHaveBeenCalledWith(
          '/api/payroll/tax-configurations/tax-1',
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
          }
        );
      });
    });

    describe('deleteTaxConfiguration', () => {
      it('should delete tax configuration', async () => {
        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { success: true } })
        });

        await payrollService.deleteTaxConfiguration('tax-1');

        expect(global.fetch).toHaveBeenCalledWith(
          '/api/payroll/tax-configurations/tax-1',
          expect.objectContaining({ method: 'DELETE' })
        );
      });
    });
  });


  // ============================================================================
  // PENSION CONFIGURATION TESTS
  // ============================================================================

  describe('Pension Configuration Management', () => {
    describe('getPensionConfigurations', () => {
      it('should fetch all pension configurations', async () => {
        const mockConfigs: PensionConfiguration[] = [
          {
            id: 'pension-1',
            effectiveDate: new Date('2024-01-01'),
            tier1EmployerRate: 13,
            tier1EmployeeRate: 5.5,
            tier1PensionRate: 13.5,
            tier1NHISRate: 5,
            tier2Rate: 5,
            tier3EmployerRate: 5,
            tier3EmployeeRate: 5,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ];

        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockConfigs })
        });

        const result = await payrollService.getPensionConfigurations();

        expect(global.fetch).toHaveBeenCalledWith(
          '/api/payroll/pension-configurations',
          expect.any(Object)
        );
        expect(result).toEqual(mockConfigs);
      });
    });

    describe('getActivePensionConfiguration', () => {
      it('should fetch active pension configuration', async () => {
        const mockConfig: PensionConfiguration = {
          id: 'pension-1',
          effectiveDate: new Date('2024-01-01'),
          tier1EmployerRate: 13,
          tier1EmployeeRate: 5.5,
          tier1PensionRate: 13.5,
          tier1NHISRate: 5,
          tier2Rate: 5,
          tier3EmployerRate: 5,
          tier3EmployeeRate: 5,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockConfig })
        });

        const result = await payrollService.getActivePensionConfiguration();

        expect(global.fetch).toHaveBeenCalledWith(
          '/api/payroll/pension-configurations/active',
          expect.any(Object)
        );
        expect(result).toEqual(mockConfig);
        expect(result?.isActive).toBe(true);
      });

      it('should return null when no active configuration exists', async () => {
        (global.fetch as any).mockResolvedValueOnce({
          ok: false,
          status: 404,
          json: async () => ({ message: 'No active configuration' })
        });

        const result = await payrollService.getActivePensionConfiguration();

        expect(result).toBeNull();
      });
    });

    describe('createPensionConfiguration', () => {
      it('should create new pension configuration', async () => {
        const newConfig = {
          effectiveDate: new Date('2024-01-01'),
          tier1EmployerRate: 13,
          tier1EmployeeRate: 5.5,
          tier1PensionRate: 13.5,
          tier1NHISRate: 5,
          tier2Rate: 5,
          tier3EmployerRate: 5,
          tier3EmployeeRate: 5
        };

        const mockCreated: PensionConfiguration = {
          id: 'pension-2',
          ...newConfig,
          isActive: false,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockCreated })
        });

        const result = await payrollService.createPensionConfiguration(newConfig);

        expect(global.fetch).toHaveBeenCalledWith(
          '/api/payroll/pension-configurations',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: expect.stringContaining('13')
          }
        );
        expect(result).toEqual(mockCreated);
      });
    });

    describe('updatePensionConfiguration', () => {
      it('should update pension configuration', async () => {
        const updates = {
          tier2Rate: 6,
          isActive: true
        };

        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { ...updates, id: 'pension-1' } })
        });

        await payrollService.updatePensionConfiguration('pension-1', updates);

        expect(global.fetch).toHaveBeenCalledWith(
          '/api/payroll/pension-configurations/pension-1',
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
          }
        );
      });
    });

    describe('deletePensionConfiguration', () => {
      it('should delete pension configuration', async () => {
        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { success: true } })
        });

        await payrollService.deletePensionConfiguration('pension-1');

        expect(global.fetch).toHaveBeenCalledWith(
          '/api/payroll/pension-configurations/pension-1',
          expect.objectContaining({ method: 'DELETE' })
        );
      });
    });
  });

  // ============================================================================
  // SALARY PROCESSING TESTS
  // ============================================================================

  describe('Salary Processing', () => {
    describe('calculateSalary', () => {
      it('should calculate salary with all deductions', async () => {
        const mockCalculation = {
          employee: {
            id: 'emp-1',
            employeeId: 'EMP-001',
            firstName: 'John',
            surname: 'Doe',
            basicSalary: 5000,
            nationality: 'GHANAIAN'
          },
          earnings: {
            basicSalary: 5000,
            allowances: 500,
            commission: 200,
            grossSalary: 5700
          },
          deductions: {
            incomeTax: 450,
            pension: {
              tier1Employee: 275,
              tier1Employer: 650,
              tier1Pension: 675,
              tier1NHIS: 250,
              totalSSNIT: 925,
              tier2: 250,
              tier3Employee: 0,
              tier3Employer: 0,
              totalPension: 1175
            },
            otherDeductions: 0,
            totalDeductions: 1625
          },
          netSalary: 4075
        };

        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockCalculation })
        });

        const result = await payrollService.calculateSalary({
          employeeId: 'emp-1',
          allowances: 500,
          commission: 200
        });

        expect(global.fetch).toHaveBeenCalledWith(
          '/api/payroll/salaries/calculate',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: expect.stringContaining('emp-1')
          }
        );
        expect(result.earnings.grossSalary).toBe(5700);
        expect(result.netSalary).toBe(4075);
      });

      it('should calculate salary for non-resident employee', async () => {
        const mockCalculation = {
          employee: {
            id: 'emp-2',
            employeeId: 'EMP-002',
            firstName: 'Jane',
            surname: 'Smith',
            basicSalary: 8000,
            nationality: 'NON_GHANAIAN'
          },
          earnings: {
            basicSalary: 8000,
            allowances: 1000,
            commission: 0,
            grossSalary: 9000
          },
          deductions: {
            incomeTax: 2250, // 25% flat rate
            pension: {
              tier1Employee: 440,
              tier1Employer: 1040,
              tier1Pension: 1080,
              tier1NHIS: 400,
              totalSSNIT: 1480,
              tier2: 400,
              tier3Employee: 0,
              tier3Employer: 0,
              totalPension: 1880
            },
            otherDeductions: 0,
            totalDeductions: 4130
          },
          netSalary: 4870
        };

        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockCalculation })
        });

        const result = await payrollService.calculateSalary({
          employeeId: 'emp-2',
          allowances: 1000,
          commission: 0
        });

        expect(result.deductions.incomeTax).toBe(2250);
      });

      it('should handle calculation errors', async () => {
        (global.fetch as any).mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: async () => ({ 
            message: 'No active tax configuration found'
          })
        });

        await expect(payrollService.calculateSalary({
          employeeId: 'emp-1',
          allowances: 0,
          commission: 0
        })).rejects.toThrow();
      });
    });

    describe('processSalary', () => {
      it('should process salary successfully', async () => {
        const mockSalary: SalaryEntry = {
          id: 'sal-1',
          employeeId: 'emp-1',
          processedDate: new Date('2024-01-31'),
          salaryDate: new Date('2024-01-31'),
          basicSalary: 5000,
          allowances: 500,
          commission: 200,
          grossSalary: 5700,
          incomeTax: 450,
          tier1Employee: 275,
          tier1Employer: 650,
          tier1Pension: 675,
          tier1NHIS: 250,
          tier2: 250,
          tier3Employee: 0,
          tier3Employer: 0,
          otherDeductions: 0,
          totalDeductions: 1625,
          netSalary: 4075,
          remarks: 'January 2024 salary',
          createdAt: new Date(),
          updatedAt: new Date()
        };

        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockSalary })
        });

        const result = await payrollService.processSalary({
          employeeId: 'emp-1',
          salaryDate: new Date('2024-01-31'),
          allowances: 500,
          commission: 200,
          remarks: 'January 2024 salary'
        });

        expect(global.fetch).toHaveBeenCalledWith(
          '/api/payroll/salaries',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: expect.stringContaining('emp-1')
          }
        );
        expect(result).toEqual(mockSalary);
        expect(result.netSalary).toBe(4075);
      });

      it('should process salary with other deductions', async () => {
        const mockSalary: SalaryEntry = {
          id: 'sal-2',
          employeeId: 'emp-1',
          processedDate: new Date('2024-02-29'),
          salaryDate: new Date('2024-02-29'),
          basicSalary: 5000,
          allowances: 0,
          commission: 0,
          grossSalary: 5000,
          incomeTax: 400,
          tier1Employee: 275,
          tier1Employer: 650,
          tier1Pension: 675,
          tier1NHIS: 250,
          tier2: 250,
          tier3Employee: 0,
          tier3Employer: 0,
          otherDeductions: 500, // Loan deduction
          totalDeductions: 1925,
          netSalary: 3075,
          remarks: 'February 2024 salary with loan deduction',
          createdAt: new Date(),
          updatedAt: new Date()
        };

        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockSalary })
        });

        const result = await payrollService.processSalary({
          employeeId: 'emp-1',
          salaryDate: new Date('2024-02-29'),
          allowances: 0,
          commission: 0,
          otherDeductions: 500,
          remarks: 'February 2024 salary with loan deduction'
        });

        expect(result.otherDeductions).toBe(500);
        expect(result.netSalary).toBe(3075);
      });
    });

    describe('getSalaryEntries', () => {
      it('should fetch all salary entries', async () => {
        const mockEntries: SalaryEntry[] = [
          {
            id: 'sal-1',
            employeeId: 'emp-1',
            processedDate: new Date('2024-01-31'),
            salaryDate: new Date('2024-01-31'),
            basicSalary: 5000,
            allowances: 500,
            commission: 200,
            grossSalary: 5700,
            incomeTax: 450,
            tier1Employee: 275,
            tier1Employer: 650,
            tier1Pension: 675,
            tier1NHIS: 250,
            tier2: 250,
            tier3Employee: 0,
            tier3Employer: 0,
            otherDeductions: 0,
            totalDeductions: 1625,
            netSalary: 4075,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ];

        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ 
            data: mockEntries,
            pagination: { page: 1, pageSize: 10, total: 1, totalPages: 1 }
          })
        });

        const result = await payrollService.getSalaryEntries();

        expect(global.fetch).toHaveBeenCalledWith(
          '/api/payroll/salaries',
          expect.any(Object)
        );
        expect(result).toEqual(mockEntries);
      });

      it('should fetch salary entries filtered by employee', async () => {
        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [], pagination: {} })
        });

        await payrollService.getSalaryEntries({ employeeId: 'emp-1' });

        expect(global.fetch).toHaveBeenCalledWith(
          '/api/payroll/salaries?employeeId=emp-1',
          expect.any(Object)
        );
      });

      it('should fetch salary entries filtered by date range', async () => {
        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [], pagination: {} })
        });

        await payrollService.getSalaryEntries({
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31')
        });

        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('startDate='),
          expect.any(Object)
        );
      });
    });

    describe('getSalaryEntryById', () => {
      it('should fetch single salary entry', async () => {
        const mockEntry: SalaryEntry = {
          id: 'sal-1',
          employeeId: 'emp-1',
          processedDate: new Date('2024-01-31'),
          salaryDate: new Date('2024-01-31'),
          basicSalary: 5000,
          allowances: 500,
          commission: 200,
          grossSalary: 5700,
          incomeTax: 450,
          tier1Employee: 275,
          tier1Employer: 650,
          tier1Pension: 675,
          tier1NHIS: 250,
          tier2: 250,
          tier3Employee: 0,
          tier3Employer: 0,
          otherDeductions: 0,
          totalDeductions: 1625,
          netSalary: 4075,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockEntry })
        });

        const result = await payrollService.getSalaryEntryById('sal-1');

        expect(global.fetch).toHaveBeenCalledWith(
          '/api/payroll/salaries/sal-1',
          expect.any(Object)
        );
        expect(result).toEqual(mockEntry);
      });
    });
  });


  // ============================================================================
  // COMMISSION MANAGEMENT TESTS
  // ============================================================================

  describe('Commission Management', () => {
    describe('createCommission', () => {
      it('should create commission successfully', async () => {
        const mockCommission: Commission = {
          id: 'com-1',
          employeeId: 'emp-1',
          commissionDate: new Date('2024-01-31'),
          amount: 1000,
          rate: 5,
          salesAmount: 20000,
          isPaid: false,
          remarks: 'Q1 sales commission',
          createdAt: new Date(),
          updatedAt: new Date()
        };

        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockCommission })
        });

        const result = await payrollService.createCommission({
          employeeId: 'emp-1',
          commissionDate: new Date('2024-01-31'),
          amount: 1000,
          rate: 5,
          salesAmount: 20000,
          remarks: 'Q1 sales commission'
        });

        expect(global.fetch).toHaveBeenCalledWith(
          '/api/payroll/commissions',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: expect.stringContaining('emp-1')
          }
        );
        expect(result).toEqual(mockCommission);
        expect(result.isPaid).toBe(false);
      });

      it('should create commission linked to sales entry', async () => {
        const mockCommission: Commission = {
          id: 'com-2',
          employeeId: 'emp-1',
          salesEntryId: 'sale-123',
          commissionDate: new Date('2024-01-31'),
          amount: 500,
          rate: 2.5,
          salesAmount: 20000,
          isPaid: false,
          remarks: 'Commission from sale #123',
          createdAt: new Date(),
          updatedAt: new Date()
        };

        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockCommission })
        });

        const result = await payrollService.createCommission({
          employeeId: 'emp-1',
          salesEntryId: 'sale-123',
          commissionDate: new Date('2024-01-31'),
          amount: 500,
          rate: 2.5,
          salesAmount: 20000,
          remarks: 'Commission from sale #123'
        });

        expect(result.salesEntryId).toBe('sale-123');
      });
    });

    describe('getCommissions', () => {
      it('should fetch all commissions', async () => {
        const mockCommissions: Commission[] = [
          {
            id: 'com-1',
            employeeId: 'emp-1',
            commissionDate: new Date('2024-01-31'),
            amount: 1000,
            rate: 5,
            salesAmount: 20000,
            isPaid: false,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ];

        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ 
            data: mockCommissions,
            pagination: { page: 1, pageSize: 10, total: 1, totalPages: 1 }
          })
        });

        const result = await payrollService.getCommissions();

        expect(global.fetch).toHaveBeenCalledWith(
          '/api/payroll/commissions',
          expect.any(Object)
        );
        expect(result).toEqual(mockCommissions);
      });

      it('should fetch commissions filtered by employee', async () => {
        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [], pagination: {} })
        });

        await payrollService.getCommissions({ employeeId: 'emp-1' });

        expect(global.fetch).toHaveBeenCalledWith(
          '/api/payroll/commissions?employeeId=emp-1',
          expect.any(Object)
        );
      });

      it('should fetch commissions filtered by payment status', async () => {
        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [], pagination: {} })
        });

        await payrollService.getCommissions({ isPaid: false });

        expect(global.fetch).toHaveBeenCalledWith(
          '/api/payroll/commissions?isPaid=false',
          expect.any(Object)
        );
      });
    });

    describe('getCommissionById', () => {
      it('should fetch single commission', async () => {
        const mockCommission: Commission = {
          id: 'com-1',
          employeeId: 'emp-1',
          commissionDate: new Date('2024-01-31'),
          amount: 1000,
          rate: 5,
          salesAmount: 20000,
          isPaid: false,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockCommission })
        });

        const result = await payrollService.getCommissionById('com-1');

        expect(global.fetch).toHaveBeenCalledWith(
          '/api/payroll/commissions/com-1',
          expect.any(Object)
        );
        expect(result).toEqual(mockCommission);
      });
    });

    describe('markCommissionAsPaid', () => {
      it('should mark commission as paid', async () => {
        const mockPaidCommission: Commission = {
          id: 'com-1',
          employeeId: 'emp-1',
          commissionDate: new Date('2024-01-31'),
          amount: 1000,
          rate: 5,
          salesAmount: 20000,
          isPaid: true,
          paidDate: new Date('2024-02-15'),
          salaryEntryId: 'sal-1',
          createdAt: new Date(),
          updatedAt: new Date()
        };

        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockPaidCommission })
        });

        const result = await payrollService.markCommissionAsPaid('com-1', 'sal-1');

        expect(global.fetch).toHaveBeenCalledWith(
          '/api/payroll/commissions/com-1/pay',
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: expect.stringContaining('sal-1')
          }
        );
        expect(result.isPaid).toBe(true);
        expect(result.salaryEntryId).toBe('sal-1');
      });

      it('should handle already paid commission', async () => {
        (global.fetch as any).mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: async () => ({ 
            message: 'Commission already paid'
          })
        });

        await expect(
          payrollService.markCommissionAsPaid('com-1', 'sal-1')
        ).rejects.toThrow();
      });
    });

    describe('getUnpaidCommissions', () => {
      it('should fetch unpaid commissions for employee', async () => {
        const mockUnpaid = {
          commissions: [
            {
              id: 'com-1',
              employeeId: 'emp-1',
              commissionDate: new Date('2024-01-31'),
              amount: 1000,
              rate: 5,
              salesAmount: 20000,
              isPaid: false,
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: 'com-2',
              employeeId: 'emp-1',
              commissionDate: new Date('2024-02-29'),
              amount: 1500,
              rate: 5,
              salesAmount: 30000,
              isPaid: false,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          ],
          summary: {
            count: 2,
            totalAmount: 2500,
            totalSalesAmount: 50000
          }
        };

        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockUnpaid })
        });

        const result = await payrollService.getUnpaidCommissions('emp-1');

        expect(global.fetch).toHaveBeenCalledWith(
          '/api/payroll/commissions/unpaid?employeeId=emp-1',
          expect.any(Object)
        );
        expect(result.summary.count).toBe(2);
        expect(result.summary.totalAmount).toBe(2500);
      });

      it('should return empty when no unpaid commissions', async () => {
        const mockEmpty = {
          commissions: [],
          summary: {
            count: 0,
            totalAmount: 0,
            totalSalesAmount: 0
          }
        };

        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockEmpty })
        });

        const result = await payrollService.getUnpaidCommissions('emp-1');

        expect(result.summary.count).toBe(0);
        expect(result.summary.totalAmount).toBe(0);
      });
    });

    describe('getTotalUnpaidCommissions', () => {
      it('should calculate total unpaid commissions', async () => {
        const mockUnpaid = {
          commissions: [
            { amount: 1000 },
            { amount: 1500 }
          ],
          summary: {
            count: 2,
            totalAmount: 2500,
            totalSalesAmount: 50000
          }
        };

        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockUnpaid })
        });

        const result = await payrollService.getTotalUnpaidCommissions('emp-1');

        expect(result).toBe(2500);
      });
    });
  });

  // ============================================================================
  // TAX CALCULATION TESTS
  // ============================================================================

  describe('Tax Calculations', () => {
    describe('calculateIncomeTax', () => {
      it('should calculate tax for Ghanaian resident', () => {
        const taxConfig: TaxConfiguration = {
          id: 'tax-1',
          effectiveDate: new Date('2024-01-01'),
          brackets: [
            { order: 1, amount: 0, rate: 0 },
            { order: 2, amount: 365, rate: 5 },
            { order: 3, amount: 110, rate: 10 },
            { order: 4, amount: 130, rate: 17.5 },
            { order: 5, amount: 3000, rate: 25 },
            { order: 6, amount: 0, rate: 30 }
          ],
          nonResidentRate: 25,
          personalRelief: 365,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const grossSalary = 5700;
        const tax = payrollService.calculateIncomeTax(grossSalary, taxConfig, true);

        expect(tax).toBeGreaterThan(0);
        expect(tax).toBeLessThan(grossSalary);
      });

      it('should calculate tax for non-resident', () => {
        const taxConfig: TaxConfiguration = {
          id: 'tax-1',
          effectiveDate: new Date('2024-01-01'),
          brackets: [],
          nonResidentRate: 25,
          personalRelief: 0,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const grossSalary = 9000;
        const tax = payrollService.calculateIncomeTax(grossSalary, taxConfig, false);

        expect(tax).toBe(2250); // 25% of 9000
      });

      it('should return 0 for zero gross salary', () => {
        const taxConfig: TaxConfiguration = {
          id: 'tax-1',
          effectiveDate: new Date('2024-01-01'),
          brackets: [],
          nonResidentRate: 25,
          personalRelief: 365,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const tax = payrollService.calculateIncomeTax(0, taxConfig, true);

        expect(tax).toBe(0);
      });
    });
  });

  // ============================================================================
  // PENSION CALCULATION TESTS
  // ============================================================================

  describe('Pension Calculations', () => {
    describe('calculatePensionDeductions', () => {
      it('should calculate all pension tiers', () => {
        const pensionConfig: PensionConfiguration = {
          id: 'pension-1',
          effectiveDate: new Date('2024-01-01'),
          tier1EmployerRate: 13,
          tier1EmployeeRate: 5.5,
          tier1PensionRate: 13.5,
          tier1NHISRate: 5,
          tier2Rate: 5,
          tier3EmployerRate: 5,
          tier3EmployeeRate: 5,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const basicSalary = 5000;
        const result = payrollService.calculatePensionDeductions(basicSalary, pensionConfig);

        expect(result.tier1Employee).toBe(275); // 5.5% of 5000
        expect(result.tier1Employer).toBe(650); // 13% of 5000
        expect(result.tier1Pension).toBe(675); // 13.5% of 5000
        expect(result.tier1NHIS).toBe(250); // 5% of 5000
        expect(result.totalSSNIT).toBe(925); // tier1Employee + tier1Employer
        expect(result.tier2).toBe(250); // 5% of 5000
        expect(result.tier3Employee).toBe(0);
        expect(result.tier3Employer).toBe(0);
        expect(result.totalPension).toBe(1175); // totalSSNIT + tier2
      });

      it('should calculate with tier 3 contributions', () => {
        const pensionConfig: PensionConfiguration = {
          id: 'pension-1',
          effectiveDate: new Date('2024-01-01'),
          tier1EmployerRate: 13,
          tier1EmployeeRate: 5.5,
          tier1PensionRate: 13.5,
          tier1NHISRate: 5,
          tier2Rate: 5,
          tier3EmployerRate: 5,
          tier3EmployeeRate: 5,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const basicSalary = 10000;
        const result = payrollService.calculatePensionDeductions(
          basicSalary, 
          pensionConfig,
          500, // tier3Employee
          500  // tier3Employer
        );

        expect(result.tier3Employee).toBe(500);
        expect(result.tier3Employer).toBe(500);
        expect(result.totalPension).toBeGreaterThan(result.totalSSNIT);
      });

      it('should return zero for zero basic salary', () => {
        const pensionConfig: PensionConfiguration = {
          id: 'pension-1',
          effectiveDate: new Date('2024-01-01'),
          tier1EmployerRate: 13,
          tier1EmployeeRate: 5.5,
          tier1PensionRate: 13.5,
          tier1NHISRate: 5,
          tier2Rate: 5,
          tier3EmployerRate: 5,
          tier3EmployeeRate: 5,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const result = payrollService.calculatePensionDeductions(0, pensionConfig);

        expect(result.tier1Employee).toBe(0);
        expect(result.totalSSNIT).toBe(0);
        expect(result.totalPension).toBe(0);
      });
    });
  });

  // ============================================================================
  // ERROR HANDLING TESTS
  // ============================================================================

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await expect(employeeService.getEmployees()).rejects.toThrow('Network error');
    });

    it('should handle 401 unauthorized', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Unauthorized' })
      });

      await expect(employeeService.getEmployees()).rejects.toThrow();
    });

    it('should handle 403 forbidden', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ message: 'Forbidden' })
      });

      await expect(payrollService.getSalaryEntries()).rejects.toThrow();
    });

    it('should handle 500 internal server error', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Internal Server Error' })
      });

      await expect(payrollService.getCommissions()).rejects.toThrow();
    });
  });

  // ============================================================================
  // INTEGRATION TESTS
  // ============================================================================

  describe('Integration Scenarios', () => {
    it('should process complete payroll cycle', async () => {
      // 1. Create employee
      const mockEmployee: Employee = {
        id: 'emp-1',
        employeeId: 'EMP-001',
        entryDate: new Date('2024-01-01'),
        status: 'ACTIVE',
        surname: 'Doe',
        firstName: 'John',
        dateOfBirth: new Date('1990-01-01'),
        emailAddress: 'john.doe@test.com',
        phoneNumber: '0241234567',
        nationality: 'GHANAIAN',
        gender: 'MALE',
        maritalStatus: 'SINGLE',
        basicSalary: 5000,
        department: 'IT',
        position: 'Developer',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockEmployee })
      });

      const employee = await employeeService.createEmployee(mockEmployee);
      expect(employee.id).toBe('emp-1');

      // 2. Calculate salary
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          data: {
            employee: mockEmployee,
            earnings: { grossSalary: 5700 },
            deductions: { totalDeductions: 1625 },
            netSalary: 4075
          }
        })
      });

      const calculation = await payrollService.calculateSalary({
        employeeId: 'emp-1',
        allowances: 500,
        commission: 200
      });
      expect(calculation.netSalary).toBe(4075);

      // 3. Process salary
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          data: {
            id: 'sal-1',
            employeeId: 'emp-1',
            netSalary: 4075
          }
        })
      });

      const salary = await payrollService.processSalary({
        employeeId: 'emp-1',
        salaryDate: new Date(),
        allowances: 500,
        commission: 200
      });
      expect(salary.id).toBe('sal-1');

      // 4. Create commission
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          data: {
            id: 'com-1',
            employeeId: 'emp-1',
            amount: 1000,
            isPaid: false
          }
        })
      });

      const commission = await payrollService.createCommission({
        employeeId: 'emp-1',
        commissionDate: new Date(),
        amount: 1000,
        rate: 5,
        salesAmount: 20000
      });
      expect(commission.isPaid).toBe(false);

      // 5. Mark commission as paid
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          data: {
            id: 'com-1',
            isPaid: true,
            salaryEntryId: 'sal-1'
          }
        })
      });

      const paidCommission = await payrollService.markCommissionAsPaid('com-1', 'sal-1');
      expect(paidCommission.isPaid).toBe(true);
    });
  });
});
