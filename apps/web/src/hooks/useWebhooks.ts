import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { webhooksApi } from '../api/webhooks';
import type { WebhookPayload } from '../types/webhook';
import type { WebhookListFilters } from '../api/webhooks';

const QUERY_KEY = ['webhooks'] as const;

export function useWebhooks(filters?: WebhookListFilters) {
  return useQuery({
    queryKey: [...QUERY_KEY, filters ?? {}],
    queryFn: () => webhooksApi.list(filters),
  });
}

export function useWebhook(id: string | null) {
  return useQuery({
    queryKey: [...QUERY_KEY, id],
    queryFn: () => (id ? webhooksApi.get(id) : Promise.reject(new Error('No id'))),
    enabled: !!id,
  });
}

export function useTriggerWebhook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: WebhookPayload) => webhooksApi.trigger(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['signals'] });
    },
  });
}

export function useUpdateWebhook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: WebhookPayload }) =>
      webhooksApi.update(id, { payload }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useDeleteWebhook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => webhooksApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}
