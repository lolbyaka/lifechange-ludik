import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rootExchangesApi } from '../api/root-exchanges';
import type {
  CreateRootExchangeInput,
  UpdateRootExchangeInput,
} from '../types/root-exchange';

const QUERY_KEY = ['root-exchanges'] as const;

export function useRootExchanges() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => rootExchangesApi.list(),
  });
}

export function useRootExchange(id: string | null) {
  return useQuery({
    queryKey: [...QUERY_KEY, id],
    queryFn: () => (id ? rootExchangesApi.get(id) : Promise.reject(new Error('No id'))),
    enabled: !!id,
  });
}

export function useCreateRootExchange() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRootExchangeInput) => rootExchangesApi.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useUpdateRootExchange() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRootExchangeInput }) =>
      rootExchangesApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useDeleteRootExchange() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => rootExchangesApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

