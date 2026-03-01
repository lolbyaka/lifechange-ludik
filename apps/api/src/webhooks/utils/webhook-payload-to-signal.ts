/**
 * Derive LONG/SHORT direction from MA/momentum fields (Momentum strategy).
 * Same logic as legacy: LONG when momentumLine > longMALine && crossMASignalUp === 1,
 * SHORT when momentumLine < longMALine && crossMASignalDown === 1.
 */
export function deriveDirectionFromMA(payload: {
  longMALine?: string | null;
  crossMASignalDown?: string | null;
  crossMASignalUp?: string | null;
  momentumLine?: string | null;
}): 'LONG' | 'SHORT' | null {
  const longMALine = payload.longMALine != null ? Number(payload.longMALine) : NaN;
  const crossMASignalDown = payload.crossMASignalDown != null ? Number(payload.crossMASignalDown) : NaN;
  const crossMASignalUp = payload.crossMASignalUp != null ? Number(payload.crossMASignalUp) : NaN;
  const momentumLine = payload.momentumLine != null ? Number(payload.momentumLine) : NaN;
  if (Number(momentumLine) > Number(longMALine) && crossMASignalUp === 1) return 'LONG';
  if (Number(momentumLine) < Number(longMALine) && crossMASignalDown === 1) return 'SHORT';
  return null;
}

/**
 * Maps a webhook payload to Signal create data.
 * Used as side effect when storing a webhook: create a Signal from the same payload.
 * Direction: from payload.direction if present (LONG/SHORT), else derived from MA/momentum.
 */
export function webhookPayloadToSignalData(payload: Record<string, unknown>): {
  strategy: string;
  symbol: string;
  direction: string | null;
  slROI: string;
  tpROI: string;
  positionSize: string;
  leverage: string | null;
  longMALine: string | null;
  crossMASignalDown: string | null;
  crossMASignalUp: string | null;
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

  const longMALine = strOpt(payload.longMALine) ?? null;
  const crossMASignalDown = strOpt(payload.crossMASignalDown) ?? null;
  const crossMASignalUp = strOpt(payload.crossMASignalUp) ?? null;
  const momentumLine = strOpt(payload.momentumLine) ?? null;

  let direction: string | null = strOpt(payload.direction);
  if (direction) {
    const u = direction.toUpperCase();
    if (u === 'LONG' || u === 'SHORT') direction = u;
    else direction = null;
  }
  if (!direction) {
    const derived = deriveDirectionFromMA({
      longMALine,
      crossMASignalDown,
      crossMASignalUp,
      momentumLine,
    });
    direction = derived;
  }

  return {
    strategy,
    symbol,
    direction,
    slROI: str(payload.slROI) || '0',
    tpROI: str(payload.tpROI) || '0',
    positionSize: str(payload.positionSize) || '0',
    leverage: strOpt(payload.leverageSize) ?? strOpt(payload.leverage) ?? null,
    longMALine,
    crossMASignalDown,
    crossMASignalUp,
    momentumLine,
    MALine: strOpt(payload.MALine) ?? null,
  };
}
