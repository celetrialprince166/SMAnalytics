import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type {
  SalesRepresentative,
  CreateSalesRepresentativeRequest,
  UpdateSalesRepresentativeRequest,
} from '@/types';

const API = '/api/sales-representatives';

export function useSalesRepresentatives(salesEntryId: string) {
  return useQuery({
    queryKey: ['salesRepresentatives', salesEntryId],
    queryFn: async () => {
      const res = await fetch(`${API}?salesEntryId=${salesEntryId}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      return data.data as SalesRepresentative[];
    },
    enabled: !!salesEntryId,
  });
}

export function useValidateStakes(salesEntryId: string) {
  return useQuery({
    queryKey: ['validateStakes', salesEntryId],
    queryFn: async () => {
      const res = await fetch(`${API}/validate/${salesEntryId}`);
      if (!res.ok) throw new Error('Failed to validate');
      const data = await res.json();
      return data.data;
    },
    enabled: !!salesEntryId,
  });
}

export function useCreateRepresentative() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateSalesRepresentativeRequest) => {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create');
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['salesRepresentatives', variables.salesEntryId] });
      queryClient.invalidateQueries({ queryKey: ['validateStakes', variables.salesEntryId] });
      toast.success('Representative added');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateRepresentative() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateSalesRepresentativeRequest }) => {
      const res = await fetch(`${API}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update');
      return res.json();
    },
    onSuccess: (data) => {
      const rep = data.data as SalesRepresentative;
      queryClient.invalidateQueries({ queryKey: ['salesRepresentatives', rep.salesEntryId] });
      queryClient.invalidateQueries({ queryKey: ['validateStakes', rep.salesEntryId] });
      toast.success('Representative updated');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteRepresentative() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, salesEntryId }: { id: string; salesEntryId: string }) => {
      const res = await fetch(`${API}/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      return { id, salesEntryId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['salesRepresentatives', data.salesEntryId] });
      queryClient.invalidateQueries({ queryKey: ['validateStakes', data.salesEntryId] });
      toast.success('Representative removed');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
