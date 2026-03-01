import { api } from './client';
import type { Webhook, WebhookPayload } from '../types/webhook';

export interface TriggerWebhookResponse {
  id: string;
  received: boolean;
}

export interface WebhookListFilters {
  symbol?: string;
  strategy?: string;
  direction?: string;
}

function buildListUrl(filters?: WebhookListFilters): string {
  if (!filters || !Object.keys(filters).length) return '/webhooks';
  const params = new URLSearchParams();
  if (filters.symbol?.trim()) params.set('symbol', filters.symbol.trim());
  if (filters.strategy?.trim()) params.set('strategy', filters.strategy.trim());
  if (filters.direction?.trim()) params.set('direction', filters.direction.trim());
  const qs = params.toString();
  return qs ? `/webhooks?${qs}` : '/webhooks';
}

export const webhooksApi = {
  list: (filters?: WebhookListFilters) =>
    api.get<Webhook[]>(buildListUrl(filters)),
  get: (id: string) => api.get<Webhook>(`/webhooks/${id}`),
  trigger: (payload: WebhookPayload) =>
    api.post<TriggerWebhookResponse>('/webhooks', payload),
  update: (id: string, data: { payload: WebhookPayload }) =>
    api.patch<Webhook>(`/webhooks/${id}`, data),
  delete: (id: string) => api.delete<{ deleted: boolean }>(`/webhooks/${id}`),
};
