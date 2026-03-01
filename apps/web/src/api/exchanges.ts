import { api } from './client';
import type { Exchange, CreateExchangeInput, UpdateExchangeInput } from '../types/exchange';

/** CCXT-style balance: total/free/used per currency, plus info by currency */
export interface ExchangeBalance {
  total?: Record<string, number>;
  free?: Record<string, number>;
  used?: Record<string, number>;
  info?: Record<string, unknown>;
  [key: string]: unknown;
}

export const exchangesApi = {
  list: () => api.get<Exchange[]>('/exchanges'),
  get: (id: string) => api.get<Exchange>(`/exchanges/${id}`),
  getBalance: (id: string) => api.get<ExchangeBalance>(`/exchanges/${id}/balance`),
  create: (data: CreateExchangeInput) => api.post<Exchange>('/exchanges', data),
  update: (id: string, data: UpdateExchangeInput) =>
    api.patch<Exchange>(`/exchanges/${id}`, data),
  delete: (id: string) => api.delete<{ deleted: true }>(`/exchanges/${id}`),
};
