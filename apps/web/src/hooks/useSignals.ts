import { useQuery } from '@tanstack/react-query';
import { signalsApi } from '../api/signals';

const QUERY_KEY = ['signals'] as const;

export function useSignals() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => signalsApi.list(),
  });
}

export function useSignal(id: string | null) {
  return useQuery({
    queryKey: [...QUERY_KEY, id],
    queryFn: () => (id ? signalsApi.get(id) : Promise.reject(new Error('No id'))),
    enabled: !!id,
  });
}
