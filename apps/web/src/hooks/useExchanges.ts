import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { exchangesApi } from '../api/exchanges';
import type { CreateExchangeInput, UpdateExchangeInput } from '../types/exchange';

const QUERY_KEY = ['exchanges'] as const;

export function useExchanges() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => exchangesApi.list(),
  });
}

export function useExchange(id: string | null) {
  return useQuery({
    queryKey: [...QUERY_KEY, id],
    queryFn: () => (id ? exchangesApi.get(id) : Promise.reject(new Error('No id'))),
    enabled: !!id,
  });
}

export function useExchangeBalance(exchangeId: string | null) {
  return useQuery({
    queryKey: [...QUERY_KEY, exchangeId, 'balance'],
    queryFn: () =>
      exchangeId
        ? exchangesApi.getBalance(exchangeId)
        : Promise.reject(new Error('No exchange id')),
    enabled: !!exchangeId,
  });
}

export function useExchangeHealth(exchangeId: string | null) {
  return useQuery({
    queryKey: [...QUERY_KEY, exchangeId, 'health'],
    queryFn: () =>
      exchangeId
        ? exchangesApi.getHealth(exchangeId)
        : Promise.reject(new Error('No exchange id')),
    enabled: !!exchangeId,
    // Poll periodically so the UI reflects up-to-date connection state
    refetchInterval: 10000,
  });
}

export function useExchangeMarkets(exchangeId: string | null) {
  return useQuery({
    queryKey: [...QUERY_KEY, exchangeId, 'markets'],
    queryFn: () =>
      exchangeId
        ? exchangesApi.getMarkets(exchangeId)
        : Promise.reject(new Error('No exchange id')),
    enabled: !!exchangeId,
  });
}

export function useExchangeTickers(exchangeId: string | null) {
  return useQuery({
    queryKey: [...QUERY_KEY, exchangeId, 'tickers'],
    queryFn: () =>
      exchangeId
        ? exchangesApi.getTickers(exchangeId)
        : Promise.reject(new Error('No exchange id')),
    enabled: !!exchangeId,
  });
}

export function useCreateExchange() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateExchangeInput) => exchangesApi.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useUpdateExchange() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateExchangeInput }) =>
      exchangesApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useDeleteExchange() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => exchangesApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useLoadMarkets() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (exchangeId: string) => exchangesApi.loadMarkets(exchangeId),
    onSuccess: (_, exchangeId) => {
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEY, exchangeId, 'markets'] });
    },
  });
}
