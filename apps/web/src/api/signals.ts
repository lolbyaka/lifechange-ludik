import { api } from './client';
import type { Signal } from '../types/signal';

export const signalsApi = {
  list: () => api.get<Signal[]>('/signals'),
  get: (id: string) => api.get<Signal>(`/signals/${id}`),
};
