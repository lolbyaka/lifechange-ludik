export const EXCHANGE_TYPES = [
  'binance',
  'bybit',
  'okx',
  'backpack',
  'kraken',
  'hyperliquid',
  'aster',
] as const;

export type ExchangeType = (typeof EXCHANGE_TYPES)[number];

export interface Exchange {
  id: string;
  name: string | null;
  apiKey: string;
  secretKey: string;
  passphrase: string | null;
  walletAddress: string | null;
  type: ExchangeType;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExchangeInput {
  name?: string;
  apiKey: string;
  secretKey: string;
  passphrase?: string;
  walletAddress?: string;
  type: ExchangeType;
}

export interface UpdateExchangeInput {
  name?: string;
  apiKey?: string;
  secretKey?: string;
  passphrase?: string;
  walletAddress?: string;
  type?: ExchangeType;
}
