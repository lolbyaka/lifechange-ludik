import { api } from './client';
import type {
  TradeBot,
  CreateTradeBotInput,
  UpdateTradeBotInput,
} from '../types/bot';

export const botsApi = {
  list: (exchangeId?: string) =>
    api.get<TradeBot[]>(
      exchangeId ? `/bots?exchangeId=${encodeURIComponent(exchangeId)}` : '/bots',
    ),
  get: (id: string) => api.get<TradeBot>(`/bots/${id}`),
  create: (data: CreateTradeBotInput) => api.post<TradeBot>('/bots', data),
  update: (id: string, data: UpdateTradeBotInput) =>
    api.patch<TradeBot>(`/bots/${id}`, data),
  delete: (id: string) => api.delete<{ deleted: true }>(`/bots/${id}`),
};
