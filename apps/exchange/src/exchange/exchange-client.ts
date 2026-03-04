import { ExchangeType, RootExchange } from '@prisma/client';

export type ExchangeMarket = {
  symbol: string;
  baseAsset?: string;
  quoteAsset?: string;
  pricePrecision?: number;
  quantityPrecision?: number;
  minOrderSize?: number;
  minNotional?: number;
  maxLeverage?: number;
  maxPositionSize?: number;
  status?: string;
};

export interface ExchangeClient {
  readonly exchangeId: string;
  readonly exchangeType: ExchangeType;

  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;

  /**
   * Fetch and normalize markets from the underlying exchange.
   */
  fetchMarkets(): Promise<ExchangeMarket[]>;
}

export type ExchangeClientFactory = (root: RootExchange) => Promise<ExchangeClient>;

