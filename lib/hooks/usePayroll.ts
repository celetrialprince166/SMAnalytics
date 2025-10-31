/**
 * TanStack Query hooks for Payroll data
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPayrollService } from '@/lib/services/ApiPayrollService';
import { apiEmployeeService } from '@/lib/services/ApiEmployeeService';
import { toast } from 'sonner';

// Query Keys
export const payrollKeys = {
  all: ['payroll'] as const,
  employees: () => [...payrollKeys.all, 'employees'] as const,
  employee: (id: string) => [...payrollKeys.employees(), id] as const,
  commissions: () => [...payrollKeys.all, 'commissions'] as const,
  commission: (id: string) => [...payrollKeys.commissions(), id] as const,
  unpaidCommissions: (employeeId?: string) => 
    [...payrollKeys.commissions(), 'unpaid', employeeId] as const,
  salesCommissions: (employeeId: string) => 
    [...payrollKeys.employee(employeeId), 'sales-commissions'] as const,
  salaries: () => [...payrollKeys.all, 'salaries'] as const,
  salary: (id: string) => [...payrollKeys.salaries(), id] as const,
  unpaidSalaries: () => [...payrollKeys.salaries(), 'unpaid'] as const,
};

// ==================== Employees ====================

export function useEmployees() {
  return useQuery({
    queryKey: payrollKeys.employees(),
    queryFn: () => apiEmployeeService.getEmployees(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useEmployee(id: string) {
  return useQuery({
    queryKey: payrollKeys.employee(id),
    queryFn: () => apiEmployeeService.getEmployeeById(id),
    enabled: !!id,
  });
}

// ==================== Commissions ====================

export function useCommissions(filters?: { employeeId?: string; isPaid?: boolean }) {
  return useQuery({
    queryKey: [...payrollKeys.commissions(), filters],
    queryFn: () => apiPayrollService.getCommissions(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useUnpaidCommissions(employeeId?: string) {
  return useQuery({
    queryKey: payrollKeys.unpaidCommissions(employeeId),
    queryFn: () => apiPayrollService.getUnpaidCommissions(employeeId),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

export function useSalesCommissions(employeeId: string, startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: [...payrollKeys.salesCommissions(employeeId), startDate, endDate],
    queryFn: () => apiEmployeeService.getEmployeeSalesCommissions(employeeId, startDate, endDate),
    enabled: !!employeeId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useCreateCommission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => apiPayrollService.createCommission(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: payrollKeys.commissions() });
      toast.success('Commission created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create commission');
    },
  });
}

export function usePayCommission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ commissionId }: { commissionId: string }) => 
      apiPayrollService.markCommissionAsPaid(commissionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: payrollKeys.commissions() });
      queryClient.invalidateQueries({ queryKey: payrollKeys.unpaidCommissions() });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to mark commission as paid');
    },
  });
}

export function usePayCommissions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (commissionIds: string[]) => {
      const promises = commissionIds.map(id => 
        apiPayrollService.markCommissionAsPaid(id)
      );
      return Promise.all(promises);
    },
    onSuccess: (_, commissionIds) => {
      queryClient.invalidateQueries({ queryKey: payrollKeys.commissions() });
      queryClient.invalidateQueries({ queryKey: payrollKeys.unpaidCommissions() });
      toast.success(`Successfully processed ${commissionIds.length} commission payment(s)`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to process payments');
    },
  });
}

// ==================== Salaries ====================

export function useUnpaidSalaries() {
  return useQuery({
    queryKey: payrollKeys.unpaidSalaries(),
    queryFn: () => apiPayrollService.getUnpaidSalaries(),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

export function useCalculateSalary() {
  return useMutation({
    mutationFn: (data: any) => apiPayrollService.calculateSalary(data),
    onError: (error: any) => {
      toast.error(error.message || 'Failed to calculate salary');
    },
  });
}

export function useProcessSalary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => apiPayrollService.processSalary(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: payrollKeys.salaries() });
      toast.success('Salary processed successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to process salary');
    },
  });
}

export function usePaySalary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ salaryId, paymentMethod, paymentReference }: { 
      salaryId: string; 
      paymentMethod: string; 
      paymentReference?: string;
    }) => apiPayrollService.paySalary(salaryId, paymentMethod, paymentReference),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: payrollKeys.salaries() });
      queryClient.invalidateQueries({ queryKey: payrollKeys.unpaidSalaries() });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to mark salary as paid');
    },
  });
}

export function usePaySalaries() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      salaryIds, 
      paymentMethod, 
      paymentReference 
    }: { 
      salaryIds: string[]; 
      paymentMethod: string; 
      paymentReference?: string;
    }) => {
      const promises = salaryIds.map(id => 
        apiPayrollService.paySalary(id, paymentMethod, paymentReference)
      );
      return Promise.all(promises);
    },
    onSuccess: (_, { salaryIds }) => {
      queryClient.invalidateQueries({ queryKey: payrollKeys.salaries() });
      queryClient.invalidateQueries({ queryKey: payrollKeys.unpaidSalaries() });
      toast.success(`Successfully processed ${salaryIds.length} salary payment(s)`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to process payments');
    },
  });
}
