/**
 * Extract symbol (ticker), strategy, and direction from webhook payload for filtering.
 */
export function extractWebhookFilters(payload: Record<string, unknown>): {
  symbol: string | null;
  strategy: string | null;
  direction: string | null;
} {
  const str = (v: unknown): string | null =>
    v != null && typeof v === 'string' && v.trim() !== '' ? v.trim() : null;

  return {
    symbol: str(payload.symbol),
    strategy: str(payload.strategy),
    direction: str(payload.direction),
  };
}
