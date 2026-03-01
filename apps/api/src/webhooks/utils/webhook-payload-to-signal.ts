/**
 * Maps a webhook payload to Signal create data.
 * Used as side effect when storing a webhook: create a Signal from the same payload.
 */
export function webhookPayloadToSignalData(payload: Record<string, unknown>): {
  strategy: string;
  symbol: string;
  slROI: string;
  tpROI: string;
  positionSize: string;
  leverage: string | null;
  longMALine: string | null;
  crossMASignalDown: string | null;
  momentumLine: string | null;
  MALine: string | null;
} | null {
  const str = (v: unknown): string =>
    v != null && typeof v === 'string' ? String(v).trim() : String(v ?? '');
  const strOpt = (v: unknown): string | null => {
    if (v == null) return null;
    const s = typeof v === 'string' ? v.trim() : String(v);
    return s !== '' ? s : null;
  };

  const strategy = str(payload.strategy) || 'unknown';
  const symbol = str(payload.symbol);
  if (!symbol) return null;

  return {
    strategy,
    symbol,
    slROI: str(payload.slROI) || '0',
    tpROI: str(payload.tpROI) || '0',
    positionSize: str(payload.positionSize) || '0',
    leverage: strOpt(payload.leverageSize) ?? strOpt(payload.leverage) ?? null,
    longMALine: strOpt(payload.longMALine) ?? null,
    crossMASignalDown: strOpt(payload.crossMASignalDown) ?? null,
    momentumLine: strOpt(payload.momentumLine) ?? null,
    MALine: strOpt(payload.MALine) ?? null,
  };
}
