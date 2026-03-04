import type { ExchangeType } from './exchange';

export interface RootExchange {
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

export interface CreateRootExchangeInput {
  name?: string;
  apiKey: string;
  secretKey: string;
  passphrase?: string;
  walletAddress?: string;
  type: ExchangeType;
}

export interface UpdateRootExchangeInput {
  name?: string;
  apiKey?: string;
  secretKey?: string;
  passphrase?: string;
  walletAddress?: string;
  type?: ExchangeType;
}

