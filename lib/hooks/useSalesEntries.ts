import { useQuery } from '@tanstack/react-query';

export function useSalesEntry(id: string) {
  return useQuery({
    queryKey: ['salesEntry', id],
    queryFn: async () => {
      const res = await fetch(`/api/sales/${id}`);
      if (!res.ok) throw new Error('Failed to fetch sales entry');
      const data = await res.json();
      return data.data;
    },
    enabled: !!id,
  });
}

export function useSalesEntries() {
  return useQuery({
    queryKey: ['salesEntries'],
    queryFn: async () => {
      const res = await fetch('/api/sales');
      if (!res.ok) throw new Error('Failed to fetch sales entries');
      const data = await res.json();
      return data.data;
    },
  });
}
