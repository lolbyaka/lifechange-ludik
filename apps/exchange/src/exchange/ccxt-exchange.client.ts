import { BadRequestException } from '@nestjs/common';
import { ExchangeType, RootExchange } from '@prisma/client';
import { ExchangeClient, ExchangeMarket } from './exchange-client';

type CcxtRawMarket = {
  symbol?: string;
  base?: string;
  quote?: string;
  precision?: { amount?: number; price?: number };
  limits?: {
    amount?: { min?: number };
    cost?: { min?: number };
  };
  leverage?: { max?: number };
  contracts?: number;
  active?: boolean;
  status?: string;
};

type CcxtCtor = new (options: Record<string, unknown>) => {
  fetchMarkets(params?: object): Promise<CcxtRawMarket[]>;
  close?: () => Promise<void>;
};

const EXCHANGE_TYPE_TO_CCXT_ID: Record<ExchangeType, string> = {
  [ExchangeType.binance]: 'binance',
  [ExchangeType.bybit]: 'bybit',
  [ExchangeType.okx]: 'okx',
  [ExchangeType.backpack]: 'backpack',
  [ExchangeType.kraken]: 'kraken',
  [ExchangeType.hyperliquid]: 'hyperliquid',
  [ExchangeType.aster]: 'aster',
};

const EXCHANGE_DEFAULT_TYPE_FUTURES: Partial<Record<ExchangeType, string>> = {
  [ExchangeType.binance]: 'future',
  [ExchangeType.bybit]: 'future',
  [ExchangeType.okx]: 'swap',
  [ExchangeType.backpack]: 'swap',
  [ExchangeType.kraken]: 'future',
  [ExchangeType.hyperliquid]: 'swap',
  [ExchangeType.aster]: 'swap',
};

export class CcxtExchangeClient implements ExchangeClient {
  private client: InstanceType<CcxtCtor> | null = null;
  private connected = false;

  constructor(
    readonly exchangeId: string,
    readonly exchangeType: ExchangeType,
    private readonly ctor: CcxtCtor,
    private readonly options: Record<string, unknown>,
  ) {}

  async connect(): Promise<void> {
    if (this.connected && this.client) return;
    this.client = new this.ctor(this.options);
    // Simple connectivity check: try to fetch markets once
    await this.client.fetchMarkets();
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    if (!this.client) return;
    if (typeof this.client.close === 'function') {
      await this.client.close().catch(() => {});
    }
    this.connected = false;
    this.client = null;
  }

  isConnected(): boolean {
    return this.connected;
  }

  async fetchMarkets(): Promise<ExchangeMarket[]> {
    if (!this.client) {
      await this.connect();
    }
    const raw = await this.client!.fetchMarkets();
    return (raw ?? []).map((m) => this.normalizeMarket(m));
  }

  private normalizeMarket(m: CcxtRawMarket): ExchangeMarket {
    const precisionAmount =
      typeof m.precision?.amount === 'number' ? m.precision.amount : undefined;
    const precisionPrice =
      typeof m.precision?.price === 'number' ? m.precision.price : undefined;

    return {
      symbol: m.symbol ?? '',
      baseAsset: m.base,
      quoteAsset: m.quote,
      pricePrecision: precisionPrice,
      quantityPrecision: precisionAmount,
      minOrderSize:
        m.limits?.amount?.min != null && Number.isFinite(m.limits.amount.min)
          ? m.limits.amount.min
          : undefined,
      minNotional:
        m.limits?.cost?.min != null && Number.isFinite(m.limits.cost.min)
          ? m.limits.cost.min
          : undefined,
      maxLeverage:
        m.leverage?.max != null && Number.isFinite(m.leverage.max)
          ? m.leverage.max
          : undefined,
      maxPositionSize:
        m.contracts != null && Number.isFinite(m.contracts) ? m.contracts : undefined,
      status: m.status ?? (m.active === false ? 'disabled' : 'trading'),
    };
  }
}

export async function createCcxtExchangeClient(
  root: RootExchange,
): Promise<ExchangeClient> {
  const ccxtId = EXCHANGE_TYPE_TO_CCXT_ID[root.type];
  if (!ccxtId) {
    throw new BadRequestException(
      `Exchange type "${root.type}" is not supported by CCXT in exchange microservice`,
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const ccxt = require('ccxt');
  const Ctor: CcxtCtor = ccxt[ccxtId];
  if (!Ctor) {
    throw new BadRequestException(
      `CCXT does not have an exchange implementation for "${ccxtId}"`,
    );
  }

  const normalizeCred = (v: string) => v.trim().replace(/\r\n|\n|\r/g, '');
  const secret =
    typeof root.secretKey === 'string' ? normalizeCred(root.secretKey) : root.secretKey;
  const defaultType = EXCHANGE_DEFAULT_TYPE_FUTURES[root.type];

  const options: Record<string, unknown> = {
    apiKey:
      typeof root.apiKey === 'string' ? normalizeCred(root.apiKey) : root.apiKey,
    secret,
    ...(root.passphrase ? { password: normalizeCred(String(root.passphrase)) } : {}),
    enableRateLimit: true,
    ...(defaultType ? { defaultType } : {}),
  };

  if (root.walletAddress?.trim()) {
    options.walletAddress = root.walletAddress.trim();
  }
  if (root.type === ExchangeType.hyperliquid) {
    options.privateKey = secret;
  }

  return new CcxtExchangeClient(root.id, root.type, Ctor, options);
}

