import { useQuery } from '@tanstack/react-query';

interface UseEmployeesOptions {
  status?: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'TERMINATED';
}

export function useEmployees(options: UseEmployeesOptions = {}) {
  return useQuery({
    queryKey: ['employees', options],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (options.status) {
        params.append('status', options.status);
      }
      
      const res = await fetch(`/api/employees?${params}`);
      if (!res.ok) throw new Error('Failed to fetch employees');
      const data = await res.json();
      return data.data;
    },
  });
}

export function useEmployee(id: string) {
  return useQuery({
    queryKey: ['employee', id],
    queryFn: async () => {
      const res = await fetch(`/api/employees/${id}`);
      if (!res.ok) throw new Error('Failed to fetch employee');
      const data = await res.json();
      return data.data;
    },
    enabled: !!id,
  });
}
