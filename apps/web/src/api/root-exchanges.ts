import { api } from './client';
import type {
  RootExchange,
  CreateRootExchangeInput,
  UpdateRootExchangeInput,
} from '../types/root-exchange';

export const rootExchangesApi = {
  list: () => api.get<RootExchange[]>('/root-exchanges'),
  get: (id: string) => api.get<RootExchange>(`/root-exchanges/${id}`),
  create: (data: CreateRootExchangeInput) => api.post<RootExchange>('/root-exchanges', data),
  update: (id: string, data: UpdateRootExchangeInput) =>
    api.patch<RootExchange>(`/root-exchanges/${id}`, data),
  delete: (id: string) => api.delete<{ deleted: true }>(`/root-exchanges/${id}`),
};

