import { api } from './client';
import type {
  Exchange,
  CreateExchangeInput,
  UpdateExchangeInput,
  ExchangeType,
} from '../types/exchange';

/** CCXT-style balance: total/free/used per currency, plus info by currency */
export interface ExchangeBalance {
  total?: Record<string, number>;
  free?: Record<string, number>;
  used?: Record<string, number>;
  info?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface ExchangeHealth {
  status: 'connected' | 'disconnected' | 'unknown';
  type?: ExchangeType;
  timestamp?: string;
  reason?: string | null;
  [key: string]: unknown;
}

/** Single exchange load result (success or error) */
export interface LoadMarketsResult {
  exchangeId: string;
  name: string;
  success: boolean;
  count?: number;
  error?: string;
}

/** GET /exchanges/:id/markets response */
export interface ExchangeMarketsResponse {
  markets: CcxtMarket[];
  loadedAt: number | null;
}

/** CCXT market (common fields) */
export interface CcxtMarket {
  id?: string;
  symbol?: string;
  base?: string;
  quote?: string;
  type?: string;
  active?: boolean;
  [key: string]: unknown;
}

/** CCXT ticker (common fields) */
export interface CcxtTicker {
  symbol?: string;
  last?: number;
  change?: number;
  percentage?: number;
  baseVolume?: number;
  quoteVolume?: number;
  bid?: number;
  ask?: number;
  high?: number;
  low?: number;
  timestamp?: number;
  [key: string]: unknown;
}

export const exchangesApi = {
  list: () => api.get<Exchange[]>('/exchanges'),
  get: (id: string) => api.get<Exchange>(`/exchanges/${id}`),
  getHealth: (id: string) => api.get<ExchangeHealth>(`/exchanges/${id}/health`),
  getBalance: (id: string) => api.get<ExchangeBalance>(`/exchanges/${id}/balance`),
  getMarkets: (id: string) => api.get<ExchangeMarketsResponse>(`/exchanges/${id}/markets`),
  getTickers: (id: string) => api.get<Record<string, CcxtTicker>>(`/exchanges/${id}/tickers`),
  /** Force-load markets from exchange (refresh cache). Returns markets array. */
  loadMarkets: (id: string) =>
    api.post<unknown[]>(`/exchanges/${id}/markets/load`, {}),
  create: (data: CreateExchangeInput) => api.post<Exchange>('/exchanges', data),
  update: (id: string, data: UpdateExchangeInput) =>
    api.patch<Exchange>(`/exchanges/${id}`, data),
  delete: (id: string) => api.delete<{ deleted: true }>(`/exchanges/${id}`),
};
