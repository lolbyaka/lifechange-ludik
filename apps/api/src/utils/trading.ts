/**
 * Number of decimal places for a step value (handles scientific notation, e.g. 1e-4 → 4).
 */
function stepPrecision(step: number): number {
  const str = step.toString();
  if (str.includes('e')) {
    const exp = parseInt(str.split('e')[1], 10);
    return Number.isFinite(exp) && exp < 0 ? Math.abs(exp) : 0;
  }
  if (str.includes('.')) return str.split('.')[1].length;
  return step >= 1 ? 0 : 0;
}

// /**
//  * Round quantity to exchange step size (e.g. 0.001).
//  * Uses floor to avoid exceeding allowed size; stepSize can be string or number.
//  */
// export function roundQuantity(quantity: number, stepSize: string | number | null): number {
//   if (quantity <= 0 || !Number.isFinite(quantity)) return 0;
//   if (stepSize == null || stepSize === '') return quantity;
//   const step = typeof stepSize === 'string' ? parseFloat(stepSize) : stepSize;
//   if (!Number.isFinite(step) || step <= 0) return quantity;
//   const precision = stepPrecision(step);
//   const factor = 10 ** precision;
//   const rounded = Math.floor(quantity / step) * step;
//   return Math.round(rounded * factor) / factor;
// }

/**
 * Round price to exchange tick size (e.g. 0.01).
 * tickSize can be string or number.
 */
export function roundPrice(price: number, tickSize: string | number | null): number {
  if (!Number.isFinite(price) || price <= 0) return price;
  if (tickSize == null || tickSize === '') return price;
  const tick = typeof tickSize === 'string' ? parseFloat(tickSize) : tickSize;
  if (!Number.isFinite(tick) || tick <= 0) return price;
  const precision = stepPrecision(tick);
  const factor = 10 ** precision;
  const rounded = Math.round(price / tick) * tick;
  return Math.round(rounded * factor) / factor;
}

/**
 * Round quantity to appropriate precision based on stepSize
 * @param {number} quantity - Quantity to round
 * @param {string|null} stepSize - Step size from market info (e.g., "0.001")
 * @returns {number} - Rounded quantity
 */
export function roundQuantity(quantity, stepSize) {
  if (!stepSize || stepSize === '0' || stepSize === '0.0') {
    // If no stepSize, use conservative rounding (6 decimal places)
    return Math.floor(quantity * 1000000) / 1000000;
  }
  
  const stepSizeNum = parseFloat(stepSize);
  if (isNaN(stepSizeNum) || stepSizeNum <= 0) {
    // Fallback to 6 decimal places
    return Math.floor(quantity * 1000000) / 1000000;
  }
  
  // Calculate number of decimal places from stepSize
  // e.g., stepSize "0.001" means 3 decimal places, "0.00001" means 5 decimal places
  const stepSizeStr = stepSize.toString();
  if (stepSizeStr.includes('.')) {
    const decimals = stepSizeStr.split('.')[1].length;
    const multiplier = Math.pow(10, decimals);
    return Math.floor(quantity * multiplier) / multiplier;
  } else {
    // If stepSize is >= 1, round to integer
    return Math.floor(quantity);
  }
}

/** Map LONG/SHORT to CCXT side (buy/sell). */
export function directionToSide(direction: string): 'buy' | 'sell' {
  const u = direction.toUpperCase();
  return u === 'SHORT' ? 'sell' : 'buy';
}

/**
 * Find existing open position for a symbol from CCXT fetchPositions result.
 * Position is identified by symbol and non-zero net quantity.
 */
export function findExistingPosition(
  positions: unknown[],
  symbol: string,
): Record<string, unknown> | null {
  const found = positions.find((p) => {
    const pos = p as Record<string, unknown>;
    const posSymbol = (pos.market ?? pos.symbol) as string;

    return posSymbol === symbol;
  });
  return (found as Record<string, unknown>) ?? null;
}

/**
 * Get position side (LONG or SHORT) from position object.
 */
export function getPositionSide(position: Record<string, unknown>): 'LONG' | 'SHORT' {
  const netQ = parseFloat(
    String(position.netQuantity ?? position.netExposureQuantity ?? 0),
  );
  return netQ > 0 ? 'LONG' : 'SHORT';
}
