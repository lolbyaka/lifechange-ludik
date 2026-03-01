import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { botsApi } from '../api/bots';
import type { CreateTradeBotInput, UpdateTradeBotInput } from '../types/bot';

const QUERY_KEY = ['bots'] as const;

export function useBots(exchangeId?: string | null) {
  return useQuery({
    queryKey: [...QUERY_KEY, exchangeId ?? 'all'],
    queryFn: () => botsApi.list(exchangeId ?? undefined),
  });
}

export function useBot(id: string | null) {
  return useQuery({
    queryKey: [...QUERY_KEY, id],
    queryFn: () => (id ? botsApi.get(id) : Promise.reject(new Error('No id'))),
    enabled: !!id,
  });
}

export function useCreateBot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTradeBotInput) => botsApi.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useUpdateBot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTradeBotInput }) =>
      botsApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useDeleteBot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => botsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}
